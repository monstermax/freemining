
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

const processes: t.MapString<t.Process> = {};

let monitorIntervalId: ReturnType<typeof setInterval> | null = null;

const defaultPollDelay = 10_000; // 10 seconds

const fullnodesInfos: t.MapString<any> = {};

let nodeMainInfos: any | null = null;


/* ########## FUNCTIONS ######### */

/**
 * Start node monitor (poll running processes API every x seconds)
 * 
 * ./ts-node frm-cli.ts --node-monitor-start
 */
export function monitorStart(config: t.Config, params?: t.MapString<any>): void {
    if (monitorIntervalId) {
        return;
    }

    const pollDelay = Number(getOpt('--poll-delay')) || defaultPollDelay;
    monitorIntervalId = setInterval(monitorCheckNode, pollDelay, config);

    console.log(`${now()} [INFO] [NODE] Node monitor started`);
}

/**
 * Stop node monitor
 * 
 * ./ts-node frm-cli.ts --node-monitor-stop
 */
export function monitorStop(config?: t.Config, params?: t.MapString<any>): void {
    if (monitorIntervalId) {
        clearInterval(monitorIntervalId);
        monitorIntervalId = null;

        console.log(`${now()} [INFO] [NODE] Node monitor stopped`);
    }
}


export function monitorStatus(config?: t.Config, params?: t.MapString<any>): boolean {
    return monitorIntervalId !== null;
}



/**
 * Check node active processes
 * 
 */
export async function monitorCheckNode(config: t.Config): Promise<void> {
    // check all services

    let procId: string;
    const viewedFullnodes = [];
    for (procId in processes) {
        const proc = processes[procId];

        if (proc.type === 'fullnode-run') {
            const fullnodeCommands = fullnodesCommands[proc.name];
            viewedFullnodes.push(proc.name);

            let fullnodeInfos: any;
            try {
                fullnodeInfos = await fullnodeCommands.getInfos(config, {});
                fullnodeInfos.dataDate = Date.now();
                fullnodesInfos[proc.name] = fullnodeInfos;

            } catch (err: any) {
                //throw { message: err.message };
                delete fullnodesInfos[proc.name];
            }
        }
    }

    for (const fullnodeName in fullnodesInfos) {
        if (! viewedFullnodes.includes(fullnodeName)) {
            delete fullnodesInfos[fullnodeName];
        }
    }
}



export async function getInstalledFullnodes(config: t.Config, params?: t.MapString<any>): Promise<string[]> {
    const fullnodesDir = `${config?.appDir}${SEP}node${SEP}fullnodes`
    const fullnodesNames = await getDirFiles(fullnodesDir);
    return fullnodesNames;
}


export function getRunningFullnodes(config: t.Config, params?: t.MapString<any>): string[] {
    //const nodeInfos = getNodeInfos();
    //const runningFullnodes = Object.keys(nodeInfos.fullnodesInfos);

    let procName: string;
    let nodeProcesses = getProcesses();
    const runningFullnodes: string[] = [];

    for (procName in nodeProcesses) {
        const proc = nodeProcesses[procName];
        if (! proc.process) continue;
        runningFullnodes.push(proc.name);
    }

    return runningFullnodes;
}


export function getInstallableFullnodes(config: t.Config, params?: t.MapString<any>): string[] {
    return Object.entries(fullnodesInstalls).map(entry => {
        const [fullnodeName, fullnodeInstall] = entry;
        if (fullnodeInstall.version === 'edit-me') return '';
        return fullnodeName;
    }).filter(fullnodeName => fullnodeName !== '');
}


export function getRunnableFullnodes(config: t.Config, params?: t.MapString<any>): string[] {
    return Object.entries(fullnodesCommands).map(entry => {
        const [fullnodeName, fullnodeCommand] = entry;
        if (fullnodeCommand.command === 'edit-me' && fullnodeCommand.p2pPort === -1) return '';
        return fullnodeName;
    }).filter(fullnodeName => fullnodeName !== '');
}


export function getManagedFullnodes(config: t.Config, params?: t.MapString<any>): string[] {
    return Object.entries(fullnodesCommands).map(entry => {
        const [fullnodeName, fullnodeCommand] = entry;
        if (fullnodeCommand.rpcPort === -1) return '';
        return fullnodeName;
    }).filter(fullnodeName => fullnodeName !== '');
}


export async function fullnodeInstallStart(config: t.Config, params: t.MapString<any>): Promise<void> {
    if ((params.fullnode + '/install') in processes) {
        throw { message: `Fullnode ${params.fullnode} install is already running` };
    }

    if (! (params.fullnode in fullnodesCommands)) {
        throw { message: `Unknown fullnode ${params.fullnode}` };
    }

    const fullnodeInstall = fullnodesInstalls[params.fullnode];
    return fullnodeInstall.install(config, params);
}


export async function fullnodeRunStart(config: t.Config, params: t.MapString<any>): Promise<t.Process> {
    if (! params.fullnode) {
        throw { message: `Missing fullnode parameter` };
    }

    if (`fullnode-run-${params.fullnode}` in processes) {
        throw { message: `Fullnode ${params.fullnode} run is already running` };
    }

    if (! (params.fullnode in fullnodesCommands)) {
        throw { message: `Unknown fullnode ${params.fullnode}` };
    }

    const fullnodeCommands = fullnodesCommands[params.fullnode];
    const cmdFile = fullnodeCommands.getCommandFile(config, params);
    const args = fullnodeCommands.getCommandArgs(config, params);

    const dataDir  = `${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`;
    const appDir   = `${config.appDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`;
    const cmdPath  = `${appDir}${SEP}${cmdFile}`;

    const logDir   = `${config.logDir}${SEP}node${SEP}fullnodes`;
    const logFile  = `${logDir}${SEP}${params.fullnode}.run.log`;
    const errFile  = `${logDir}${SEP}${params.fullnode}.run.err`;
    const pidDir   = `${config.pidDir}${SEP}node${SEP}fullnodes`;
    const pidFile  = `${pidDir}${SEP}${params.fullnode}.run.pid`;

    fs.mkdirSync(dataDir, { recursive: true });
    fs.mkdirSync(logDir, { recursive: true });
    fs.mkdirSync(pidDir, { recursive: true });

    if (true) {
        // truncate log files
        fs.writeFileSync(logFile, '');
        fs.writeFileSync(errFile, '');
    }

    if (! fs.existsSync(appDir)) {
        throw { message: `Fullnode ${params.fullnode} is not installed` };
    }

    if (! fs.existsSync(cmdPath)) {
        throw { message: `Fullnode ${params.fullnode} cmdPath is misconfigured` };
    }


    const process: t.Process = {
        type: 'fullnode-run',
        name: params.fullnode,
        cmdFile,
        args,
        dataDir,
        appDir,
        cmdPath,
        pid: undefined,
        process: undefined
    };
    processes[`fullnode-run-${params.fullnode}`] = process;

    const processName = `[freemining-beta.node.fullnodes.${params.fullnode}] ${cmdPath}`;


    console.log(`${now()} [INFO] [NODE] Fullnode Run Start: ${params.fullnode}`);

    const onSpawn: t.ExecOnSpawn = function (proc) {
        processes[`fullnode-run-${params.fullnode}`].pid = proc.pid;
        processes[`fullnode-run-${params.fullnode}`].process = proc;
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
        delete processes[`fullnode-run-${params.fullnode}`];
        fs.rmSync(pidFile, { force: true });
        console.debug(`${now()} [DEBUG] [NODE] PROCESS COMPLETED ${params.fullnode} (rc: ${returnCode})`);
    }

    //console.debug(`${now()} [DEBUG] [NODE] Running command: ${cmdPath} ${args.join(' ')}`);

    exec(cmdPath, args, '', dataDir, onSpawn, onStdOut, onStdErr, onEnd, processName)
        .catch((err: any) => {
            console.warn(`${now()} [WARNING] [NODE] PROCESS ERROR ${params.fullnode} : ${err.message}`);
        });

    return processes[`fullnode-run-${params.fullnode}`];
}


export function fullnodeRunStop(config: t.Config, params: t.MapString<any>, forceKill: boolean=false): void {
    if (! (`fullnode-run-${params.fullnode}` in processes)) {
        throw { message: `Fullnode ${params.fullnode} is not running` };
    }
    const proc = processes[`fullnode-run-${params.fullnode}`];

    if (! proc.process) {
        throw { message: `Fullnode ${params.fullnode} process is not killable` };
    }

    const signal = forceKill ? 'SIGKILL' : 'SIGINT';
    console.debug(`${now()} [DEBUG] [NODE] KILLING PROCESS ${params.fullnode} with signal ${signal}...`);
    proc.process.kill(signal);
}



export function fullnodeRunStatus(config: t.Config, params: t.MapString<any>): boolean {
    if (! (`fullnode-run-${params.fullnode}` in processes)) {
        return false;
    }
    const proc = processes[`fullnode-run-${params.fullnode}`];

    if (! proc.process) {
        return false;
    }

    return proc.process.exitCode === null;
}


export async function fullnodeRunLog(config: t.Config, params: t.MapString<any>): Promise<string> {
    const logFile = `${config.logDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}.run.log`;
    if (! fs.existsSync(logFile)) {
        return '';
    }

    let text = await tailFile(logFile, params.lines || 50);
    text = text.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors

    return text;
}


export async function fullnodeRunInfos(config: t.Config, params: t.MapString<any>): Promise<t.FullnodeInfos> {
    if (! (`fullnode-run-${params.fullnode}` in processes)) {
        throw { message: `Fullnode ${params.fullnode} is not running` };
    }

    if (! (params.fullnode in fullnodesCommands)) {
        throw { message: `Unknown fullnode ${params.fullnode}` };
    }

    const fullnode = fullnodesCommands[params.fullnode];

    let fullnodeInfos: any;
    try {
        fullnodeInfos = await fullnode.getInfos(config, params);

    } catch (err: any) {
        throw { message: err.message };
    }

    return fullnodeInfos;
}


export function getProcesses(): t.MapString<t.Process> {
    return processes;
}



export function getNodeInfos(): t.Node {

    if (nodeMainInfos === null) {

        const _cpus = os.cpus()
        const cpus: any[] = [
            {
                name: _cpus[0].model,
                threads: _cpus.length,
            }
        ];


        nodeMainInfos = {
            name: getOpt('--node-name') || os.hostname(),
            hostname: os.hostname(),
            ip: (getLocalIpAddresses() || [])[0] || 'no-ip',
            nodeOs: os.version(),
            cpus,
        };
    }

    const { name, hostname, ip, nodeOs, cpus } = nodeMainInfos;
    const uptime = os.uptime();
    const loadAvg = os.loadavg()[0];
    const memoryUsed = os.totalmem() - os.freemem();
    const memoryTotal = os.totalmem();

    const nodeInfos: t.Node = {
        infos: {
            name,
            hostname,
            ip,
            os: nodeOs,
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
        },
        fullnodesInfos,
        dataDate: Date.now(),
    }

    return nodeInfos;
}


export async function getAllFullnodes(config: t.Config): Promise<any> {
    const installedFullnodes = await getInstalledFullnodes(config);
    const runningFullnodes = getRunningFullnodes(config);
    const installableFullnodes = getInstallableFullnodes(config); // TODO: mettre en cache
    const runnableFullnodes = getRunnableFullnodes(config); // TODO: mettre en cache
    const managedFullnodes = getManagedFullnodes(config); // TODO: mettre en cache

    const fullnodesNames = Array.from(
        new Set( [
            ...installedFullnodes,
            ...runningFullnodes,
            ...installableFullnodes,
            ...runnableFullnodes,
            ...managedFullnodes,
        ])
    );

    const fullnodes: any = Object.fromEntries(
        fullnodesNames.map(fullnodeName => {
            return [
                fullnodeName,
                {
                    installed: installedFullnodes.includes(fullnodeName),
                    running: runningFullnodes.includes(fullnodeName),
                    installable: installableFullnodes.includes(fullnodeName),
                    runnable: runnableFullnodes.includes(fullnodeName),
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
