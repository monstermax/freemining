
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

import { now, getOpt, getLocalIpAddresses } from '../common/utils';
import { exec } from '../common/exec';
import { minersInstalls, minersCommands } from './minersConfigs';

import type *  as t from '../common/types';
import type childProcess from 'child_process';



/* ########## MAIN ######### */

const SEP = path.sep;

const processes: t.MapString<t.Process> = {};

let monitorIntervalId: ReturnType<typeof setInterval> | null = null;

const defaultPollDelay = 10_000; // 10 seconds

const minersInfos: t.MapString<any> = {};


/* ########## FUNCTIONS ######### */

/**
 * Start rig monitor (poll running processes API every x seconds)
 * 
 * ./ts-node frm-cli.ts --rig-monitor-start
 */
export function monitorStart(config: t.Config, params: t.MapString<any>) {
    if (monitorIntervalId) {
        return;
    }

    const pollDelay = Number(getOpt('--poll-delay')) || defaultPollDelay;
    monitorIntervalId = setInterval(monitorCheckRig, pollDelay, config);

    console.log(`${now()} [INFO] [RIG] Rig monitor started`);
}

/**
 * Stop rig monitor
 * 
 * ./ts-node frm-cli.ts --rig-monitor-stop
 */
export function monitorStop(config: t.Config, params: t.MapString<any>) {
    if (monitorIntervalId) {
        clearInterval(monitorIntervalId);
        monitorIntervalId = null;

        console.log(`${now()} [INFO] [RIG] Rig monitor stopped`);
    }
}



/**
 * Check rig active processes
 * 
 */
export async function monitorCheckRig(config: t.Config): Promise<void> {
    // check all services

    let procId: string;
    for (procId in processes) {
        const proc = processes[procId];

        if (proc.type === 'miner-run') {
            const minerCommands = minersCommands[proc.name];

            let minerInfos: any;
            try {
                minerInfos = await minerCommands.getInfos(config, {});
                minerInfos.dataDate = new Date;
                minersInfos[proc.name] = minerInfos;

            } catch (err: any) {
                //throw { message: err.message };
                delete minersInfos[proc.name];
            }
        }
    }
}



export async function minerInstallStart(config: t.Config, params: t.MapString<any>): Promise<any> {
    if ((params.miner + '/install') in processes) {
        throw { message: `Miner ${params.miner} install is already running` };
    }

    if (! (params.miner in minersCommands)) {
        throw { message: `Unknown miner ${params.miner}` };
    }

    const minerInstall = minersInstalls[params.miner];
    minerInstall.install(config, params);
}


export async function minerRunStart(config: t.Config, params: t.MapString<any>): Promise<t.Process> {
    if (! params.miner) {
        throw { message: `Missing '-miner' parameter` };
    }

    if (`miner-run-${params.miner}` in processes) {
        throw { message: `Miner ${params.miner} run is already running` };
    }

    if (! (params.miner in minersCommands)) {
        throw { message: `Unknown miner ${params.miner}` };
    }

    const minerCommands = minersCommands[params.miner];
    const cmdFile = minerCommands.getCommandFile(config, params);
    const args = minerCommands.getCommandArgs(config, params);

    const runningDir = `${config.dataDir}${SEP}rig${SEP}miners${SEP}${params.miner}`;
    const appDir     = `${config.appDir}${SEP}rig${SEP}miners${SEP}${params.miner}`;
    const cmdPath    = `${appDir}${SEP}${cmdFile}`;

    const logDir     = `${config.logDir}${SEP}rig${SEP}miners`;
    const logFile    = `${logDir}${SEP}${params.miner}.run.log`;
    const errFile    = `${logDir}${SEP}${params.miner}.run.err`;
    const pidDir     = `${config.pidDir}${SEP}rig${SEP}miners`;
    const pidFile    = `${pidDir}${SEP}${params.miner}.run.pid`;

    fs.mkdirSync(logDir, { recursive: true });
    fs.mkdirSync(pidDir, { recursive: true });
    fs.mkdirSync(runningDir, { recursive: true });

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

    if (! fs.existsSync(runningDir)) {
        throw { message: `Miner ${params.miner} dataDir is misconfigured` };
    }


    const process: t.Process = {
        type: 'miner-run',
        name: params.miner,
        cmdFile,
        args,
        runningDir,
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

    exec(cmdPath, args, '', runningDir, onSpawn, onStdOut, onStdErr, onEnd, processName)
        .catch((err: any) => {
            console.warn(`${now()} [WARNING] [RIG] PROCESS ERROR ${params.miner} : ${err.message}`);
        });

    return processes[`miner-run-${params.miner}`];
}


export async function minerRunStop(config: t.Config, params: t.MapString<any>, forceKill: boolean=false): Promise<void> {
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



export function minerRunStatus(config: t.Config, params: t.MapString<any>) {
    // TODO
}


export async function minerRunInfos(config: t.Config, params: t.MapString<any>): Promise<t.MinerInfos> {
    //if (! (`miner-run-${params.miner}` in processes)) {
    //    throw { message: `Miner ${params.miner} is not running` };
    //}

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



export function getRigInfos(): t.Rig {

    const name = getOpt('--rig-name') || os.hostname();
    const hostname = os.hostname();
    const ip = (getLocalIpAddresses() || [])[0] || 'no-ip';
    const rigOs = os.version();
    const uptime = os.uptime();
    const loadAvg = os.loadavg()[0];
    const memoryUsed = os.totalmem() - os.freemem();
    const memoryTotal = os.totalmem();

    const _cpus = os.cpus()
    const cpus: any[] = [
        {
            name: _cpus[0].model,
            threads: _cpus.length,
            avgSpeed: _cpus.map(cpu => cpu.speed).reduce((a, b) => a + b, 0) / _cpus.length,
        }
    ];

    let gpuList: string;
    if (os.platform() === 'linux') {
        gpuList = execSync(`lspci | grep VGA |cut -d' ' -f5-`).toString().trim(); 
        // detailed output: 
        // lspci -nnkd ::300

        // temperatures & fanSpeeed [NVIDIA]
        // nvidia-smi --query-gpu=temperature.gpu,fan.speed --format=csv,noheader,nounits

/*
04:00.0 VGA compatible controller: Intel Corporation UHD Graphics 630 (Mobile)
07:00.0 VGA compatible controller: NVIDIA Corporation GP104M [GeForce GTX 1070 Mobile] (rev a1)
*/

    } else if (os.platform() === 'win32') {
        // detailed output: 
        // dxdiag /t dxdiag.txt && find "Display Devices" -A 5 dxdiag.txt && del dxdiag.txt

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
        };
    });

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
    }

    return rigInfos;
}

