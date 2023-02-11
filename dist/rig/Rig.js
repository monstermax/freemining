"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMiners = exports.getRigInfos = exports.getProcesses = exports.minerRunGetInfos = exports.minerRunGetLog = exports.minerRunGetStatus = exports.minerRunStop = exports.minerRunStart = exports.getInstalledMinerConfiguration = exports.minerInstallStop = exports.minerInstallStart = exports.getManagedMiners = exports.getRunnableMiners = exports.getInstallableMiners = exports.getRunningMinersAliases = exports.getInstalledMinersAliases = exports.getInstalledMiners = exports.monitorCheckRig = exports.farmAgentGetStatus = exports.farmAgentStop = exports.farmAgentStart = exports.monitorGetStatus = exports.monitorStop = exports.monitorStart = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const os_1 = tslib_1.__importDefault(require("os"));
const path_1 = tslib_1.__importDefault(require("path"));
//import { execSync } from 'child_process';
const utils_1 = require("../common/utils");
const exec_1 = require("../common/exec");
const sysinfos_1 = require("../common/sysinfos");
const minersConfigs_1 = require("./minersConfigs");
const rigFarmAgentWebsocket = tslib_1.__importStar(require("./rigFarmAgentWebsocket"));
const Daemon = tslib_1.__importStar(require("../core/Daemon"));
//import type childProcess from 'child_process';
// GPU infos for windows: https://github.com/FallingSnow/gpu-info
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
const processes = {};
//const installs: t.MapString<any> = {}; // TODO: insert l'install en cours, puis delete à la fin de l'install
let monitorIntervalId = null;
const defaultPollDelay = 10000; // 10 seconds
const minersStats = {};
let rigMainInfos = null;
let dateLastCheck;
/* ########## FUNCTIONS ######### */
/**
 * Start rig monitor (poll running processes API every x seconds)
 *
 * ./ts-node frm-cli.ts --rig-monitor-start
 */
function monitorStart(config) {
    if (monitorIntervalId)
        return;
    /* await */ monitorAutoCheckRig(config);
    console.log(`${(0, utils_1.now)()} [INFO] [RIG] Rig monitor started`);
}
exports.monitorStart = monitorStart;
/**
 * Stop rig monitor
 *
 * ./ts-node frm-cli.ts --rig-monitor-stop
 */
function monitorStop() {
    if (!monitorIntervalId)
        return;
    clearTimeout(monitorIntervalId);
    monitorIntervalId = null;
    console.log(`${(0, utils_1.now)()} [INFO] [RIG] Rig monitor stopped`);
}
exports.monitorStop = monitorStop;
function monitorGetStatus() {
    return monitorIntervalId !== null;
}
exports.monitorGetStatus = monitorGetStatus;
function farmAgentStart(config) {
    rigFarmAgentWebsocket.start(config);
    console.log(`${(0, utils_1.now)()} [INFO] [RIG] Farm agent started`);
}
exports.farmAgentStart = farmAgentStart;
function farmAgentStop() {
    rigFarmAgentWebsocket.stop();
    console.log(`${(0, utils_1.now)()} [INFO] [RIG] Farm agent stopped`);
}
exports.farmAgentStop = farmAgentStop;
function farmAgentGetStatus() {
    return rigFarmAgentWebsocket.status();
}
exports.farmAgentGetStatus = farmAgentGetStatus;
function monitorAutoCheckRig(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const pollDelay = Number((0, utils_1.getOpt)('--rig-monitor-poll-delay')) || defaultPollDelay;
        if (monitorIntervalId) {
            clearTimeout(monitorIntervalId);
        }
        yield monitorCheckRig(config);
        if (farmAgentGetStatus()) {
            rigFarmAgentWebsocket.sendRigStatusToFarm(config);
        }
        monitorIntervalId = setTimeout(monitorAutoCheckRig, pollDelay, config);
    });
}
/**
 * Check rig active processes
 *
 */
function monitorCheckRig(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // check all services
        let procId;
        const viewedMiners = [];
        for (procId in processes) {
            const proc = processes[procId];
            if (proc.type === 'miner-run') {
                const minerAlias = proc.name;
                const minerName = proc.miner || '';
                const minerFullName = `${minerName}-${minerAlias}`;
                const minerCommands = minersConfigs_1.minersCommands[minerName];
                viewedMiners.push(minerFullName);
                if (typeof minerCommands.getInfos === 'function') {
                    let minerStats;
                    try {
                        minerStats = yield minerCommands.getInfos(config, {});
                        minerStats.dataDate = Date.now();
                        minerStats.miner = minerStats.miner || {};
                        minerStats.miner.minerName = minerName;
                        minerStats.miner.minerAlias = minerAlias;
                        minersStats[minerFullName] = minerStats;
                    }
                    catch (err) {
                        //throw { message: err.message };
                        delete minersStats[minerFullName];
                    }
                }
            }
        }
        for (const minerFullName in minersStats) {
            if (!viewedMiners.includes(minerFullName)) {
                delete minersStats[minerFullName];
            }
        }
        dateLastCheck = Date.now();
    });
}
exports.monitorCheckRig = monitorCheckRig;
function getInstalledMiners(config) {
    const minersDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}rig${SEP}miners`;
    const minersNames = (0, utils_1.getDirFilesSync)(minersDir);
    return minersNames;
}
exports.getInstalledMiners = getInstalledMiners;
function getInstalledMinersAliases(config) {
    const minersDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}rig${SEP}miners`;
    const minersNames = (0, utils_1.getDirFilesSync)(minersDir);
    const installedMinersAliases = {};
    for (const minerName of minersNames) {
        const minerConfigFile = `${minersDir}${SEP}${minerName}${SEP}freeminingMiner.json`;
        if (!fs_1.default.existsSync(minerConfigFile)) {
            continue;
        }
        const minerConfigFileJson = fs_1.default.readFileSync(minerConfigFile).toString();
        try {
            const minerConfig = JSON.parse(minerConfigFileJson); // as t.InstalledMinerConfig;
            installedMinersAliases[minerName] = minerConfig;
        }
        catch (err) {
            console.warn(`${(0, utils_1.now)()} [WARNING] [RIG] Cannot parse json : ${err.message}`);
        }
    }
    return installedMinersAliases;
}
exports.getInstalledMinersAliases = getInstalledMinersAliases;
function getRunningMinersAliases(config) {
    let procName;
    let rigProcesses = getProcesses();
    const runningMiners = {};
    for (procName in rigProcesses) {
        const proc = rigProcesses[procName];
        if (!proc.process)
            continue;
        const minerName = proc.miner || '';
        const minerAlias = proc.name;
        const minerFullName = `${minerName}-${minerAlias}`;
        runningMiners[minerName] = runningMiners[minerName] || {};
        runningMiners[minerName][minerFullName] = {
            miner: minerName,
            alias: minerAlias,
            pid: proc.pid || 0,
            dateStart: proc.dateStart,
            args: proc.args,
            params: proc.params,
            //apiPort: proc.apiPort, // TODO
        };
    }
    return runningMiners;
}
exports.getRunningMinersAliases = getRunningMinersAliases;
function getInstallableMiners(config) {
    return Object.entries(minersConfigs_1.minersInstalls).map(entry => {
        const [minerName, minerInstall] = entry;
        if (!minerInstall.lastVersion || minerInstall.lastVersion === 'edit-me')
            return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}
exports.getInstallableMiners = getInstallableMiners;
function getRunnableMiners(config) {
    return Object.entries(minersConfigs_1.minersCommands).map(entry => {
        const [minerName, minerCommand] = entry;
        if (!minerCommand.command || minerCommand.command === 'edit-me')
            return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}
exports.getRunnableMiners = getRunnableMiners;
function getManagedMiners(config) {
    return Object.entries(minersConfigs_1.minersCommands).map(entry => {
        const [minerName, minerCommand] = entry;
        if (minerCommand.apiPort <= 0)
            return '';
        if (!minerCommand.managed)
            return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}
exports.getManagedMiners = getManagedMiners;
function minerInstallStart(config, params) {
    const minerName = params.miner;
    if (!minerName) {
        throw new Error(`Missing miner parameter`);
    }
    //if (`miner-install-${minerName}` in processes) {
    //    throw { message: `Miner ${minerName} install is already running` };
    //}
    if (!(minerName in minersConfigs_1.minersCommands)) {
        throw { message: `Unknown miner ${minerName}` };
    }
    const minerInstall = minersConfigs_1.minersInstalls[minerName];
    /* await */ minerInstall.install(config, params).catch((err) => {
        console.warn(`${(0, utils_1.now)()} [WARNING] [RIG] Cannot start miner ${minerName} : ${err.message}`);
    });
}
exports.minerInstallStart = minerInstallStart;
function minerInstallStop(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const minerName = params.miner;
        if (!minerName) {
            throw new Error(`Missing miner parameter`);
        }
        // TODO
    });
}
exports.minerInstallStop = minerInstallStop;
function getInstalledMinerConfiguration(config, minerName) {
    const minerDir = `${config.appDir}${SEP}rig${SEP}miners${SEP}${minerName}`;
    const configFile = `${minerDir}/freeminingMiner.json`;
    let minerConfig = {
        name: minerName,
        title: minerName,
        lastVersion: "",
        defaultAlias: "",
        versions: {},
    };
    if (fs_1.default.existsSync(configFile)) {
        const minerConfigJson = fs_1.default.readFileSync(configFile).toString();
        try {
            minerConfig = JSON.parse(minerConfigJson);
        }
        catch (err) {
            console.warn(`${(0, utils_1.now)()} [WARNING] [RIG] Cannot get miner configuration of miner ${minerName} : ${err.message}`);
        }
    }
    return minerConfig;
}
exports.getInstalledMinerConfiguration = getInstalledMinerConfiguration;
function minerRunStart(config, params) {
    const minerName = params.miner;
    const minerConfig = getInstalledMinerConfiguration(config, minerName);
    const minerAlias = params.alias || minerConfig.defaultAlias;
    const minerFullTitle = (minerName === minerAlias) ? minerName : `${minerName} (${minerAlias}))`;
    if (!minerName) {
        throw new Error(`Missing miner parameter`);
    }
    if (!minerAlias) {
        throw new Error(`Missing alias parameter`);
    }
    if (!(minerName in minersConfigs_1.minersCommands)) {
        throw { message: `Unknown miner ${minerName}` };
    }
    if (`miner-run-${minerAlias}` in processes) {
        throw { message: `Miner ${minerFullTitle} run is already running` };
    }
    const rigName = config.rig.name || os_1.default.hostname();
    const opts = {
        rigName,
    };
    params.poolUser = (0, utils_1.stringTemplate)(params.poolUser, opts, false, false, false) || '';
    const minerCommands = minersConfigs_1.minersCommands[minerName];
    const cmdFile = minerCommands.getCommandFile(config, params);
    const args = minerCommands.getCommandArgs(config, params);
    const dataDir = `${config.dataDir}${SEP}rig${SEP}miners${SEP}${minerName}`;
    const minerDir = `${config.appDir}${SEP}rig${SEP}miners${SEP}${minerName}`;
    const aliasDir = `${minerDir}${SEP}${minerAlias}`;
    const cmdPath = `${aliasDir}${SEP}${cmdFile}`;
    const logDir = `${config.logDir}${SEP}rig${SEP}miners${SEP}${minerName}`;
    const logFile = `${logDir}${SEP}${minerAlias}.run.log`;
    const errFile = `${logDir}${SEP}${minerAlias}.run.err`;
    const pidDir = `${config.pidDir}${SEP}rig${SEP}miners${SEP}${minerName}`;
    const pidFile = `${pidDir}${SEP}${minerAlias}.run.pid`;
    fs_1.default.mkdirSync(dataDir, { recursive: true });
    fs_1.default.mkdirSync(logDir, { recursive: true });
    fs_1.default.mkdirSync(pidDir, { recursive: true });
    if (true) {
        // truncate log files
        fs_1.default.writeFileSync(logFile, '');
        fs_1.default.writeFileSync(errFile, '');
    }
    if (!fs_1.default.existsSync(aliasDir)) {
        throw { message: `Miner ${minerName} is not installed` };
    }
    if (!fs_1.default.existsSync(cmdPath)) {
        throw { message: `Miner ${minerName} cmdPath is misconfigured` };
    }
    const process = {
        type: 'miner-run',
        name: minerAlias,
        miner: minerName,
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
    processes[`miner-run-${minerName}-${minerAlias}`] = process;
    const processName = `[freemining-beta.rig.miners.${minerName}.${minerAlias}] ${cmdPath}`;
    console.log(`${(0, utils_1.now)()} [INFO] [RIG] Miner Run Start: ${minerName} (${minerAlias}))`);
    const onSpawn = function (proc) {
        processes[`miner-run-${minerName}-${minerAlias}`].pid = proc.pid;
        processes[`miner-run-${minerName}-${minerAlias}`].process = proc;
        fs_1.default.writeFileSync(pidFile, (proc.pid || -1).toString());
        console.debug(`${(0, utils_1.now)()} [DEBUG] [RIG] PROCESS SPWANED ${minerName}-${minerAlias} (pid: ${proc.pid})`);
        /* await */ monitorAutoCheckRig(config);
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
        delete processes[`miner-run-${minerName}-${minerAlias}`];
        fs_1.default.rmSync(pidFile, { force: true });
        /* await */ monitorAutoCheckRig(config);
        console.debug(`${(0, utils_1.now)()} [DEBUG] [RIG] PROCESS COMPLETED ${minerName}-${minerAlias} (rc: ${returnCode})`);
    };
    //console.debug(`${now()} [DEBUG] [RIG] Running command: ${cmdPath} ${args.join(' ')}`);
    (0, exec_1.exec)(cmdPath, args, '', dataDir, onSpawn, onStdOut, onStdErr, onEnd, processName)
        .catch((err) => {
        console.warn(`${(0, utils_1.now)()} [WARNING] [RIG] PROCESS ERROR ${minerName}-${minerAlias} : ${err.message}`);
    });
    return processes[`miner-run-${minerName}-${minerAlias}`];
}
exports.minerRunStart = minerRunStart;
function minerRunStop(config, params, forceKill = false) {
    const minerName = params.miner;
    const minerConfig = getInstalledMinerConfiguration(config, minerName);
    const minerAlias = params.alias || minerConfig.defaultAlias;
    const minerFullTitle = (minerName === minerAlias) ? minerName : `${minerName} (${minerAlias}))`;
    if (!minerName) {
        throw new Error(`Missing miner parameter`);
    }
    if (!minerAlias) {
        throw new Error(`Missing alias parameter`);
    }
    if (!(`miner-run-${minerName}-${minerAlias}` in processes)) {
        throw { message: `Miner ${minerFullTitle} is not running` };
    }
    const proc = processes[`miner-run-${minerName}-${minerAlias}`];
    if (!proc.process) {
        throw { message: `Miner ${minerFullTitle} process is not killable` };
    }
    const signal = forceKill ? 'SIGKILL' : 'SIGINT';
    console.debug(`${(0, utils_1.now)()} [DEBUG] [RIG] KILLING PROCESS ${minerFullTitle} with signal ${signal}...`);
    proc.process.kill(signal);
}
exports.minerRunStop = minerRunStop;
function minerRunGetStatus(config, params) {
    const minerName = params.miner;
    let minerAlias = params.alias;
    if (!minerAlias) {
        const minerConfig = getInstalledMinerConfiguration(config, minerName);
        minerAlias = minerConfig.defaultAlias;
    }
    if (!minerName) {
        throw new Error(`Missing miner parameter`);
        return false;
    }
    if (!minerAlias) {
        //throw new Error(`Missing alias parameter`);
        return false;
    }
    if (!(`miner-run-${minerName}-${minerAlias}` in processes)) {
        return false;
    }
    const proc = processes[`miner-run-${minerName}-${minerAlias}`];
    if (!proc.process) {
        return false;
    }
    return proc.process.exitCode === null;
}
exports.minerRunGetStatus = minerRunGetStatus;
function minerRunGetLog(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const minerName = params.miner;
        const minerConfig = getInstalledMinerConfiguration(config, minerName);
        const minerAlias = params.alias || minerConfig.defaultAlias;
        if (!minerName) {
            throw new Error(`Missing miner parameter`);
        }
        if (!minerAlias) {
            throw new Error(`Missing alias parameter`);
        }
        const logFile = `${config.logDir}${SEP}rig${SEP}miners${SEP}${minerName}${SEP}${minerAlias}.run.log`;
        if (!fs_1.default.existsSync(logFile)) {
            return Promise.resolve('');
        }
        let text = yield (0, utils_1.tailFile)(logFile, params.lines || 50);
        text = text.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors
        return text;
    });
}
exports.minerRunGetLog = minerRunGetLog;
function minerRunGetInfos(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const minerName = params.miner;
        const minerConfig = getInstalledMinerConfiguration(config, minerName);
        const minerAlias = params.alias || minerConfig.defaultAlias;
        const minerFullTitle = (minerName === minerAlias) ? minerName : `${minerName} (${minerAlias}))`;
        if (!minerName) {
            throw new Error(`Missing miner parameter`);
        }
        if (!minerAlias) {
            throw new Error(`Missing alias parameter`);
        }
        if (!(`miner-run-${minerName}-${minerAlias}` in processes)) {
            throw { message: `Miner ${minerFullTitle} is not running` };
        }
        if (!(minerName in minersConfigs_1.minersCommands)) {
            throw { message: `Unknown miner ${minerName}` };
        }
        const miner = minersConfigs_1.minersCommands[minerName];
        if (typeof miner.getInfos !== 'function') {
            throw { message: `Miner not managed` };
        }
        let minerStats;
        try {
            minerStats = yield miner.getInfos(config, params);
        }
        catch (err) {
            throw { message: err.message };
        }
        return minerStats;
    });
}
exports.minerRunGetInfos = minerRunGetInfos;
function getProcesses() {
    return processes;
}
exports.getProcesses = getProcesses;
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
function getRigInfos(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (rigMainInfos === null) {
            const sysinfos = yield Daemon.getSysInfos();
            const disks = sysinfos.disks.map((disk) => ({
                device: disk.device,
                interfaceType: disk.interfaceType,
                name: disk.name,
                size: disk.size,
                type: disk.type,
                vendor: disk.vendor,
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
            const systemInfos = {
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
                net: {
                    interface: netIface,
                    gateway: sysinfos.netGateway,
                },
                disks,
                fs: sysinfos.fs,
            };
            const runnableMiners = getRunnableMiners(config);
            const installableMiners = getInstallableMiners(config);
            const managedMiners = getManagedMiners(config);
            const freeminingVersion = config.version;
            rigMainInfos = {
                name: config.rig.name || os_1.default.hostname(),
                hostname: os_1.default.hostname(),
                ip: ((0, utils_1.getLocalIpAddresses)() || [])[0] || 'no-ip',
                rigOs: os_1.default.version(),
                systemInfos,
                runnableMiners,
                installableMiners,
                managedMiners,
                freeminingVersion,
            };
        }
        const currentLoad = yield (0, sysinfos_1.getCurrentLoad)();
        const { name, hostname, ip, rigOs, systemInfos, runnableMiners, installableMiners, managedMiners, freeminingVersion } = rigMainInfos;
        const { uptime, loadAvg, memoryUsed, memoryTotal } = getRigUsage();
        const installedMiners = yield getInstalledMiners(config);
        const installedMinersAliases = yield getInstalledMinersAliases(config);
        const runningMinersAliases = getRunningMinersAliases(config);
        const runningMiners = Object.keys(runningMinersAliases);
        const monitorStatus = monitorGetStatus();
        const farmAgentStatus = farmAgentGetStatus();
        const rigInfos = {
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
                cpuLoad: currentLoad.currentLoad || -1,
                memory: {
                    used: memoryUsed,
                    total: memoryTotal,
                },
            },
            config: config.rig,
            status: {
                monitorStatus,
                installableMiners,
                installedMiners,
                installedMinersAliases,
                runnableMiners,
                runningMiners,
                runningMinersAliases,
                managedMiners,
                minersStats: minersStats,
                farmAgentStatus,
            },
            dataDate: dateLastCheck,
        };
        return rigInfos;
    });
}
exports.getRigInfos = getRigInfos;
function getAllMiners(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const installableMiners = getInstallableMiners(config); // TODO: mettre en cache
        const installedMinersAliases = yield getInstalledMinersAliases(config);
        const installedMiners = Object.keys(installedMinersAliases);
        const runnableMiners = getRunnableMiners(config); // TODO: mettre en cache
        const runningMinersAliases = getRunningMinersAliases(config);
        const runningMiners = Object.keys(runningMinersAliases);
        const managedMiners = getManagedMiners(config); // TODO: mettre en cache
        const minersNames = Array.from(new Set([
            ...installableMiners,
            ...installedMiners,
            ...runnableMiners,
            ...runningMiners,
            ...managedMiners,
        ]));
        const miners = Object.fromEntries(minersNames.map(minerName => {
            return [
                minerName,
                {
                    installable: installableMiners.includes(minerName),
                    installed: installedMiners.includes(minerName),
                    installedAliases: installedMinersAliases,
                    runnable: runnableMiners.includes(minerName),
                    running: runningMiners.includes(minerName),
                    runningAlias: runningMinersAliases,
                    managed: managedMiners.includes(minerName),
                }
            ];
        }));
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
    });
}
exports.getAllMiners = getAllMiners;
