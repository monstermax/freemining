
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

import { now, getOpt, getLocalIpAddresses, getDirFiles, tailFile, stringTemplate } from '../common/utils';
import { exec } from '../common/exec';
import { minersInstalls, minersCommands } from './minersConfigs';
import * as rigFarmAgentWebsocket from './rigFarmAgentWebsocket';
import * as Daemon from '../core/Daemon';

import type *  as t from '../common/types';
//import type childProcess from 'child_process';


// GPU infos for windows: https://github.com/FallingSnow/gpu-info


/* ########## MAIN ######### */

const SEP = path.sep;

const processes: { [processName: string]: t.Process } = {};
//const installs: t.MapString<any> = {}; // TODO: insert l'install en cours, puis delete à la fin de l'install

let monitorIntervalId: ReturnType<typeof setInterval> | null = null;

const defaultPollDelay = 10_000; // 10 seconds

const minersStats: { [minerFullName: string]: t.MinerStats } = {};

let rigMainInfos: any | null = null;
let dateLastCheck: number;


/* ########## FUNCTIONS ######### */

/**
 * Start rig monitor (poll running processes API every x seconds)
 * 
 * ./ts-node frm-cli.ts --rig-monitor-start
 */
export function monitorStart(config: t.DaemonConfigAll): void {
    if (monitorIntervalId) return;

    /* await */ monitorAutoCheckRig(config);

    console.log(`${now()} [INFO] [RIG] Rig monitor started`);
}

/**
 * Stop rig monitor
 * 
 * ./ts-node frm-cli.ts --rig-monitor-stop
 */
export function monitorStop(): void {
    if (! monitorIntervalId) return;

    clearTimeout(monitorIntervalId);
    monitorIntervalId = null;

    console.log(`${now()} [INFO] [RIG] Rig monitor stopped`);
}


export function monitorGetStatus(): boolean {
    return monitorIntervalId !== null;
}


export function farmAgentStart(config: t.DaemonConfigAll): void {
    rigFarmAgentWebsocket.start(config);
    console.log(`${now()} [INFO] [RIG] Farm agent started`);
}


export function farmAgentStop(): void {
    rigFarmAgentWebsocket.stop();
    console.log(`${now()} [INFO] [RIG] Farm agent stopped`);
}

export function farmAgentGetStatus(): boolean {
    return rigFarmAgentWebsocket.status();
}


async function monitorAutoCheckRig(config: t.DaemonConfigAll) {
    const pollDelay = Number(getOpt('--rig-monitor-poll-delay')) || defaultPollDelay;

    if (monitorIntervalId) {
        clearTimeout(monitorIntervalId);
    }

    await monitorCheckRig(config);

    if (farmAgentGetStatus()) {
        rigFarmAgentWebsocket.sendRigStatusToFarm(config);
    }

    monitorIntervalId = setTimeout(monitorAutoCheckRig, pollDelay, config);
}


/**
 * Check rig active processes
 * 
 */
export async function monitorCheckRig(config: t.DaemonConfigAll): Promise<void> {
    // check all services

    let procId: string;
    const viewedMiners = [];
    for (procId in processes) {
        const proc = processes[procId];

        if (proc.type === 'miner-run') {
            const minerAlias = proc.name;
            const minerName = proc.miner || '';
            const minerFullName = `${minerName}-${minerAlias}`;

            const minerCommands = minersCommands[minerName];
            viewedMiners.push(minerFullName);

            if (typeof minerCommands.getInfos === 'function') {
                let minerStats: t.MinerStats;
                try {
                    minerStats = await minerCommands.getInfos(config, {});
                    minerStats.dataDate = Date.now();
                    minerStats.miner = minerStats.miner || {};
                    minerStats.miner.minerName = minerName;
                    minerStats.miner.minerAlias = minerAlias;
                    minersStats[minerFullName] = minerStats;

                } catch (err: any) {
                    //throw { message: err.message };
                    delete minersStats[minerFullName];
                }
            }
        }
    }

    for (const minerFullName in minersStats) {
        if (! viewedMiners.includes(minerFullName)) {
            delete minersStats[minerFullName];
        }
    }

    dateLastCheck = Date.now();
}



export async function getInstalledMiners(config: t.DaemonConfigAll): Promise<string[]> {
    const minersDir = `${config?.appDir}${SEP}rig${SEP}miners`;
    const minersNames = await getDirFiles(minersDir);
    return minersNames;
}


export async function getInstalledMinersAliases(config: t.DaemonConfigAll): Promise<t.InstalledMiner[]> {
    const minersDir = `${config?.appDir}${SEP}rig${SEP}miners`;
    const minersNames = await getDirFiles(minersDir);

    const installedMinersAliases: t.InstalledMiner[] = minersNames.map(minerName => {
        const minerConfigFile = `${minersDir}${SEP}${minerName}${SEP}freeminingMiner.json`;

        if (fs.existsSync(minerConfigFile)) {
            const minerConfigFileJson = fs.readFileSync(minerConfigFile).toString();
            const minerConfig = JSON.parse(minerConfigFileJson);
            return minerConfig;
        }

        return null;

    }).filter(conf => !!conf);

    return installedMinersAliases;
}


export function getRunningMinersAliases(config: t.DaemonConfigAll): t.RunningMiner[] {
    let procName: string;
    let rigProcesses = getProcesses();
    const runningMiners: t.RunningMiner[] = [];

    for (procName in rigProcesses) {
        const proc = rigProcesses[procName];
        if (! proc.process) continue;
        runningMiners.push({
            miner: proc.miner || '',
            alias: proc.name,
            pid: proc.pid || 0,
            dateStart: Date.now(),
        });
    }

    return runningMiners;
}


export function getInstallableMiners(config: t.DaemonConfigAll): string[] {
    return Object.entries(minersInstalls).map(entry => {
        const [minerName, minerInstall] = entry;
        if (! minerInstall.lastVersion || minerInstall.lastVersion === 'edit-me') return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}


export function getRunnableMiners(config: t.DaemonConfigAll): string[] {
    return Object.entries(minersCommands).map(entry => {
        const [minerName, minerCommand] = entry;
        if (! minerCommand.command || minerCommand.command === 'edit-me') return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}


export function getManagedMiners(config: t.DaemonConfigAll): string[] {
    return Object.entries(minersCommands).map(entry => {
        const [minerName, minerCommand] = entry;
        if (minerCommand.apiPort <= 0) return '';
        if (typeof minerCommand.getInfos !== 'function') return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}


export async function minerInstallStart(config: t.DaemonConfigAll, params: t.minerInstallStartParams): Promise<void> {
    const minerName = params.miner;

    if (! minerName) {
        throw new Error(`Missing miner parameter`);
    }

    //if (`miner-install-${minerName}` in processes) {
    //    throw { message: `Miner ${minerName} install is already running` };
    //}

    if (! (minerName in minersCommands)) {
        throw { message: `Unknown miner ${minerName}` };
    }

    const minerInstall = minersInstalls[minerName];
    /* await */ minerInstall.install(config, params);
}


export async function minerInstallStop(config: t.DaemonConfigAll, params: t.minerInstallStopParams): Promise<void> {
    const minerName = params.miner;

    if (! minerName) {
        throw new Error(`Missing miner parameter`);
    }

    // TODO
}


export function getInstalledMinerConfiguration(config: t.DaemonConfigAll, minerName: string): t.InstalledMinerConfig {
    const minerDir = `${config.appDir }${SEP}rig${SEP}miners${SEP}${minerName}`;
    const configFile = `${minerDir}/freeminingMiner.json`;

    let minerConfig: t.InstalledMinerConfig = {
        name: minerName,
        title: minerName,
        lastVersion: "",
        defaultAlias: "",
        versions: {},
    };

    if (fs.existsSync(configFile)) {
        const minerConfigJson = fs.readFileSync(configFile).toString();
        try {
            minerConfig = JSON.parse(minerConfigJson);

        } catch (err: any) {
            console.warn(`${now()} [WARNING] [RIG] Cannot get miner configuration of miner ${minerName} : ${err.message}`);
        }
    }

    return minerConfig;
}


export async function minerRunStart(config: t.DaemonConfigAll, params: t.minerRunStartParams): Promise<t.Process> {
    const minerName = params.miner;
    const minerConfig = getInstalledMinerConfiguration(config, minerName);
    const minerAlias = params.alias || minerConfig.defaultAlias;
    const minerFullTitle = (minerName === minerAlias) ? minerName : `${minerName} (${minerAlias}))`;

    if (! minerName) {
        throw new Error(`Missing miner parameter`);
    }

    if (! minerAlias) {
        throw new Error(`Missing alias parameter`);
    }

    if (! (minerName in minersCommands)) {
        throw { message: `Unknown miner ${minerName}` };
    }

    if (`miner-run-${minerAlias}` in processes) {
        throw { message: `Miner ${minerFullTitle} run is already running` };
    }


    const rigInfos = await getRigInfos(config);
    const opts = {
        rigName: config.rig.name || rigInfos.rig.name || 'anonymous-rig',
    };
    params.poolUser = stringTemplate(params.poolUser, opts, false, false, false) || '';

    const minerCommands = minersCommands[minerName];
    const cmdFile = minerCommands.getCommandFile(config, params);
    const args = minerCommands.getCommandArgs(config, params);

    const dataDir  = `${config.dataDir}${SEP}rig${SEP}miners${SEP}${minerName}`;
    const minerDir = `${config.appDir }${SEP}rig${SEP}miners${SEP}${minerName}`;
    const aliasDir = `${minerDir}${SEP}${minerAlias}`;
    const cmdPath  = `${aliasDir}${SEP}${cmdFile}`;

    const logDir   = `${config.logDir}${SEP}rig${SEP}miners${SEP}${minerName}`;
    const logFile  = `${logDir}${SEP}${minerAlias}.run.log`;
    const errFile  = `${logDir}${SEP}${minerAlias}.run.err`;
    const pidDir   = `${config.pidDir}${SEP}rig${SEP}miners${SEP}${minerName}`;
    const pidFile  = `${pidDir}${SEP}${minerAlias}.run.pid`;

    fs.mkdirSync(dataDir, { recursive: true });
    fs.mkdirSync(logDir, { recursive: true });
    fs.mkdirSync(pidDir, { recursive: true });

    if (true) {
        // truncate log files
        fs.writeFileSync(logFile, '');
        fs.writeFileSync(errFile, '');
    }

    if (! fs.existsSync(aliasDir)) {
        throw { message: `Miner ${minerName} is not installed` };
    }

    if (! fs.existsSync(cmdPath)) {
        throw { message: `Miner ${minerName} cmdPath is misconfigured` };
    }


    const process: t.Process = {
        type: 'miner-run',
        name: minerAlias,
        miner: minerName,
        cmdFile,
        args,
        dataDir,
        appDir: aliasDir,
        cmdPath,
        pid: undefined,
        process: undefined
    };
    processes[`miner-run-${minerName}-${minerAlias}`] = process;

    const processName = `[freemining-beta.rig.miners.${minerName}.${minerAlias}] ${cmdPath}`;

    console.log(`${now()} [INFO] [RIG] Miner Run Start: ${minerName} (${minerAlias}))`);

    const onSpawn: t.ExecOnSpawn = function (proc) {
        processes[`miner-run-${minerName}-${minerAlias}`].pid = proc.pid;
        processes[`miner-run-${minerName}-${minerAlias}`].process = proc;
        fs.writeFileSync(pidFile, (proc.pid || -1).toString());
        console.debug(`${now()} [DEBUG] [RIG] PROCESS SPWANED ${minerName}-${minerAlias} (pid: ${proc.pid})`);
        /* await */ monitorAutoCheckRig(config);
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
        delete processes[`miner-run-${minerName}-${minerAlias}`];
        fs.rmSync(pidFile, { force: true });
        /* await */ monitorAutoCheckRig(config);
        console.debug(`${now()} [DEBUG] [RIG] PROCESS COMPLETED ${minerName}-${minerAlias} (rc: ${returnCode})`);
    }

    //console.debug(`${now()} [DEBUG] [RIG] Running command: ${cmdPath} ${args.join(' ')}`);

    exec(cmdPath, args, '', dataDir, onSpawn, onStdOut, onStdErr, onEnd, processName)
        .catch((err: any) => {
            console.warn(`${now()} [WARNING] [RIG] PROCESS ERROR ${minerName}-${minerAlias} : ${err.message}`);
        });

    return processes[`miner-run-${minerName}-${minerAlias}`];
}


export function minerRunStop(config: t.DaemonConfigAll, params: t.minerRunStopParams, forceKill: boolean=false): void {
    const minerName = params.miner;
    const minerConfig = getInstalledMinerConfiguration(config, minerName);
    const minerAlias = params.alias || minerConfig.defaultAlias;
    const minerFullTitle = (minerName === minerAlias) ? minerName : `${minerName} (${minerAlias}))`;

    if (! minerName) {
        throw new Error(`Missing miner parameter`);
    }

    if (! minerAlias) {
        throw new Error(`Missing alias parameter`);
    }

    if (! (`miner-run-${minerName}-${minerAlias}` in processes)) {
        throw { message: `Miner ${minerFullTitle} is not running` };
    }
    const proc = processes[`miner-run-${minerName}-${minerAlias}`];

    if (! proc.process) {
        throw { message: `Miner ${minerFullTitle} process is not killable` };
    }

    const signal = forceKill ? 'SIGKILL' : 'SIGINT';
    console.debug(`${now()} [DEBUG] [RIG] KILLING PROCESS ${minerFullTitle} with signal ${signal}...`);
    proc.process.kill(signal);
}



export function minerRunStatus(config: t.DaemonConfigAll, params: t.minerRunStatusParams): boolean {
    const minerName = params.miner;
    const minerConfig = getInstalledMinerConfiguration(config, minerName);
    const minerAlias = params.alias || minerConfig.defaultAlias;

    if (! minerName) {
        throw new Error(`Missing miner parameter`);
        return false;
    }

    if (! minerAlias) {
        //throw new Error(`Missing alias parameter`);
        return false;
    }

    if (! (`miner-run-${minerName}-${minerAlias}` in processes)) {
        return false;
    }
    const proc = processes[`miner-run-${minerName}-${minerAlias}`];

    if (! proc.process) {
        return false;
    }

    return proc.process.exitCode === null;
}


export async function minerRunLog(config: t.DaemonConfigAll, params: t.minerRunLogParams): Promise<string> {
    const minerName = params.miner;
    const minerConfig = getInstalledMinerConfiguration(config, minerName);
    const minerAlias = params.alias || minerConfig.defaultAlias;

    if (! minerName) {
        throw new Error(`Missing miner parameter`);
    }

    if (! minerAlias) {
        throw new Error(`Missing alias parameter`);
    }

    const logFile = `${config.logDir}${SEP}rig${SEP}miners${SEP}${minerName}${SEP}${minerAlias}.run.log`;
    if (! fs.existsSync(logFile)) {
        return '';
    }

    let text = await tailFile(logFile, params.lines || 50);
    text = text.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors

    return text;
}


export async function minerRunGetInfos(config: t.DaemonConfigAll, params: t.minerRunInfosParams): Promise<t.MinerStats> {
    const minerName = params.miner;
    const minerConfig = getInstalledMinerConfiguration(config, minerName);
    const minerAlias = params.alias || minerConfig.defaultAlias;
    const minerFullTitle = (minerName === minerAlias) ? minerName : `${minerName} (${minerAlias}))`;

    if (! minerName) {
        throw new Error(`Missing miner parameter`);
    }

    if (! minerAlias) {
        throw new Error(`Missing alias parameter`);
    }

    if (! (`miner-run-${minerName}-${minerAlias}` in processes)) {
        throw { message: `Miner ${minerFullTitle} is not running` };
    }

    if (! (minerName in minersCommands)) {
        throw { message: `Unknown miner ${minerName}` };
    }

    const miner = minersCommands[minerName];

    if (typeof miner.getInfos !== 'function') {
        throw { message: `Miner not managed` };
    }

    let minerStats: t.MinerStats;
    try {
        minerStats = await miner.getInfos(config, params);

    } catch (err: any) {
        throw { message: err.message };
    }

    return minerStats;
}


export function getProcesses(): { [processName: string]: t.Process } {
    return processes;
}


/*
export function getRigPs(): string {
    let cmd = '';
    cmd = `ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining-beta\.rig\.") |grep -e '\[free[m]ining.*\]' --color -B1`; // linux
    //cmd = `tasklist /v /fo csv`;
    //cmd = `tasklist /v /fo csv /fi "pid eq <pid>"`;
    //cmd = `tasklist /v /fo csv /fi "ppid eq <pid>"`;
    //cmd = `wmic process where "ProcessId=<pid>" get ProcessId,PercentProcessorTime`;
    //cmd = `wmic process where "ParentProcessId=<pid>" get ProcessId,Name`;
}
*/


function getRigUsage() {
    const uptime = os.uptime();
    const loadAvg = os.loadavg()[0];
    const memoryUsed = os.totalmem() - os.freemem();
    const memoryTotal = os.totalmem();

    return {
        uptime,
        loadAvg,
        memoryUsed,
        memoryTotal,
    };
}


export async function getRigInfos(config: t.DaemonConfigAll): Promise<t.RigInfos> {

    if (rigMainInfos === null) {
        const sysinfos = await Daemon.getSysInfos();

        const disks = sysinfos.disks.map((disk: any) => ({
            device:disk.device,
            interfaceType:disk.interfaceType,
            name:disk.name,
            size:disk.size,
            type:disk.type,
            vendor:disk.vendor,
        }));

        const netIface = {
            iface: sysinfos.netIface.iface,
            ifaceName: sysinfos.netIface.ifaceName,
            default: sysinfos.netIface.default,
            ip4: sysinfos.netIface.ip4,
            ip4subnet: sysinfos.netIface.ip4subnet,
            ip6: sysinfos.netIface.ip6,
            ip6subnet: sysinfos.netIface.ip6subnet,
            mac: sysinfos.netIface.mac,
            virtual: sysinfos.netIface.virtual,
            type: sysinfos.netIface.type,
            duplex: sysinfos.netIface.duplex,
            mtu: sysinfos.netIface.mtu,
            speed: sysinfos.netIface.speed,
            dhcp: sysinfos.netIface.dhcp,
        };

        const systemInfos: any = {
            os: {
                arch: sysinfos.os.arch,
                codename: sysinfos.os.codename,
                distro: sysinfos.os.distro,
                hostname: sysinfos.os.hostname,
                kernel: sysinfos.os.kernel,
                platform: sysinfos.os.platform,
            },
            cpu: sysinfos.cpu,
            board: {
                manufacturer: sysinfos.board.manufacturer,
                model: sysinfos.board.model,
            },
            gpus: sysinfos.gpus,
            //fs: sysinfos.fs,
            net: {
                gateway: sysinfos.netGateway,
                interface: netIface,
            },
            disks,
        }

        const runnableMiners = getRunnableMiners(config);
        const installableMiners = getInstallableMiners(config);
        const managedMiners = getManagedMiners(config);
        const freeminingVersion = config.version;

        rigMainInfos = {
            name: config.rig.name || os.hostname(),
            hostname: os.hostname(),
            ip: (getLocalIpAddresses() || [])[0] || 'no-ip',
            rigOs: os.version(),
            systemInfos,
            runnableMiners,
            installableMiners,
            managedMiners,
            freeminingVersion,
        };
    }

    const { name, hostname, ip, rigOs, systemInfos, runnableMiners, installableMiners, managedMiners, freeminingVersion } = rigMainInfos;
    const { uptime, loadAvg, memoryUsed, memoryTotal } = getRigUsage();

    const installedMiners = await getInstalledMiners(config);
    const installedMinersAliases = await getInstalledMinersAliases(config);

    const runningMinersAliases = getRunningMinersAliases(config);
    const runningMiners = Array.from(new Set(runningMinersAliases.map(runningMiner => runningMiner.miner)));

    const monitorStatus = monitorGetStatus();
    const farmAgentStatus = farmAgentGetStatus();

    const rigInfos: t.RigInfos = {
        rig: {
            name,
            hostname,
            ip,
            os: rigOs,
            freeminingVersion,
        },
        systemInfos,
        usage: {
            uptime,
            loadAvg,
            memory: {
                used: memoryUsed,
                total: memoryTotal,
            },
        },
        config: config.rig,
        status: {
            minersStats: minersStats,
            monitorStatus,
            installableMiners,
            installedMiners,
            installedMinersAliases,
            runnableMiners,
            runningMiners,
            runningMinersAliases,
            managedMiners,
            farmAgentStatus,
        },
        dataDate: dateLastCheck,
    }

    return rigInfos;
}



export async function getAllMiners(config: t.DaemonConfigAll): Promise<t.AllMiners> {
    const installedMiners = await getInstalledMiners(config);
    const runningMinersAliases = getRunningMinersAliases(config);
    const installableMiners = getInstallableMiners(config); // TODO: mettre en cache
    const runnableMiners = getRunnableMiners(config); // TODO: mettre en cache
    const managedMiners = getManagedMiners(config); // TODO: mettre en cache
    const installedMinersAliases = await getInstalledMinersAliases(config);

    const minersNames = Array.from(
        new Set( [
            ...installedMiners,
            ...runningMinersAliases.map(runningMiner => runningMiner.miner),
            ...installableMiners,
            ...runnableMiners,
            ...managedMiners,
        ])
    );

    const miners: t.AllMiners = Object.fromEntries(
        minersNames.map(minerName => {
            return [
                minerName,
                {
                    installed: installedMiners.includes(minerName),
                    installedAliases: installedMinersAliases,
                    running: runningMinersAliases.map(runningMiner => runningMiner.miner).includes(minerName),
                    installable: installableMiners.includes(minerName),
                    runnable: runnableMiners.includes(minerName),
                    managed: managedMiners.includes(minerName),
                    runningAlias: runningMinersAliases,
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

