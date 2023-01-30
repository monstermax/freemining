"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodeInfos = exports.getProcesses = exports.fullnodeRunInfos = exports.fullnodeRunStatus = exports.fullnodeRunStop = exports.fullnodeRunStart = exports.fullnodeInstallStart = exports.getManagedFullnodes = exports.getRunnableFullnodes = exports.getInstallableFullnodes = exports.getRunningFullnodes = exports.getInstalledFullnodes = exports.monitorCheckNode = exports.monitorStatus = exports.monitorStop = exports.monitorStart = void 0;
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
const fullnodesInfos = {};
let nodeMainInfos = null;
/* ########## FUNCTIONS ######### */
/**
 * Start node monitor (poll running processes API every x seconds)
 *
 * ./ts-node frm-cli.ts --node-monitor-start
 */
function monitorStart(config, params) {
    if (monitorIntervalId) {
        return;
    }
    const pollDelay = Number((0, utils_1.getOpt)('--poll-delay')) || defaultPollDelay;
    monitorIntervalId = setInterval(monitorCheckNode, pollDelay, config);
    console.log(`${(0, utils_1.now)()} [INFO] [NODE] Node monitor started`);
}
exports.monitorStart = monitorStart;
/**
 * Stop node monitor
 *
 * ./ts-node frm-cli.ts --node-monitor-stop
 */
function monitorStop(config, params) {
    if (monitorIntervalId) {
        clearInterval(monitorIntervalId);
        monitorIntervalId = null;
        console.log(`${(0, utils_1.now)()} [INFO] [NODE] Node monitor stopped`);
    }
}
exports.monitorStop = monitorStop;
function monitorStatus(config, params) {
    return monitorIntervalId !== null;
}
exports.monitorStatus = monitorStatus;
/**
 * Check node active processes
 *
 */
function monitorCheckNode(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // check all services
        let procId;
        for (procId in processes) {
            const proc = processes[procId];
            if (proc.type === 'fullnode-run') {
                const fullnodeCommands = fullnodesConfigs_1.fullnodesCommands[proc.name];
                let fullnodeInfos;
                try {
                    fullnodeInfos = yield fullnodeCommands.getInfos(config, {});
                    fullnodeInfos.dataDate = new Date;
                    fullnodesInfos[proc.name] = fullnodeInfos;
                }
                catch (err) {
                    //throw { message: err.message };
                    delete fullnodesInfos[proc.name];
                }
            }
        }
    });
}
exports.monitorCheckNode = monitorCheckNode;
function getInstalledFullnodes(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const fullnodesDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}node${SEP}fullnodes`;
        const fullnodesNames = yield (0, utils_1.getDirFiles)(fullnodesDir);
        return fullnodesNames;
    });
}
exports.getInstalledFullnodes = getInstalledFullnodes;
function getRunningFullnodes(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        //const nodeInfos = getNodeInfos();
        //const runningFullnodes = Object.keys(nodeInfos.fullnodesInfos);
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
    });
}
exports.getRunningFullnodes = getRunningFullnodes;
function getInstallableFullnodes(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return Object.entries(fullnodesConfigs_1.fullnodesInstalls).map(entry => {
            const [fullnodeName, fullnodeInstall] = entry;
            if (fullnodeInstall.version === 'edit-me')
                return '';
            return fullnodeName;
        }).filter(fullnodeName => fullnodeName !== '');
    });
}
exports.getInstallableFullnodes = getInstallableFullnodes;
function getRunnableFullnodes(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return Object.entries(fullnodesConfigs_1.fullnodesCommands).map(entry => {
            const [fullnodeName, fullnodeCommand] = entry;
            if (fullnodeCommand.command === 'edit-me' && fullnodeCommand.p2pPort === -1)
                return '';
            return fullnodeName;
        }).filter(fullnodeName => fullnodeName !== '');
    });
}
exports.getRunnableFullnodes = getRunnableFullnodes;
function getManagedFullnodes(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return Object.entries(fullnodesConfigs_1.fullnodesCommands).map(entry => {
            const [fullnodeName, fullnodeCommand] = entry;
            if (fullnodeCommand.rpcPort === -1)
                return '';
            return fullnodeName;
        }).filter(fullnodeName => fullnodeName !== '');
    });
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
        fullnodeInstall.install(config, params);
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
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
    });
}
exports.fullnodeRunStop = fullnodeRunStop;
function fullnodeRunStatus(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // TODO
    });
}
exports.fullnodeRunStatus = fullnodeRunStatus;
function fullnodeRunInfos(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        //if (! (`fullnode-run-${params.fullnode}` in processes)) {
        //    throw { message: `Fullnode ${params.fullnode} is not running` };
        //}
        if (!(params.fullnode in fullnodesConfigs_1.fullnodesCommands)) {
            throw { message: `Unknown fullnode ${params.fullnode}` };
        }
        const fullnode = fullnodesConfigs_1.fullnodesCommands[params.fullnode];
        let fullnodeInfos;
        try {
            fullnodeInfos = yield fullnode.getInfos(config, params);
        }
        catch (err) {
            throw { message: err.message };
        }
        return fullnodeInfos;
    });
}
exports.fullnodeRunInfos = fullnodeRunInfos;
function getProcesses() {
    return processes;
}
exports.getProcesses = getProcesses;
function getNodeInfos() {
    if (nodeMainInfos === null) {
        const _cpus = os_1.default.cpus();
        const cpus = [
            {
                name: _cpus[0].model,
                threads: _cpus.length,
            }
        ];
        nodeMainInfos = {
            name: (0, utils_1.getOpt)('--node-name') || os_1.default.hostname(),
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
    const nodeInfos = {
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
    };
    return nodeInfos;
}
exports.getNodeInfos = getNodeInfos;
