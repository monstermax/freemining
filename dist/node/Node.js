"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFullnodes = exports.getNodeInfos = exports.getProcesses = exports.fullnodeRunGetInfos = exports.fullnodeRunLog = exports.fullnodeRunGetStatus = exports.fullnodeRunStop = exports.fullnodeRunStart = exports.fullnodeInstallStart = exports.getManagedFullnodes = exports.getRunnableFullnodes = exports.getInstallableFullnodes = exports.getRunningFullnodes = exports.getInstalledFullnodes = exports.monitorCheckNode = exports.monitorGetStatus = exports.monitorStop = exports.monitorStart = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const os_1 = tslib_1.__importDefault(require("os"));
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = require("../common/utils");
const exec_1 = require("../common/exec");
const fullnodesConfigs_1 = require("./fullnodesConfigs");
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
const processes = {};
let monitorIntervalId = null;
const defaultPollDelay = 10000; // 10 seconds
const fullnodesStats = {};
let nodeMainInfos = null;
let dateLastCheck;
/* ########## FUNCTIONS ######### */
/**
 * Start node monitor (poll running processes API every x seconds)
 *
 * ./ts-node frm-cli.ts --node-monitor-start
 */
function monitorStart(config) {
    if (monitorIntervalId) {
        return;
    }
    const pollDelay = Number((0, utils_1.getOpt)('--node-monitor-poll-delay')) || defaultPollDelay;
    monitorIntervalId = setInterval(monitorCheckNode, pollDelay, config);
    console.log(`${(0, utils_1.now)()} [INFO] [NODE] Node monitor started`);
}
exports.monitorStart = monitorStart;
/**
 * Stop node monitor
 *
 * ./ts-node frm-cli.ts --node-monitor-stop
 */
function monitorStop() {
    if (monitorIntervalId) {
        clearInterval(monitorIntervalId);
        monitorIntervalId = null;
        console.log(`${(0, utils_1.now)()} [INFO] [NODE] Node monitor stopped`);
    }
}
exports.monitorStop = monitorStop;
function monitorGetStatus() {
    return monitorIntervalId !== null;
}
exports.monitorGetStatus = monitorGetStatus;
/**
 * Check node active processes
 *
 */
function monitorCheckNode(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // check all services
        let procId;
        const viewedFullnodes = [];
        for (procId in processes) {
            const proc = processes[procId];
            if (proc.type === 'fullnode-run') {
                const fullnodeCommands = fullnodesConfigs_1.fullnodesCommands[proc.name];
                viewedFullnodes.push(proc.name);
                if (typeof fullnodeCommands.getInfos === 'function') {
                    let fullnodeStats;
                    try {
                        fullnodeStats = yield fullnodeCommands.getInfos(config, {});
                        fullnodeStats.dataDate = Date.now();
                        fullnodesStats[proc.name] = fullnodeStats;
                    }
                    catch (err) {
                        //throw { message: err.message };
                        delete fullnodesStats[proc.name];
                    }
                }
            }
        }
        for (const fullnodeName in fullnodesStats) {
            if (!viewedFullnodes.includes(fullnodeName)) {
                delete fullnodesStats[fullnodeName];
            }
        }
        dateLastCheck = Date.now();
    });
}
exports.monitorCheckNode = monitorCheckNode;
function getInstalledFullnodes(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const fullnodesDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}node${SEP}fullnodes`;
        const fullnodesNames = yield (0, utils_1.getDirFiles)(fullnodesDir);
        return fullnodesNames;
    });
}
exports.getInstalledFullnodes = getInstalledFullnodes;
function getRunningFullnodes(config) {
    //const nodeInfos = getNodeInfos(config);
    //const runningFullnodes = Object.keys(nodeInfos.fullnodesStats);
    let procName;
    let nodeProcesses = getProcesses();
    const runningFullnodes = [];
    for (procName in nodeProcesses) {
        const proc = nodeProcesses[procName];
        if (!proc.process)
            continue;
        runningFullnodes.push(proc.name);
    }
    return runningFullnodes;
}
exports.getRunningFullnodes = getRunningFullnodes;
function getInstallableFullnodes(config) {
    return Object.entries(fullnodesConfigs_1.fullnodesInstalls).map(entry => {
        const [fullnodeName, fullnodeInstall] = entry;
        if (fullnodeInstall.version === 'edit-me')
            return '';
        return fullnodeName;
    }).filter(fullnodeName => fullnodeName !== '');
}
exports.getInstallableFullnodes = getInstallableFullnodes;
function getRunnableFullnodes(config) {
    return Object.entries(fullnodesConfigs_1.fullnodesCommands).map(entry => {
        const [fullnodeName, fullnodeCommand] = entry;
        if (fullnodeCommand.command === 'edit-me' && fullnodeCommand.p2pPort === -1)
            return '';
        return fullnodeName;
    }).filter(fullnodeName => fullnodeName !== '');
}
exports.getRunnableFullnodes = getRunnableFullnodes;
function getManagedFullnodes(config) {
    return Object.entries(fullnodesConfigs_1.fullnodesCommands).map(entry => {
        const [fullnodeName, fullnodeCommand] = entry;
        if (fullnodeCommand.rpcPort <= 0)
            return '';
        if (typeof fullnodeCommand.getInfos !== 'function')
            return '';
        return fullnodeName;
    }).filter(fullnodeName => fullnodeName !== '');
}
exports.getManagedFullnodes = getManagedFullnodes;
function fullnodeInstallStart(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if ((params.fullnode + '/install') in processes) {
            throw { message: `Fullnode ${params.fullnode} install is already running` };
        }
        if (!(params.fullnode in fullnodesConfigs_1.fullnodesCommands)) {
            throw { message: `Unknown fullnode ${params.fullnode}` };
        }
        const fullnodeInstall = fullnodesConfigs_1.fullnodesInstalls[params.fullnode];
        return fullnodeInstall.install(config, params);
    });
}
exports.fullnodeInstallStart = fullnodeInstallStart;
function fullnodeRunStart(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!params.fullnode) {
            throw { message: `Missing fullnode parameter` };
        }
        if (`fullnode-run-${params.fullnode}` in processes) {
            throw { message: `Fullnode ${params.fullnode} run is already running` };
        }
        if (!(params.fullnode in fullnodesConfigs_1.fullnodesCommands)) {
            throw { message: `Unknown fullnode ${params.fullnode}` };
        }
        const fullnodeCommands = fullnodesConfigs_1.fullnodesCommands[params.fullnode];
        const cmdFile = fullnodeCommands.getCommandFile(config, params);
        const args = fullnodeCommands.getCommandArgs(config, params);
        const dataDir = `${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`;
        const appDir = `${config.appDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`;
        const cmdPath = `${appDir}${SEP}${cmdFile}`;
        const logDir = `${config.logDir}${SEP}node${SEP}fullnodes`;
        const logFile = `${logDir}${SEP}${params.fullnode}.run.log`;
        const errFile = `${logDir}${SEP}${params.fullnode}.run.err`;
        const pidDir = `${config.pidDir}${SEP}node${SEP}fullnodes`;
        const pidFile = `${pidDir}${SEP}${params.fullnode}.run.pid`;
        fs_1.default.mkdirSync(dataDir, { recursive: true });
        fs_1.default.mkdirSync(logDir, { recursive: true });
        fs_1.default.mkdirSync(pidDir, { recursive: true });
        if (true) {
            // truncate log files
            fs_1.default.writeFileSync(logFile, '');
            fs_1.default.writeFileSync(errFile, '');
        }
        if (!fs_1.default.existsSync(appDir)) {
            throw { message: `Fullnode ${params.fullnode} is not installed` };
        }
        if (!fs_1.default.existsSync(cmdPath)) {
            throw { message: `Fullnode ${params.fullnode} cmdPath is misconfigured` };
        }
        const process = {
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
        console.log(`${(0, utils_1.now)()} [INFO] [NODE] Fullnode Run Start: ${params.fullnode}`);
        const onSpawn = function (proc) {
            processes[`fullnode-run-${params.fullnode}`].pid = proc.pid;
            processes[`fullnode-run-${params.fullnode}`].process = proc;
            fs_1.default.writeFileSync(pidFile, (proc.pid || -1).toString());
        };
        const onStdOut = function (data) {
            //console.log('RECEIVED FROM CMD STDOUT:', data.toString());
            fs_1.default.appendFileSync(logFile, data);
        };
        const onStdErr = function (data) {
            //console.log('RECEIVED FROM CMD STDERR:', data.toString());
            fs_1.default.appendFileSync(logFile, data);
            fs_1.default.appendFileSync(errFile, data);
        };
        const onEnd = function (returnCode, err) {
            delete processes[`fullnode-run-${params.fullnode}`];
            fs_1.default.rmSync(pidFile, { force: true });
            console.debug(`${(0, utils_1.now)()} [DEBUG] [NODE] PROCESS COMPLETED ${params.fullnode} (rc: ${returnCode})`);
        };
        //console.debug(`${now()} [DEBUG] [NODE] Running command: ${cmdPath} ${args.join(' ')}`);
        (0, exec_1.exec)(cmdPath, args, '', dataDir, onSpawn, onStdOut, onStdErr, onEnd, processName)
            .catch((err) => {
            console.warn(`${(0, utils_1.now)()} [WARNING] [NODE] PROCESS ERROR ${params.fullnode} : ${err.message}`);
        });
        return processes[`fullnode-run-${params.fullnode}`];
    });
}
exports.fullnodeRunStart = fullnodeRunStart;
function fullnodeRunStop(config, params, forceKill = false) {
    if (!(`fullnode-run-${params.fullnode}` in processes)) {
        throw { message: `Fullnode ${params.fullnode} is not running` };
    }
    const proc = processes[`fullnode-run-${params.fullnode}`];
    if (!proc.process) {
        throw { message: `Fullnode ${params.fullnode} process is not killable` };
    }
    const signal = forceKill ? 'SIGKILL' : 'SIGINT';
    console.debug(`${(0, utils_1.now)()} [DEBUG] [NODE] KILLING PROCESS ${params.fullnode} with signal ${signal}...`);
    proc.process.kill(signal);
}
exports.fullnodeRunStop = fullnodeRunStop;
function fullnodeRunGetStatus(config, params) {
    if (!(`fullnode-run-${params.fullnode}` in processes)) {
        return false;
    }
    const proc = processes[`fullnode-run-${params.fullnode}`];
    if (!proc.process) {
        return false;
    }
    return proc.process.exitCode === null;
}
exports.fullnodeRunGetStatus = fullnodeRunGetStatus;
function fullnodeRunLog(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const logFile = `${config.logDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}.run.log`;
        if (!fs_1.default.existsSync(logFile)) {
            return '';
        }
        let text = yield (0, utils_1.tailFile)(logFile, params.lines || 50);
        text = text.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors
        return text;
    });
}
exports.fullnodeRunLog = fullnodeRunLog;
function fullnodeRunGetInfos(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!(`fullnode-run-${params.fullnode}` in processes)) {
            throw { message: `Fullnode ${params.fullnode} is not running` };
        }
        if (!(params.fullnode in fullnodesConfigs_1.fullnodesCommands)) {
            throw { message: `Unknown fullnode ${params.fullnode}` };
        }
        const fullnode = fullnodesConfigs_1.fullnodesCommands[params.fullnode];
        if (typeof fullnode.getInfos !== 'function') {
            throw { message: `Fullnode not managed` };
        }
        let fullnodeStats;
        try {
            fullnodeStats = yield fullnode.getInfos(config, params);
        }
        catch (err) {
            throw { message: err.message };
        }
        return fullnodeStats;
    });
}
exports.fullnodeRunGetInfos = fullnodeRunGetInfos;
function getProcesses() {
    return processes;
}
exports.getProcesses = getProcesses;
function getNodeInfos(config) {
    if (nodeMainInfos === null) {
        const _cpus = os_1.default.cpus();
        const cpus = [
            {
                name: _cpus[0].model,
                threads: _cpus.length,
            }
        ];
        nodeMainInfos = {
            name: config.node.name || os_1.default.hostname(),
            hostname: os_1.default.hostname(),
            ip: ((0, utils_1.getLocalIpAddresses)() || [])[0] || 'no-ip',
            nodeOs: os_1.default.version(),
            cpus,
        };
    }
    const { name, hostname, ip, nodeOs, cpus } = nodeMainInfos;
    const uptime = os_1.default.uptime();
    const loadAvg = os_1.default.loadavg()[0];
    const memoryUsed = os_1.default.totalmem() - os_1.default.freemem();
    const memoryTotal = os_1.default.totalmem();
    const freeminingVersion = ''; // TODO
    const monitorStatus = false; // TODO
    const runningFullnodes = []; // TODO
    const runningFullnodesAliases = []; // TODO
    const installedFullnodes = []; // TODO
    const installedFullnodesAliases = []; // TODO
    const nodeInfos = {
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
        config: {},
        status: {
            monitorStatus,
            runningFullnodes,
            runningFullnodesAliases,
            installedFullnodes,
            installedFullnodesAliases,
            fullnodesStats,
        },
        dataDate: dateLastCheck,
    };
    return nodeInfos;
}
exports.getNodeInfos = getNodeInfos;
function getAllFullnodes(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const installedFullnodes = yield getInstalledFullnodes(config);
        const runningFullnodes = getRunningFullnodes(config);
        const installableFullnodes = getInstallableFullnodes(config); // TODO: mettre en cache
        const runnableFullnodes = getRunnableFullnodes(config); // TODO: mettre en cache
        const managedFullnodes = getManagedFullnodes(config); // TODO: mettre en cache
        const fullnodesNames = Array.from(new Set([
            ...installedFullnodes,
            ...runningFullnodes,
            ...installableFullnodes,
            ...runnableFullnodes,
            ...managedFullnodes,
        ]));
        const fullnodes = Object.fromEntries(fullnodesNames.map(fullnodeName => {
            return [
                fullnodeName,
                {
                    installed: installedFullnodes.includes(fullnodeName),
                    running: runningFullnodes.includes(fullnodeName),
                    installable: installableFullnodes.includes(fullnodeName),
                    runnable: runnableFullnodes.includes(fullnodeName),
                    managed: managedFullnodes.includes(fullnodeName),
                }
            ];
        }));
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
    });
}
exports.getAllFullnodes = getAllFullnodes;
