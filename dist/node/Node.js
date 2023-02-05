"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFullnodes = exports.getNodeInfos = exports.getProcesses = exports.fullnodeRunGetInfos = exports.fullnodeRunGetLog = exports.fullnodeRunGetStatus = exports.fullnodeRunStop = exports.fullnodeRunStart = exports.getInstalledFullnodeConfiguration = exports.fullnodeInstallStart = exports.getManagedFullnodes = exports.getRunnableFullnodes = exports.getInstallableFullnodes = exports.getRunningFullnodesAliases = exports.getInstalledFullnodesAliases = exports.getInstalledFullnodes = exports.monitorCheckNode = exports.monitorGetStatus = exports.monitorStop = exports.monitorStart = void 0;
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
                const fullnodeAlias = proc.name;
                const fullnodeName = proc.fullnode || '';
                const fullnodeFullName = `${fullnodeName}-${fullnodeAlias}`;
                const fullnodeCommands = fullnodesConfigs_1.fullnodesCommands[fullnodeName];
                viewedFullnodes.push(fullnodeFullName);
                if (typeof fullnodeCommands.getInfos === 'function') {
                    let fullnodeStats;
                    try {
                        fullnodeStats = yield fullnodeCommands.getInfos(config, {});
                        fullnodeStats.dataDate = Date.now();
                        fullnodeStats.fullnode = fullnodeStats.fullnode || {};
                        fullnodeStats.fullnode.fullnodeName = fullnodeName;
                        fullnodeStats.fullnode.fullnodeAlias = fullnodeAlias;
                        fullnodesStats[fullnodeFullName] = fullnodeStats;
                    }
                    catch (err) {
                        //throw { message: err.message };
                        delete fullnodesStats[fullnodeFullName];
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
function getInstalledFullnodesAliases(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const fullnodesDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}node${SEP}fullnodes`;
        const fullnodesNames = yield (0, utils_1.getDirFiles)(fullnodesDir);
        const installedFullnodesAliases = fullnodesNames.map(fullnodeName => {
            const fullnodeConfigFile = `${fullnodesDir}${SEP}${fullnodeName}${SEP}freeminingFullnode.json`;
            if (fs_1.default.existsSync(fullnodeConfigFile)) {
                const fullnodeConfigFileJson = fs_1.default.readFileSync(fullnodeConfigFile).toString();
                const fullnodeConfig = JSON.parse(fullnodeConfigFileJson);
                return fullnodeConfig;
            }
            return null;
        }).filter(conf => !!conf);
        return installedFullnodesAliases;
    });
}
exports.getInstalledFullnodesAliases = getInstalledFullnodesAliases;
function getRunningFullnodesAliases(config) {
    let procName;
    let nodeProcesses = getProcesses();
    const runningFullnodes = [];
    for (procName in nodeProcesses) {
        const proc = nodeProcesses[procName];
        if (!proc.process)
            continue;
        runningFullnodes.push({
            fullnode: proc.fullnode || '',
            alias: proc.name,
            pid: proc.pid || 0,
            dateStart: proc.dateStart,
            //apiPort: proc.apiPort, // TODO
        });
    }
    return runningFullnodes;
}
exports.getRunningFullnodesAliases = getRunningFullnodesAliases;
function getInstallableFullnodes(config) {
    return Object.entries(fullnodesConfigs_1.fullnodesInstalls).map(entry => {
        const [fullnodeName, fullnodeInstall] = entry;
        if (!fullnodeInstall.lastVersion || fullnodeInstall.lastVersion === 'edit-me')
            return '';
        return fullnodeName;
    }).filter(fullnodeName => fullnodeName !== '');
}
exports.getInstallableFullnodes = getInstallableFullnodes;
function getRunnableFullnodes(config) {
    return Object.entries(fullnodesConfigs_1.fullnodesCommands).map(entry => {
        const [fullnodeName, fullnodeCommand] = entry;
        if (!fullnodeCommand.command || fullnodeCommand.command === 'edit-me')
            return '';
        //if (fullnodeCommand.p2pPort === -1) return '';
        return fullnodeName;
    }).filter(fullnodeName => fullnodeName !== '');
}
exports.getRunnableFullnodes = getRunnableFullnodes;
function getManagedFullnodes(config) {
    return Object.entries(fullnodesConfigs_1.fullnodesCommands).map(entry => {
        const [fullnodeName, fullnodeCommand] = entry;
        if (fullnodeCommand.rpcPort <= 0)
            return '';
        if (!fullnodeCommand.managed)
            return '';
        return fullnodeName;
    }).filter(fullnodeName => fullnodeName !== '');
}
exports.getManagedFullnodes = getManagedFullnodes;
function fullnodeInstallStart(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const fullnodeName = params.fullnode;
        if (!fullnodeName) {
            throw new Error(`Missing fullnode parameter`);
        }
        //if ((fullnodeName + '/install') in processes) {
        //    throw { message: `Fullnode ${fullnodeName} install is already running` };
        //}
        if (!(fullnodeName in fullnodesConfigs_1.fullnodesCommands)) {
            throw { message: `Unknown fullnode ${fullnodeName}` };
        }
        const fullnodeInstall = fullnodesConfigs_1.fullnodesInstalls[fullnodeName];
        /* await */ fullnodeInstall.install(config, params).catch((err) => {
            console.warn(`${(0, utils_1.now)()} [WARNING] [NODE] Cannot start fullnode ${fullnodeName} : ${err.message}`);
        });
    });
}
exports.fullnodeInstallStart = fullnodeInstallStart;
function getInstalledFullnodeConfiguration(config, fullnodeName) {
    const fullnodeDir = `${config.appDir}${SEP}node${SEP}fullnodes${SEP}${fullnodeName}`;
    const configFile = `${fullnodeDir}/freeminingFullnode.json`;
    let fullnodeConfig = {
        name: fullnodeName,
        title: fullnodeName,
        lastVersion: "",
        defaultAlias: "",
        versions: {},
    };
    if (fs_1.default.existsSync(configFile)) {
        const fullnodeConfigJson = fs_1.default.readFileSync(configFile).toString();
        try {
            fullnodeConfig = JSON.parse(fullnodeConfigJson);
        }
        catch (err) {
            console.warn(`${(0, utils_1.now)()} [WARNING] [NODE] Cannot get fullnode configuration of fullnode ${fullnodeName} : ${err.message}`);
        }
    }
    return fullnodeConfig;
}
exports.getInstalledFullnodeConfiguration = getInstalledFullnodeConfiguration;
function fullnodeRunStart(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const fullnodeName = params.fullnode;
        const fullnodeConfig = getInstalledFullnodeConfiguration(config, fullnodeName);
        const fullnodeAlias = params.alias || fullnodeConfig.defaultAlias;
        const fullnodeFullTitle = (fullnodeName === fullnodeAlias) ? fullnodeName : `${fullnodeName} (${fullnodeAlias}))`;
        if (!fullnodeName) {
            throw new Error(`Missing fullnode parameter`);
        }
        if (!fullnodeAlias) {
            throw new Error(`Missing alias parameter`);
        }
        if (!(fullnodeName in fullnodesConfigs_1.fullnodesCommands)) {
            throw { message: `Unknown fullnode ${fullnodeName}` };
        }
        if (`fullnode-run-${fullnodeAlias}` in processes) {
            throw { message: `fullnode ${fullnodeFullTitle} run is already running` };
        }
        const fullnodeCommands = fullnodesConfigs_1.fullnodesCommands[fullnodeName];
        const cmdFile = fullnodeCommands.getCommandFile(config, params);
        const args = fullnodeCommands.getCommandArgs(config, params);
        const dataDir = `${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${fullnodeName}`;
        const fullnodeDir = `${config.appDir}${SEP}node${SEP}fullnodes${SEP}${fullnodeName}`;
        const aliasDir = `${fullnodeDir}${SEP}${fullnodeAlias}`;
        const cmdPath = `${aliasDir}${SEP}${cmdFile}`;
        const logDir = `${config.logDir}${SEP}node${SEP}fullnodes${SEP}${fullnodeName}`;
        const logFile = `${logDir}${SEP}${fullnodeAlias}.run.log`;
        const errFile = `${logDir}${SEP}${fullnodeAlias}.run.err`;
        const pidDir = `${config.pidDir}${SEP}node${SEP}fullnodes${SEP}${fullnodeName}`;
        const pidFile = `${pidDir}${SEP}${fullnodeAlias}.run.pid`;
        fs_1.default.mkdirSync(dataDir, { recursive: true });
        fs_1.default.mkdirSync(logDir, { recursive: true });
        fs_1.default.mkdirSync(pidDir, { recursive: true });
        if (true) {
            // truncate log files
            fs_1.default.writeFileSync(logFile, '');
            fs_1.default.writeFileSync(errFile, '');
        }
        if (!fs_1.default.existsSync(aliasDir)) {
            throw { message: `Fullnode ${fullnodeName} is not installed` };
        }
        if (!fs_1.default.existsSync(cmdPath)) {
            throw { message: `Fullnode ${fullnodeName} cmdPath is misconfigured` };
        }
        const process = {
            type: 'fullnode-run',
            name: fullnodeAlias,
            fullnode: fullnodeName,
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
        console.log(`${(0, utils_1.now)()} [INFO] [NODE] Fullnode Run Start: ${fullnodeName} (${fullnodeAlias}))`);
        const onSpawn = function (proc) {
            processes[`fullnode-run-${fullnodeName}-${fullnodeAlias}`].pid = proc.pid;
            processes[`fullnode-run-${fullnodeName}-${fullnodeAlias}`].process = proc;
            fs_1.default.writeFileSync(pidFile, (proc.pid || -1).toString());
            console.debug(`${(0, utils_1.now)()} [DEBUG] [NODE] PROCESS SPWANED ${fullnodeName}-${fullnodeAlias} (pid: ${proc.pid})`);
            // /* await */ monitorAutoCheckNode(config);
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
            delete processes[`fullnode-run-${fullnodeName}-${fullnodeAlias}`];
            fs_1.default.rmSync(pidFile, { force: true });
            // /* await */ monitorAutoCheckNode(config);
            console.debug(`${(0, utils_1.now)()} [DEBUG] [NODE] PROCESS COMPLETED ${fullnodeName}-${fullnodeAlias} (rc: ${returnCode})`);
        };
        //console.debug(`${now()} [DEBUG] [NODE] Running command: ${cmdPath} ${args.join(' ')}`);
        (0, exec_1.exec)(cmdPath, args, '', dataDir, onSpawn, onStdOut, onStdErr, onEnd, processName)
            .catch((err) => {
            console.warn(`${(0, utils_1.now)()} [WARNING] [NODE] PROCESS ERROR ${fullnodeName}-${fullnodeAlias} : ${err.message}`);
        });
        return processes[`fullnode-run-${fullnodeName}-${fullnodeAlias}`];
    });
}
exports.fullnodeRunStart = fullnodeRunStart;
function fullnodeRunStop(config, params, forceKill = false) {
    const fullnodeName = params.fullnode;
    const fullnodeConfig = getInstalledFullnodeConfiguration(config, fullnodeName);
    const fullnodeAlias = params.alias || fullnodeConfig.defaultAlias;
    const fullnodeFullTitle = (fullnodeName === fullnodeAlias) ? fullnodeName : `${fullnodeName} (${fullnodeAlias}))`;
    if (!fullnodeName) {
        throw new Error(`Missing fullnode parameter`);
    }
    if (!fullnodeAlias) {
        throw new Error(`Missing alias parameter`);
    }
    if (!(`fullnode-run-${fullnodeName}-${fullnodeAlias}` in processes)) {
        throw { message: `Fullnode ${fullnodeFullTitle} is not running` };
    }
    const proc = processes[`fullnode-run-${fullnodeName}-${fullnodeAlias}`];
    if (!proc.process) {
        throw { message: `Fullnode ${fullnodeFullTitle} process is not killable` };
    }
    const signal = forceKill ? 'SIGKILL' : 'SIGINT';
    console.debug(`${(0, utils_1.now)()} [DEBUG] [NODE] KILLING PROCESS ${fullnodeFullTitle} with signal ${signal}...`);
    proc.process.kill(signal);
}
exports.fullnodeRunStop = fullnodeRunStop;
function fullnodeRunGetStatus(config, params) {
    const fullnodeName = params.fullnode;
    let fullnodeAlias = params.alias;
    if (!fullnodeAlias) {
        const fullnodeConfig = getInstalledFullnodeConfiguration(config, fullnodeName);
        fullnodeAlias = fullnodeConfig.defaultAlias;
    }
    if (!fullnodeName) {
        throw new Error(`Missing fullnode parameter`);
        return false;
    }
    if (!fullnodeAlias) {
        //throw new Error(`Missing alias parameter`);
        return false;
    }
    if (!(`fullnode-run-${fullnodeName}-${fullnodeAlias}` in processes)) {
        return false;
    }
    const proc = processes[`fullnode-run-${fullnodeName}-${fullnodeAlias}`];
    if (!proc.process) {
        return false;
    }
    return proc.process.exitCode === null;
}
exports.fullnodeRunGetStatus = fullnodeRunGetStatus;
function fullnodeRunGetLog(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const fullnodeName = params.fullnode;
        const fullnodeConfig = getInstalledFullnodeConfiguration(config, fullnodeName);
        const fullnodeAlias = params.alias || fullnodeConfig.defaultAlias;
        if (!fullnodeName) {
            throw new Error(`Missing fullnode parameter`);
        }
        if (!fullnodeAlias) {
            throw new Error(`Missing alias parameter`);
        }
        const logFile = `${config.logDir}${SEP}node${SEP}fullnodes${SEP}${fullnodeName}${SEP}${fullnodeAlias}.run.log`;
        if (!fs_1.default.existsSync(logFile)) {
            return Promise.resolve('');
        }
        let text = yield (0, utils_1.tailFile)(logFile, params.lines || 50);
        text = text.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors
        return text;
    });
}
exports.fullnodeRunGetLog = fullnodeRunGetLog;
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
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (nodeMainInfos === null) {
            const _cpus = os_1.default.cpus();
            const cpus = [
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
                name: config.node.name || os_1.default.hostname(),
                hostname: os_1.default.hostname(),
                ip: ((0, utils_1.getLocalIpAddresses)() || [])[0] || 'no-ip',
                nodeOs: os_1.default.version(),
                cpus,
                runnableFullnodes,
                installableFullnodes,
                managedFullnodes,
                freeminingVersion,
            };
        }
        const { name, hostname, ip, nodeOs, systemInfos, runnableFullnodes, installableFullnodes, managedFullnodes, freeminingVersion } = nodeMainInfos;
        const { uptime, loadAvg, memoryUsed, memoryTotal } = getNodeUsage();
        const installedFullnodes = yield getInstalledFullnodes(config);
        const installedFullnodesAliases = yield getInstalledFullnodesAliases(config);
        const runningFullnodesAliases = getRunningFullnodesAliases(config);
        const runningFullnodes = Array.from(new Set(runningFullnodesAliases.map(runningFullnode => runningFullnode.fullnode)));
        const monitorStatus = monitorGetStatus();
        const cpus = []; // TODO
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
        };
        return nodeInfos;
    });
}
exports.getNodeInfos = getNodeInfos;
function getAllFullnodes(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const installedFullnodes = yield getInstalledFullnodes(config);
        const runningFullnodesAliases = getRunningFullnodesAliases(config);
        const installableFullnodes = getInstallableFullnodes(config); // TODO: mettre en cache
        const runnableFullnodes = getRunnableFullnodes(config); // TODO: mettre en cache
        const managedFullnodes = getManagedFullnodes(config); // TODO: mettre en cache
        const installedFullnodesAliases = yield getInstalledFullnodesAliases(config);
        const fullnodesNames = Array.from(new Set([
            ...installedFullnodes,
            ...runningFullnodesAliases.map(runningFullnode => runningFullnode.fullnode),
            ...installableFullnodes,
            ...runnableFullnodes,
            ...managedFullnodes,
        ]));
        const fullnodes = Object.fromEntries(fullnodesNames.map(fullnodeName => {
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
function getNodeUsage() {
    const uptime = os_1.default.uptime();
    const loadAvg = os_1.default.loadavg()[0];
    const memoryUsed = os_1.default.totalmem() - os_1.default.freemem();
    const memoryTotal = os_1.default.totalmem();
    return {
        uptime,
        loadAvg,
        memoryUsed,
        memoryTotal,
    };
}
