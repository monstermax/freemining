
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

import { now, getOpt, getLocalIpAddresses, getDirFiles, tailFile, stringTemplate } from '../common/utils';
import { exec } from '../common/exec';
import { minersInstalls, minersCommands } from './minersConfigs';

import type *  as t from '../common/types';
import type childProcess from 'child_process';


// GPU infos for windows: https://github.com/FallingSnow/gpu-info


/* ########## MAIN ######### */

const SEP = path.sep;

const processes: t.MapString<t.Process> = {};

let monitorIntervalId: ReturnType<typeof setInterval> | null = null;

const defaultPollDelay = 10_000; // 10 seconds

const minersInfos: t.MapString<any> = {};

let rigMainInfos: any | null = null;
let dateLastCheck: number | null = null;


/* ########## FUNCTIONS ######### */

/**
 * Start rig monitor (poll running processes API every x seconds)
 * 
 * ./ts-node frm-cli.ts --rig-monitor-start
 */
export function monitorStart(config: t.Config, params?: t.MapString<any>): void {
    if (monitorIntervalId) {
        return;
    }

    const pollDelay = Number(getOpt('--rig-monitor-poll-delay')) || defaultPollDelay;
    monitorIntervalId = setInterval(monitorCheckRig, pollDelay, config);

    console.log(`${now()} [INFO] [RIG] Rig monitor started`);
}

/**
 * Stop rig monitor
 * 
 * ./ts-node frm-cli.ts --rig-monitor-stop
 */
export function monitorStop(config?: t.Config, params?: t.MapString<any>): void {
    if (monitorIntervalId) {
        clearInterval(monitorIntervalId);
        monitorIntervalId = null;

        console.log(`${now()} [INFO] [RIG] Rig monitor stopped`);
    }
}


export function monitorStatus(config?: t.Config, params?: t.MapString<any>): boolean {
    return monitorIntervalId !== null;
}



/**
 * Check rig active processes
 * 
 */
export async function monitorCheckRig(config: t.Config): Promise<void> {
    // check all services

    let procId: string;
    const viewedMiners = [];
    for (procId in processes) {
        const proc = processes[procId];

        if (proc.type === 'miner-run') {
            const minerCommands = minersCommands[proc.name];
            viewedMiners.push(proc.name);

            let minerInfos: any;
            try {
                minerInfos = await minerCommands.getInfos(config, {});
                minerInfos.dataDate = Date.now();
                minersInfos[proc.name] = minerInfos;

            } catch (err: any) {
                //throw { message: err.message };
                delete minersInfos[proc.name];
            }
        }
    }

    for (const minerName in minersInfos) {
        if (! viewedMiners.includes(minerName)) {
            delete minersInfos[minerName];
        }
    }

    dateLastCheck = Date.now();
}



export async function getInstalledMiners(config: t.Config, params?: t.MapString<any>): Promise<string[]> {
    const minersDir = `${config?.appDir}${SEP}rig${SEP}miners`
    const minersNames = await getDirFiles(minersDir);
    return minersNames;
}


export function getRunningMiners(config: t.Config, params?: t.MapString<any>): string[] {
    //const rigInfos = getRigInfos();
    //const runningMiners = Object.keys(rigInfos.minersInfos);

    let procName: string;
    let rigProcesses = getProcesses();
    const runningMiners: string[] = [];

    for (procName in rigProcesses) {
        const proc = rigProcesses[procName];
        if (! proc.process) continue;
        runningMiners.push(proc.name);
    }

    return runningMiners;
}


export function getInstallableMiners(config: t.Config, params?: t.MapString<any>): string[] {
    return Object.entries(minersInstalls).map(entry => {
        const [minerName, minerInstall] = entry;
        if (minerInstall.version === 'edit-me') return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}


export function getRunnableMiners(config: t.Config, params?: t.MapString<any>): string[] {
    return Object.entries(minersCommands).map(entry => {
        const [minerName, minerCommand] = entry;
        if (minerCommand.command === 'edit-me') return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}


export function getManagedMiners(config: t.Config, params?: t.MapString<any>): string[] {
    return Object.entries(minersCommands).map(entry => {
        const [minerName, minerCommand] = entry;
        if (minerCommand.apiPort === -1) return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}


export async function minerInstallStart(config: t.Config, params: t.MapString<any>): Promise<void> {
    if ((params.miner + '/install') in processes) {
        throw { message: `Miner ${params.miner} install is already running` };
    }

    if (! (params.miner in minersCommands)) {
        throw { message: `Unknown miner ${params.miner}` };
    }

    const minerInstall = minersInstalls[params.miner];
    return minerInstall.install(config, params);
}


export async function minerRunStart(config: t.Config, params: t.MapString<any>): Promise<t.Process> {
    if (! params.miner) {
        throw { message: `Missing miner parameter` };
    }

    if (`miner-run-${params.miner}` in processes) {
        throw { message: `Miner ${params.miner} run is already running` };
    }

    if (! (params.miner in minersCommands)) {
        throw { message: `Unknown miner ${params.miner}` };
    }

    const rigInfos = getRigInfos();
    const opts = {
        rigName: rigInfos.infos.name,
    };
    params.poolUser = stringTemplate(params.poolUser, opts, false, false, false);

    const minerCommands = minersCommands[params.miner];
    const cmdFile = minerCommands.getCommandFile(config, params);
    const args = minerCommands.getCommandArgs(config, params);

    const dataDir  = `${config.dataDir}${SEP}rig${SEP}miners${SEP}${params.miner}`;
    const appDir   = `${config.appDir}${SEP}rig${SEP}miners${SEP}${params.miner}`;
    const cmdPath  = `${appDir}${SEP}${cmdFile}`;

    const logDir   = `${config.logDir}${SEP}rig${SEP}miners`;
    const logFile  = `${logDir}${SEP}${params.miner}.run.log`;
    const errFile  = `${logDir}${SEP}${params.miner}.run.err`;
    const pidDir   = `${config.pidDir}${SEP}rig${SEP}miners`;
    const pidFile  = `${pidDir}${SEP}${params.miner}.run.pid`;

    fs.mkdirSync(dataDir, { recursive: true });
    fs.mkdirSync(logDir, { recursive: true });
    fs.mkdirSync(pidDir, { recursive: true });

    if (true) {
        // truncate log files
        fs.writeFileSync(logFile, '');
        fs.writeFileSync(errFile, '');
    }

    if (! fs.existsSync(appDir)) {
        throw { message: `Miner ${params.miner} is not installed` };
    }

    if (! fs.existsSync(cmdPath)) {
        throw { message: `Miner ${params.miner} cmdPath is misconfigured` };
    }


    const process: t.Process = {
        type: 'miner-run',
        name: params.miner,
        cmdFile,
        args,
        dataDir,
        appDir,
        cmdPath,
        pid: undefined,
        process: undefined
    };
    processes[`miner-run-${params.miner}`] = process;

    const processName = `[freemining-beta.rig.miners.${params.miner}] ${cmdPath}`;


    console.log(`${now()} [INFO] [RIG] Miner Run Start: ${params.miner}`);

    const onSpawn: t.ExecOnSpawn = function (proc) {
        processes[`miner-run-${params.miner}`].pid = proc.pid;
        processes[`miner-run-${params.miner}`].process = proc;
        fs.writeFileSync(pidFile, (proc.pid || -1).toString());
    }
    const onStdOut: t.ExecOnStdOut = function (data) {
        //console.log('RECEIVED FROM CMD STDOUT:', data.toString());
        fs.appendFileSync(logFile, data);
    }
    const onStdErr: t.ExecOnStdErr = function (data) {
        //console.log('RECEIVED FROM CMD STDERR:', data.toString());
        fs.appendFileSync(logFile, data);
        fs.appendFileSync(errFile, data);
    }
    const onEnd: t.ExecOnEnd = function (returnCode, err) {
        delete processes[`miner-run-${params.miner}`];
        fs.rmSync(pidFile, { force: true });
        console.debug(`${now()} [DEBUG] [RIG] PROCESS COMPLETED ${params.miner} (rc: ${returnCode})`);
    }

    //console.debug(`${now()} [DEBUG] [RIG] Running command: ${cmdPath} ${args.join(' ')}`);

    exec(cmdPath, args, '', dataDir, onSpawn, onStdOut, onStdErr, onEnd, processName)
        .catch((err: any) => {
            console.warn(`${now()} [WARNING] [RIG] PROCESS ERROR ${params.miner} : ${err.message}`);
        });

    return processes[`miner-run-${params.miner}`];
}


export function minerRunStop(config: t.Config, params: t.MapString<any>, forceKill: boolean=false): void {
    if (! (`miner-run-${params.miner}` in processes)) {
        throw { message: `Miner ${params.miner} is not running` };
    }
    const proc = processes[`miner-run-${params.miner}`];

    if (! proc.process) {
        throw { message: `Miner ${params.miner} process is not killable` };
    }

    const signal = forceKill ? 'SIGKILL' : 'SIGINT';
    console.debug(`${now()} [DEBUG] [RIG] KILLING PROCESS ${params.miner} with signal ${signal}...`);
    proc.process.kill(signal);
}



export function minerRunStatus(config: t.Config, params: t.MapString<any>): boolean {
    if (! (`miner-run-${params.miner}` in processes)) {
        return false;
    }
    const proc = processes[`miner-run-${params.miner}`];

    if (! proc.process) {
        return false;
    }

    return proc.process.exitCode === null;
}


export async function minerRunLog(config: t.Config, params: t.MapString<any>): Promise<string> {
    const logFile = `${config.logDir}${SEP}rig${SEP}miners${SEP}${params.miner}.run.log`;
    if (! fs.existsSync(logFile)) {
        return '';
    }

    let text = await tailFile(logFile, params.lines || 50);
    text = text.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors

    return text;
}


export async function minerRunInfos(config: t.Config, params: t.MapString<any>): Promise<t.MinerInfos> {
    if (! (`miner-run-${params.miner}` in processes)) {
        throw { message: `Miner ${params.miner} is not running` };
    }

    if (! (params.miner in minersCommands)) {
        throw { message: `Unknown miner ${params.miner}` };
    }

    const miner = minersCommands[params.miner];

    let minerInfos: any;
    try {
        minerInfos = await miner.getInfos(config, params);

    } catch (err: any) {
        throw { message: err.message };
    }

    return minerInfos;
}


export function getProcesses(): t.MapString<t.Process> {
    return processes;
}



export function getRigPs(): any {
    let cmd = '';
    cmd = `ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining-beta\.rig\.") |grep -e '\[free[m]ining.*\]' --color -B1`; // linux
    //cmd = `tasklist /v /fo csv`;
    //cmd = `tasklist /v /fo csv /fi "pid eq <pid>"`;
    //cmd = `tasklist /v /fo csv /fi "ppid eq <pid>"`;
    //cmd = `wmic process where "ProcessId=<pid>" get ProcessId,PercentProcessorTime`;
    //cmd = `wmic process where "ParentProcessId=<pid>" get ProcessId,Name`;
}

export function getRigInfos(): t.Rig {

    if (rigMainInfos === null) {

        const _cpus = os.cpus()
        const cpus: any[] = [
            {
                name: _cpus[0].model.trim(),
                threads: _cpus.length,
            }
        ];

        let gpuList: string;
        if (os.platform() === 'linux') {
            gpuList = execSync(`lspci | grep VGA |cut -d' ' -f5-`).toString().trim();
            /*
            04:00.0 VGA compatible controller: Intel Corporation UHD Graphics 630 (Mobile)
            07:00.0 VGA compatible controller: NVIDIA Corporation GP104M [GeForce GTX 1070 Mobile] (rev a1)
            */

            // detailed output: 
            // lspci -nnkd ::300

            // temperatures & fanSpeeed [NVIDIA]
            // nvidia-smi --query-gpu=temperature.gpu,fan.speed --format=csv,noheader,nounits


        } else if (os.platform() === 'win32') {
            // detailed output: 
            // dxdiag /t dxdiag.txt && find "Display Devices" -A 5 dxdiag.txt && del dxdiag.txt

            gpuList = execSync('wmic path win32_VideoController get Name').toString().trim();
            let tmpArr = gpuList.split(os.EOL);
            tmpArr.shift();
            tmpArr = tmpArr.map(item => item.trim());
            gpuList = tmpArr.join(os.EOL);
            /*
            Name
            Intel(R) HD Graphics 630
                NVIDIA GeForce GTX 1070
            */

            /*
            // temperatures & fanSpeeed
            const MSI_Afterburner = require('msi-afterburner-api');
            const afterburner = new MSI_Afterburner();
            afterburner.init()
                .then(() => {
                    afterburner.getSystemInfo()
                        .then((systemInfo) => {
                            console.log(`Number of GPUs: ${systemInfo.adapters.length}`);
                            systemInfo.adapters.forEach((adapter) => {
                                console.log(`GPU ${adapter.index}:`);
                                console.log(`  Temperature: ${adapter.temperature}°C`);
                                console.log(`  Fan Speed: ${adapter.fanSpeed}%`);
                            });
                        })
                        .catch((err) => console.error(err));
                })
                .catch((err) => console.error(err));
            */

        } else if (os.platform() === 'darwin') {
            gpuList = execSync(`system_profiler SPDisplaysDataType | grep "Chipset Model" | cut -d" " -f3-`).toString().trim();
            /*
            Chipset Model: AMD Radeon Pro 555X
            Chipset Model: AMD Radeon Pro 560X
            */

            // temperatures & fanSpeeed
            // iStats gpu --temp
            // requires iStats => gem install iStats
        } else {
            gpuList = '';
        }
        const gpus: any[] = gpuList.split(os.EOL).map((gpuName: string, idx: number) => {
            return {
                id: idx,
                name: gpuName,
                driver: '', // TODO
            };
        });


        rigMainInfos = {
            name: getOpt('--rig-name') || os.hostname(),
            hostname: os.hostname(),
            ip: (getLocalIpAddresses() || [])[0] || 'no-ip',
            rigOs: os.version(),
            cpus,
            gpus,
        };
    }

    const { name, hostname, ip, rigOs, cpus, gpus } = rigMainInfos;
    const uptime = os.uptime();
    const loadAvg = os.loadavg()[0];
    const memoryUsed = os.totalmem() - os.freemem();
    const memoryTotal = os.totalmem();

    const rigInfos: t.Rig = {
        infos: {
            name,
            hostname,
            ip,
            os: rigOs,
            uptime,
        },
        usage: {
            loadAvg,
            memory: {
                used: memoryUsed,
                total: memoryTotal,
            },
        },
        devices: {
            cpus,
            gpus,
        },
        minersInfos,
        dataDate: dateLastCheck,
    }

    return rigInfos;
}



export async function getAllMiners(config: t.Config): Promise<any> {
    const installedMiners = await getInstalledMiners(config);
    const runningMiners = getRunningMiners(config);
    const installableMiners = getInstallableMiners(config); // TODO: mettre en cache
    const runnableMiners = getRunnableMiners(config); // TODO: mettre en cache
    const managedMiners = getManagedMiners(config); // TODO: mettre en cache

    const minersNames = Array.from(
        new Set( [
            ...installedMiners,
            ...runningMiners,
            ...installableMiners,
            ...runnableMiners,
            ...managedMiners,
        ])
    );

    const miners: any = Object.fromEntries(
        minersNames.map(minerName => {
            return [
                minerName,
                {
                    installed: installedMiners.includes(minerName),
                    running: runningMiners.includes(minerName),
                    installable: installableMiners.includes(minerName),
                    runnable: runnableMiners.includes(minerName),
                    managed: managedMiners.includes(minerName),
                }
            ]
        })
    );

    /*
    // result: 
    miners = {
        miner1: {
            installed: boolean,
            running: boolean,
            installable: boolean,
            runnable: boolean,
            managed: boolean,
        },
        ...
    }
    */

    return miners;
}

