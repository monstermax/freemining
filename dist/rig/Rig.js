"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMiners = exports.getRigInfos = exports.getRigPs = exports.getProcesses = exports.minerRunInfos = exports.minerRunLog = exports.minerRunStatus = exports.minerRunStop = exports.minerRunStart = exports.getInstalledMinerConfiguration = exports.minerInstallStart = exports.getManagedMiners = exports.getRunnableMiners = exports.getInstallableMiners = exports.getRunningMinersAliases = exports.getInstalledMiners = exports.monitorCheckRig = exports.farmAgentStatus = exports.farmAgentStop = exports.farmAgentStart = exports.monitorStatus = exports.monitorStop = exports.monitorStart = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const os_1 = tslib_1.__importDefault(require("os"));
const path_1 = tslib_1.__importDefault(require("path"));
const child_process_1 = require("child_process");
const utils_1 = require("../common/utils");
const exec_1 = require("../common/exec");
const minersConfigs_1 = require("./minersConfigs");
const rigFarmAgentWebsocket = tslib_1.__importStar(require("./rigFarmAgentWebsocket"));
//import type childProcess from 'child_process';
// GPU infos for windows: https://github.com/FallingSnow/gpu-info
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
const processes = {};
//const installs: t.MapString<any> = {}; // TODO: insert l'install en cours, puis delete à la fin de l'install
let monitorIntervalId = null;
const defaultPollDelay = 10000; // 10 seconds
const minersInfos = {};
let rigMainInfos = null;
let dateLastCheck = null;
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
function monitorStatus() {
    return monitorIntervalId !== null;
}
exports.monitorStatus = monitorStatus;
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
function farmAgentStatus() {
    return rigFarmAgentWebsocket.status();
}
exports.farmAgentStatus = farmAgentStatus;
function monitorAutoCheckRig(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const pollDelay = Number((0, utils_1.getOpt)('--rig-monitor-poll-delay')) || defaultPollDelay;
        if (monitorIntervalId) {
            clearTimeout(monitorIntervalId);
        }
        yield monitorCheckRig(config);
        if (farmAgentStatus()) {
            rigFarmAgentWebsocket.sendStatusToFarm();
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
                let minerInfos;
                try {
                    minerInfos = yield minerCommands.getInfos(config, {});
                    minerInfos.dataDate = Date.now();
                    minerInfos.miner = minerInfos.miner || {};
                    minerInfos.miner.minerName = minerName;
                    minerInfos.miner.minerAlias = minerAlias;
                    minersInfos[minerFullName] = minerInfos;
                }
                catch (err) {
                    //throw { message: err.message };
                    delete minersInfos[minerFullName];
                }
            }
        }
        for (const minerFullName in minersInfos) {
            if (!viewedMiners.includes(minerFullName)) {
                delete minersInfos[minerFullName];
            }
        }
        dateLastCheck = Date.now();
    });
}
exports.monitorCheckRig = monitorCheckRig;
function getInstalledMiners(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const minersDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}rig${SEP}miners`;
        const minersNames = yield (0, utils_1.getDirFiles)(minersDir);
        return minersNames;
    });
}
exports.getInstalledMiners = getInstalledMiners;
function getRunningMinersAliases(config, params) {
    let procName;
    let rigProcesses = getProcesses();
    const runningMiners = [];
    for (procName in rigProcesses) {
        const proc = rigProcesses[procName];
        if (!proc.process)
            continue;
        runningMiners.push({
            miner: proc.miner || '',
            alias: proc.name,
            pid: proc.pid || 0,
        });
    }
    return runningMiners;
}
exports.getRunningMinersAliases = getRunningMinersAliases;
function getInstallableMiners(config, params) {
    return Object.entries(minersConfigs_1.minersInstalls).map(entry => {
        const [minerName, minerInstall] = entry;
        if (!minerInstall.version || minerInstall.version === 'edit-me')
            return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}
exports.getInstallableMiners = getInstallableMiners;
function getRunnableMiners(config, params) {
    return Object.entries(minersConfigs_1.minersCommands).map(entry => {
        const [minerName, minerCommand] = entry;
        if (!minerCommand.command || minerCommand.command === 'edit-me')
            return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}
exports.getRunnableMiners = getRunnableMiners;
function getManagedMiners(config, params) {
    return Object.entries(minersConfigs_1.minersCommands).map(entry => {
        const [minerName, minerCommand] = entry;
        if (minerCommand.apiPort <= 0)
            return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}
exports.getManagedMiners = getManagedMiners;
function minerInstallStart(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        /* await */ minerInstall.install(config, params);
    });
}
exports.minerInstallStart = minerInstallStart;
function getInstalledMinerConfiguration(config, minerName) {
    const minerDir = `${config.appDir}${SEP}rig${SEP}miners${SEP}${minerName}`;
    const configFile = `${minerDir}/freemining.json`;
    let minerConfig = {};
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
        if (!(minerName in minersConfigs_1.minersCommands)) {
            throw { message: `Unknown miner ${minerName}` };
        }
        if (`miner-run-${minerAlias}` in processes) {
            throw { message: `Miner ${minerFullTitle} run is already running` };
        }
        const rigInfos = getRigInfos();
        const opts = {
            rigName: config.rigName || rigInfos.rig.name || 'anonymous-rig',
        };
        params.poolUser = (0, utils_1.stringTemplate)(params.poolUser, opts, false, false, false);
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
    });
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
function minerRunStatus(config, params) {
    const minerName = params.miner;
    const minerConfig = getInstalledMinerConfiguration(config, minerName);
    const minerAlias = params.alias || minerConfig.defaultAlias;
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
exports.minerRunStatus = minerRunStatus;
function minerRunLog(config, params) {
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
            return '';
        }
        let text = yield (0, utils_1.tailFile)(logFile, params.lines || 50);
        text = text.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors
        return text;
    });
}
exports.minerRunLog = minerRunLog;
function minerRunInfos(config, params) {
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
        let minerInfos;
        try {
            minerInfos = yield miner.getInfos(config, params);
        }
        catch (err) {
            throw { message: err.message };
        }
        return minerInfos;
    });
}
exports.minerRunInfos = minerRunInfos;
function getProcesses() {
    return processes;
}
exports.getProcesses = getProcesses;
function getRigPs() {
    let cmd = '';
    cmd = `ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining-beta\.rig\.") |grep -e '\[free[m]ining.*\]' --color -B1`; // linux
    //cmd = `tasklist /v /fo csv`;
    //cmd = `tasklist /v /fo csv /fi "pid eq <pid>"`;
    //cmd = `tasklist /v /fo csv /fi "ppid eq <pid>"`;
    //cmd = `wmic process where "ProcessId=<pid>" get ProcessId,PercentProcessorTime`;
    //cmd = `wmic process where "ParentProcessId=<pid>" get ProcessId,Name`;
}
exports.getRigPs = getRigPs;
function getRigInfos() {
    if (rigMainInfos === null) {
        const _cpus = os_1.default.cpus();
        const cpus = [
            {
                name: _cpus[0].model.trim(),
                threads: _cpus.length,
            }
        ];
        let gpuList;
        if (os_1.default.platform() === 'linux') {
            gpuList = (0, child_process_1.execSync)(`lspci | grep VGA |cut -d' ' -f5-`).toString().trim();
            /*
            04:00.0 VGA compatible controller: Intel Corporation UHD Graphics 630 (Mobile)
            07:00.0 VGA compatible controller: NVIDIA Corporation GP104M [GeForce GTX 1070 Mobile] (rev a1)
            */
            // detailed output: 
            // lspci -nnkd ::300
            // temperatures & fanSpeeed [NVIDIA]
            // nvidia-smi --query-gpu=temperature.gpu,fan.speed --format=csv,noheader,nounits
        }
        else if (os_1.default.platform() === 'win32') {
            // detailed output: 
            // dxdiag /t dxdiag.txt && find "Display Devices" -A 5 dxdiag.txt && del dxdiag.txt
            gpuList = (0, child_process_1.execSync)('wmic path win32_VideoController get Name').toString().trim();
            let tmpArr = gpuList.split(os_1.default.EOL);
            tmpArr.shift();
            tmpArr = tmpArr.map(item => item.trim());
            gpuList = tmpArr.join(os_1.default.EOL);
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
        }
        else if (os_1.default.platform() === 'darwin') {
            gpuList = (0, child_process_1.execSync)(`system_profiler SPDisplaysDataType | grep "Chipset Model" | cut -d" " -f3-`).toString().trim();
            /*
            Chipset Model: AMD Radeon Pro 555X
            Chipset Model: AMD Radeon Pro 560X
            */
            // temperatures & fanSpeeed
            // iStats gpu --temp
            // requires iStats => gem install iStats
        }
        else {
            gpuList = '';
        }
        const gpus = gpuList.split(os_1.default.EOL).map((gpuName, idx) => {
            return {
                id: idx,
                name: gpuName,
                driver: '', // TODO
            };
        });
        rigMainInfos = {
            name: (0, utils_1.getOpt)('--rig-name') || os_1.default.hostname(),
            hostname: os_1.default.hostname(),
            ip: ((0, utils_1.getLocalIpAddresses)() || [])[0] || 'no-ip',
            rigOs: os_1.default.version(),
            cpus,
            gpus,
        };
    }
    const { name, hostname, ip, rigOs, cpus, gpus } = rigMainInfos;
    const uptime = os_1.default.uptime();
    const loadAvg = os_1.default.loadavg()[0];
    const memoryUsed = os_1.default.totalmem() - os_1.default.freemem();
    const memoryTotal = os_1.default.totalmem();
    const rigInfos = {
        rig: {
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
    };
    return rigInfos;
}
exports.getRigInfos = getRigInfos;
function getAllMiners(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const installedMiners = yield getInstalledMiners(config);
        const runningMinersAliases = getRunningMinersAliases(config);
        const installableMiners = getInstallableMiners(config); // TODO: mettre en cache
        const runnableMiners = getRunnableMiners(config); // TODO: mettre en cache
        const managedMiners = getManagedMiners(config); // TODO: mettre en cache
        const minersNames = Array.from(new Set([
            ...installedMiners,
            ...runningMinersAliases.map(runningMiner => runningMiner.miner),
            ...installableMiners,
            ...runnableMiners,
            ...managedMiners,
        ]));
        const miners = Object.fromEntries(minersNames.map(minerName => {
            return [
                minerName,
                {
                    installed: installedMiners.includes(minerName),
                    running: runningMinersAliases.map(runningMiner => runningMiner.miner).includes(minerName),
                    installable: installableMiners.includes(minerName),
                    runnable: runnableMiners.includes(minerName),
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
