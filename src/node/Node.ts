
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

import { now, getOpt, getLocalIpAddresses, getDirFiles, tailFile } from '../common/utils';
import { exec } from '../common/exec';
import { fullnodesInstalls, fullnodesCommands } from './fullnodesConfigs';

import type *  as t from '../common/types';
import type childProcess from 'child_process';



/* ########## MAIN ######### */

const SEP = path.sep;

const processes: { [processName: string]: t.Process } = {};

let monitorIntervalId: ReturnType<typeof setInterval> | null = null;

const defaultPollDelay = 10_000; // 10 seconds

const fullnodesStats: { [fullnodeFullName: string]: t.FullnodeStats } = {};

let nodeMainInfos: any | null = null;
let dateLastCheck: number;


/* ########## FUNCTIONS ######### */

/**
 * Start node monitor (poll running processes API every x seconds)
 * 
 * ./ts-node frm-cli.ts --node-monitor-start
 */
export function monitorStart(config: t.DaemonConfigAll): void {
    if (monitorIntervalId) return;

    /* await */ monitorAutoCheckNode(config);

    console.log(`${now()} [INFO] [NODE] Node monitor started`);
}

/**
 * Stop node monitor
 * 
 * ./ts-node frm-cli.ts --node-monitor-stop
 */
export function monitorStop(): void {
    if (! monitorIntervalId) return;

    clearInterval(monitorIntervalId);
    monitorIntervalId = null;

    console.log(`${now()} [INFO] [NODE] Node monitor stopped`);
}


export function monitorGetStatus(): boolean {
    return monitorIntervalId !== null;
}



async function monitorAutoCheckNode(config: t.DaemonConfigAll) {
    const pollDelay = Number(getOpt('--node-monitor-poll-delay')) || defaultPollDelay;

    if (monitorIntervalId) {
        clearTimeout(monitorIntervalId);
    }

    await monitorCheckNode(config);

    monitorIntervalId = setTimeout(monitorAutoCheckNode, pollDelay, config);
}




/**
 * Check node active processes
 * 
 */
export async function monitorCheckNode(config: t.DaemonConfigAll): Promise<void> {
    // check all services

    let procId: string;
    const viewedFullnodes = [];
    for (procId in processes) {
        const proc = processes[procId];

        if (proc.type === 'fullnode-run') {
            const fullnodeAlias = proc.name;
            const fullnodeName = proc.fullnode || '';
            const fullnodeFullName = `${fullnodeName}-${fullnodeAlias}`;

            const fullnodeCommands = fullnodesCommands[fullnodeName];
            viewedFullnodes.push(fullnodeFullName);

            if (typeof fullnodeCommands.getInfos === 'function') {
                let fullnodeStats: t.FullnodeStats;
                try {
                    fullnodeStats = await fullnodeCommands.getInfos(config, {});
                    fullnodeStats.dataDate = Date.now();
                    fullnodeStats.fullnode = fullnodeStats.fullnode || {};
                    fullnodeStats.fullnode.fullnodeName = fullnodeName;
                    fullnodeStats.fullnode.fullnodeAlias = fullnodeAlias;
                    fullnodesStats[fullnodeFullName] = fullnodeStats;

                } catch (err: any) {
                    //throw { message: err.message };
                    delete fullnodesStats[fullnodeFullName];
                }
            }
        }
    }

    for (const fullnodeName in fullnodesStats) {
        if (! viewedFullnodes.includes(fullnodeName)) {
            delete fullnodesStats[fullnodeName];
        }
    }

    dateLastCheck = Date.now();
}



export async function getInstalledFullnodes(config: t.DaemonConfigAll): Promise<string[]> {
    const fullnodesDir = `${config?.appDir}${SEP}node${SEP}fullnodes`
    const fullnodesNames = await getDirFiles(fullnodesDir);
    return fullnodesNames;
}



export async function getInstalledFullnodesAliases(config: t.DaemonConfigAll): Promise<t.InstalledFullnode[]> {
    const fullnodesDir = `${config?.appDir}${SEP}node${SEP}fullnodes`;
    const fullnodesNames = await getDirFiles(fullnodesDir);

    const installedFullnodesAliases: t.InstalledFullnode[] = fullnodesNames.map(fullnodeName => {
        const fullnodeConfigFile = `${fullnodesDir}${SEP}${fullnodeName}${SEP}freeminingFullnode.json`;

        if (fs.existsSync(fullnodeConfigFile)) {
            const fullnodeConfigFileJson = fs.readFileSync(fullnodeConfigFile).toString();
            const fullnodeConfig = JSON.parse(fullnodeConfigFileJson);
            return fullnodeConfig;
        }

        return null;

    }).filter(conf => !!conf);

    return installedFullnodesAliases;
}


export function getRunningFullnodesAliases(config: t.DaemonConfigAll): t.RunningFullnodeProcess[] {
    let procName: string;
    let nodeProcesses = getProcesses();
    const runningFullnodes: t.RunningFullnodeProcess[] = [];

    for (procName in nodeProcesses) {
        const proc = nodeProcesses[procName];
        if (! proc.process) continue;

        runningFullnodes.push({
            fullnode: proc.fullnode || '',
            alias: proc.name,
            pid: proc.pid || 0,
            dateStart: proc.dateStart,
            args: proc.args,
            params: proc.params as t.fullnodeRunStartParams,
            //apiPort: proc.apiPort, // TODO
        });
    }

    return runningFullnodes;
}




export function getInstallableFullnodes(config: t.DaemonConfigAll): string[] {
    return Object.entries(fullnodesInstalls).map(entry => {
        const [fullnodeName, fullnodeInstall] = entry;
        if (! fullnodeInstall.lastVersion || fullnodeInstall.lastVersion === 'edit-me') return '';
        return fullnodeName;
    }).filter(fullnodeName => fullnodeName !== '');
}


export function getRunnableFullnodes(config: t.DaemonConfigAll): string[] {
    return Object.entries(fullnodesCommands).map(entry => {
        const [fullnodeName, fullnodeCommand] = entry;
        if (! fullnodeCommand.command || fullnodeCommand.command === 'edit-me') return '';
        //if (fullnodeCommand.p2pPort === -1) return '';
        return fullnodeName;
    }).filter(fullnodeName => fullnodeName !== '');
}


export function getManagedFullnodes(config: t.DaemonConfigAll): string[] {
    return Object.entries(fullnodesCommands).map(entry => {
        const [fullnodeName, fullnodeCommand] = entry;
        if (fullnodeCommand.rpcPort <= 0) return '';
        if (! fullnodeCommand.managed) return '';
        return fullnodeName;
    }).filter(fullnodeName => fullnodeName !== '');
}


export async function fullnodeInstallStart(config: t.DaemonConfigAll, params: t.fullnodeInstallStartParams): Promise<void> {
    const fullnodeName = params.fullnode;

    if (! fullnodeName) {
        throw new Error(`Missing fullnode parameter`);
    }

    //if ((fullnodeName + '/install') in processes) {
    //    throw { message: `Fullnode ${fullnodeName} install is already running` };
    //}

    if (! (fullnodeName in fullnodesCommands)) {
        throw { message: `Unknown fullnode ${fullnodeName}` };
    }

    const fullnodeInstall = fullnodesInstalls[fullnodeName];
    /* await */ fullnodeInstall.install(config, params).catch((err: any) => {
        console.warn(`${now()} [WARNING] [NODE] Cannot start fullnode ${fullnodeName} : ${err.message}`);
    });
}


export function getInstalledFullnodeConfiguration(config: t.DaemonConfigAll, fullnodeName: string): t.InstalledFullnodeConfig {
    const fullnodeDir = `${config.appDir }${SEP}node${SEP}fullnodes${SEP}${fullnodeName}`;
    const configFile = `${fullnodeDir}/freeminingFullnode.json`;

    let fullnodeConfig: t.InstalledFullnodeConfig = {
        name: fullnodeName,
        title: fullnodeName,
        lastVersion: "",
        defaultAlias: "",
        versions: {},
    };

    if (fs.existsSync(configFile)) {
        const fullnodeConfigJson = fs.readFileSync(configFile).toString();
        try {
            fullnodeConfig = JSON.parse(fullnodeConfigJson);

        } catch (err: any) {
            console.warn(`${now()} [WARNING] [NODE] Cannot get fullnode configuration of fullnode ${fullnodeName} : ${err.message}`);
        }
    }

    return fullnodeConfig;
}



export async function fullnodeRunStart(config: t.DaemonConfigAll, params: t.fullnodeRunStartParams): Promise<t.Process> {
    const fullnodeName = params.fullnode;
    const fullnodeConfig = getInstalledFullnodeConfiguration(config, fullnodeName);
    const fullnodeAlias = params.alias || fullnodeConfig.defaultAlias;
    const fullnodeFullTitle = (fullnodeName === fullnodeAlias) ? fullnodeName : `${fullnodeName} (${fullnodeAlias}))`;

    if (! fullnodeName) {
        throw new Error(`Missing fullnode parameter`);
    }

    if (! fullnodeAlias) {
        throw new Error(`Missing alias parameter`);
    }

    if (! (fullnodeName in fullnodesCommands)) {
        throw { message: `Unknown fullnode ${fullnodeName}` };
    }

    if (`fullnode-run-${fullnodeAlias}` in processes) {
        throw { message: `fullnode ${fullnodeFullTitle} run is already running` };
    }


    const fullnodeCommands = fullnodesCommands[fullnodeName];
    const cmdFile = fullnodeCommands.getCommandFile(config, params);
    const args = fullnodeCommands.getCommandArgs(config, params);

    const dataDir  = `${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${fullnodeName}`;
    const fullnodeDir = `${config.appDir }${SEP}node${SEP}fullnodes${SEP}${fullnodeName}`;
    const aliasDir = `${fullnodeDir}${SEP}${fullnodeAlias}`;
    const cmdPath  = `${aliasDir}${SEP}${cmdFile}`;

    const logDir   = `${config.logDir}${SEP}node${SEP}fullnodes${SEP}${fullnodeName}`;
    const logFile  = `${logDir}${SEP}${fullnodeAlias}.run.log`;
    const errFile  = `${logDir}${SEP}${fullnodeAlias}.run.err`;
    const pidDir   = `${config.pidDir}${SEP}node${SEP}fullnodes${SEP}${fullnodeName}`;
    const pidFile  = `${pidDir}${SEP}${fullnodeAlias}.run.pid`;

    fs.mkdirSync(dataDir, { recursive: true });
    fs.mkdirSync(logDir, { recursive: true });
    fs.mkdirSync(pidDir, { recursive: true });

    if (true) {
        // truncate log files
        fs.writeFileSync(logFile, '');
        fs.writeFileSync(errFile, '');
    }

    if (! fs.existsSync(aliasDir)) {
        throw { message: `Fullnode ${fullnodeName} is not installed` };
    }

    if (! fs.existsSync(cmdPath)) {
        throw { message: `Fullnode ${fullnodeName} cmdPath is misconfigured` };
    }


    const process: t.Process = {
        type: 'fullnode-run',
        name: fullnodeAlias,
        fullnode: fullnodeName,
        params: params,
        cmdFile,
        args,
        dataDir,
        appDir: aliasDir,
        cmdPath,
        dateStart: Date.now(),
        pid: undefined,
        process: undefined
    };
    processes[`fullnode-run-${fullnodeName}-${fullnodeAlias}`] = process;

    const processName = `[freemining-beta.node.fullnodes.${fullnodeName}.${fullnodeAlias}] ${cmdPath}`;


    console.log(`${now()} [INFO] [NODE] Fullnode Run Start: ${fullnodeName} (${fullnodeAlias}))`);

    const onSpawn: t.ExecOnSpawn = function (proc) {
        processes[`fullnode-run-${fullnodeName}-${fullnodeAlias}`].pid = proc.pid;
        processes[`fullnode-run-${fullnodeName}-${fullnodeAlias}`].process = proc;
        fs.writeFileSync(pidFile, (proc.pid || -1).toString());
        console.debug(`${now()} [DEBUG] [NODE] PROCESS SPWANED ${fullnodeName}-${fullnodeAlias} (pid: ${proc.pid})`);
        // /* await */ monitorAutoCheckNode(config);
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
        delete processes[`fullnode-run-${fullnodeName}-${fullnodeAlias}`];
        fs.rmSync(pidFile, { force: true });
        // /* await */ monitorAutoCheckNode(config);
        console.debug(`${now()} [DEBUG] [NODE] PROCESS COMPLETED ${fullnodeName}-${fullnodeAlias} (rc: ${returnCode})`);
    }

    //console.debug(`${now()} [DEBUG] [NODE] Running command: ${cmdPath} ${args.join(' ')}`);

    exec(cmdPath, args, '', dataDir, onSpawn, onStdOut, onStdErr, onEnd, processName)
        .catch((err: any) => {
            console.warn(`${now()} [WARNING] [NODE] PROCESS ERROR ${fullnodeName}-${fullnodeAlias} : ${err.message}`);
        });

    return processes[`fullnode-run-${fullnodeName}-${fullnodeAlias}`];
}


export function fullnodeRunStop(config: t.DaemonConfigAll, params: t.fullnodeRunStopParams, forceKill: boolean=false): void {
    const fullnodeName = params.fullnode;
    const fullnodeConfig = getInstalledFullnodeConfiguration(config, fullnodeName);
    const fullnodeAlias = params.alias || fullnodeConfig.defaultAlias;
    const fullnodeFullTitle = (fullnodeName === fullnodeAlias) ? fullnodeName : `${fullnodeName} (${fullnodeAlias}))`;

    if (! fullnodeName) {
        throw new Error(`Missing fullnode parameter`);
    }

    if (! fullnodeAlias) {
        throw new Error(`Missing alias parameter`);
    }

    if (! (`fullnode-run-${fullnodeName}-${fullnodeAlias}` in processes)) {
        throw { message: `Fullnode ${fullnodeFullTitle} is not running` };
    }
    const proc = processes[`fullnode-run-${fullnodeName}-${fullnodeAlias}`];

    if (! proc.process) {
        throw { message: `Fullnode ${fullnodeFullTitle} process is not killable` };
    }

    const signal = forceKill ? 'SIGKILL' : 'SIGINT';
    console.debug(`${now()} [DEBUG] [NODE] KILLING PROCESS ${fullnodeFullTitle} with signal ${signal}...`);
    proc.process.kill(signal);
}



export function fullnodeRunGetStatus(config: t.DaemonConfigAll, params: t.fullnodeRunStatusParams): boolean {
    const fullnodeName = params.fullnode;
    let fullnodeAlias = params.alias;

    if (! fullnodeAlias) {
        const fullnodeConfig = getInstalledFullnodeConfiguration(config, fullnodeName);
        fullnodeAlias = fullnodeConfig.defaultAlias
    }

    if (! fullnodeName) {
        throw new Error(`Missing fullnode parameter`);
        return false;
    }

    if (! fullnodeAlias) {
        //throw new Error(`Missing alias parameter`);
        return false;
    }

    if (! (`fullnode-run-${fullnodeName}-${fullnodeAlias}` in processes)) {
        return false;
    }
    const proc = processes[`fullnode-run-${fullnodeName}-${fullnodeAlias}`];

    if (! proc.process) {
        return false;
    }

    return proc.process.exitCode === null;
}


export async function fullnodeRunGetLog(config: t.DaemonConfigAll, params: t.fullnodeRunLogParams): Promise<string> {
    const fullnodeName = params.fullnode;
    const fullnodeConfig = getInstalledFullnodeConfiguration(config, fullnodeName);
    const fullnodeAlias = params.alias || fullnodeConfig.defaultAlias;

    if (! fullnodeName) {
        throw new Error(`Missing fullnode parameter`);
    }

    if (! fullnodeAlias) {
        throw new Error(`Missing alias parameter`);
    }

    const logFile = `${config.logDir}${SEP}node${SEP}fullnodes${SEP}${fullnodeName}${SEP}${fullnodeAlias}.run.log`;
    if (! fs.existsSync(logFile)) {
        return Promise.resolve('');
    }

    let text = await tailFile(logFile, params.lines || 50);
    text = text.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors

    return text;
}



export async function fullnodeRunGetInfos(config: t.DaemonConfigAll, params: t.fullnodeRunInfosParams): Promise<t.FullnodeStats> {
    if (! (`fullnode-run-${params.fullnode}` in processes)) {
        throw { message: `Fullnode ${params.fullnode} is not running` };
    }

    if (! (params.fullnode in fullnodesCommands)) {
        throw { message: `Unknown fullnode ${params.fullnode}` };
    }

    const fullnode = fullnodesCommands[params.fullnode];

    if (typeof fullnode.getInfos !== 'function') {
        throw { message: `Fullnode not managed` };
    }

    let fullnodeStats: t.FullnodeStats;
    try {
        fullnodeStats = await fullnode.getInfos(config, params);

    } catch (err: any) {
        throw { message: err.message };
    }

    return fullnodeStats;
}


export function getProcesses(): { [processName: string]: t.Process } {
    return processes;
}



export async function getNodeInfos(config: t.DaemonConfigAll): Promise<t.NodeInfos> {

    if (nodeMainInfos === null) {

        const _cpus = os.cpus()
        const cpus: any[] = [
            {
                name: _cpus[0].model,
                threads: _cpus.length,
            }
        ];

        const runnableFullnodes = getRunnableFullnodes(config);
        const installableFullnodes = getInstallableFullnodes(config);
        const managedFullnodes = getManagedFullnodes(config);
        const freeminingVersion = config.version;

        nodeMainInfos = {
            name: config.node.name || os.hostname(),
            hostname: os.hostname(),
            ip: (getLocalIpAddresses() || [])[0] || 'no-ip',
            nodeOs: os.version(),
            cpus,
            runnableFullnodes,
            installableFullnodes,
            managedFullnodes,
            freeminingVersion,
        };
    }


    const { name, hostname, ip, nodeOs, systemInfos, runnableFullnodes, installableFullnodes, managedFullnodes, freeminingVersion } = nodeMainInfos;
    const { uptime, loadAvg, memoryUsed, memoryTotal } = getNodeUsage();

    const installedFullnodes = await getInstalledFullnodes(config);
    const installedFullnodesAliases = await getInstalledFullnodesAliases(config);

    const runningFullnodesAliases = getRunningFullnodesAliases(config);
    const runningFullnodes = Array.from(new Set(runningFullnodesAliases.map(runningFullnode => runningFullnode.fullnode)));

    const monitorStatus = monitorGetStatus();

    const cpus: t.CPU[] = []; // TODO

    const nodeInfos: t.NodeInfos = {
        node: {
            name,
            hostname,
            ip,
            os: nodeOs,
            freeminingVersion,
        },
        usage: {
            uptime,
            loadAvg,
            memory: {
                used: memoryUsed,
                total: memoryTotal,
            },
        },
        devices: {
            cpus,
        },
        config: {

        },
        status: {
            monitorStatus,
            installableFullnodes,
            installedFullnodes,
            installedFullnodesAliases,
            runnableFullnodes,
            runningFullnodes,
            runningFullnodesAliases,
            managedFullnodes,
            fullnodesStats,
        },
        dataDate: dateLastCheck,
    }

    return nodeInfos;
}


export async function getAllFullnodes(config: t.DaemonConfigAll): Promise<t.AllFullnodes> {
    const installedFullnodes = await getInstalledFullnodes(config);
    const runningFullnodesAliases = getRunningFullnodesAliases(config);
    const installableFullnodes = getInstallableFullnodes(config); // TODO: mettre en cache
    const runnableFullnodes = getRunnableFullnodes(config); // TODO: mettre en cache
    const managedFullnodes = getManagedFullnodes(config); // TODO: mettre en cache
    const installedFullnodesAliases = await getInstalledFullnodesAliases(config);

    const fullnodesNames = Array.from(
        new Set( [
            ...installedFullnodes,
            ...runningFullnodesAliases.map(runningFullnode => runningFullnode.fullnode),
            ...installableFullnodes,
            ...runnableFullnodes,
            ...managedFullnodes,
        ])
    );

    const fullnodes: t.AllFullnodes = Object.fromEntries(
        fullnodesNames.map(fullnodeName => {
            return [
                fullnodeName,
                {
                    installable: installableFullnodes.includes(fullnodeName),
                    installed: installedFullnodes.includes(fullnodeName),
                    installedAliases: installedFullnodesAliases,
                    runnable: runnableFullnodes.includes(fullnodeName),
                    running: runningFullnodesAliases.map(runningFullnode => runningFullnode.fullnode).includes(fullnodeName),
                    runningAlias: runningFullnodesAliases,
                    managed: managedFullnodes.includes(fullnodeName),
                }
            ]
        })
    );

    /*
    // result: 
    fullnodes = {
        fullnode1: {
            installed: boolean,
            running: boolean,
            installable: boolean,
            runnable: boolean,
            managed: boolean,
        },
        ...
    }
    */

    return fullnodes;
}


function getNodeUsage() {
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