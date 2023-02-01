"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMiners = exports.getRigInfos = exports.getRigPs = exports.getProcesses = exports.minerRunInfos = exports.minerRunLog = exports.minerRunStatus = exports.minerRunStop = exports.minerRunStart = exports.minerInstallStart = exports.getManagedMiners = exports.getRunnableMiners = exports.getInstallableMiners = exports.getRunningMiners = exports.getInstalledMiners = exports.monitorCheckRig = exports.monitorStatus = exports.monitorStop = exports.monitorStart = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const os_1 = tslib_1.__importDefault(require("os"));
const path_1 = tslib_1.__importDefault(require("path"));
const child_process_1 = require("child_process");
const utils_1 = require("../common/utils");
const exec_1 = require("../common/exec");
const minersConfigs_1 = require("./minersConfigs");
// GPU infos for windows: https://github.com/FallingSnow/gpu-info
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
const processes = {};
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
function monitorStart(config, params) {
    if (monitorIntervalId) {
        return;
    }
    const pollDelay = Number((0, utils_1.getOpt)('--rig-monitor-poll-delay')) || defaultPollDelay;
    monitorIntervalId = setInterval(monitorCheckRig, pollDelay, config);
    console.log(`${(0, utils_1.now)()} [INFO] [RIG] Rig monitor started`);
}
exports.monitorStart = monitorStart;
/**
 * Stop rig monitor
 *
 * ./ts-node frm-cli.ts --rig-monitor-stop
 */
function monitorStop(config, params) {
    if (monitorIntervalId) {
        clearInterval(monitorIntervalId);
        monitorIntervalId = null;
        console.log(`${(0, utils_1.now)()} [INFO] [RIG] Rig monitor stopped`);
    }
}
exports.monitorStop = monitorStop;
function monitorStatus(config, params) {
    return monitorIntervalId !== null;
}
exports.monitorStatus = monitorStatus;
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
                const minerCommands = minersConfigs_1.minersCommands[proc.name];
                viewedMiners.push(proc.name);
                let minerInfos;
                try {
                    minerInfos = yield minerCommands.getInfos(config, {});
                    minerInfos.dataDate = Date.now();
                    minersInfos[proc.name] = minerInfos;
                }
                catch (err) {
                    //throw { message: err.message };
                    delete minersInfos[proc.name];
                }
            }
        }
        for (const minerName in minersInfos) {
            if (!viewedMiners.includes(minerName)) {
                delete minersInfos[minerName];
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
function getRunningMiners(config, params) {
    //const rigInfos = getRigInfos();
    //const runningMiners = Object.keys(rigInfos.minersInfos);
    let procName;
    let rigProcesses = getProcesses();
    const runningMiners = [];
    for (procName in rigProcesses) {
        const proc = rigProcesses[procName];
        if (!proc.process)
            continue;
        runningMiners.push(proc.name);
    }
    return runningMiners;
}
exports.getRunningMiners = getRunningMiners;
function getInstallableMiners(config, params) {
    return Object.entries(minersConfigs_1.minersInstalls).map(entry => {
        const [minerName, minerInstall] = entry;
        if (minerInstall.version === 'edit-me')
            return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}
exports.getInstallableMiners = getInstallableMiners;
function getRunnableMiners(config, params) {
    return Object.entries(minersConfigs_1.minersCommands).map(entry => {
        const [minerName, minerCommand] = entry;
        if (minerCommand.command === 'edit-me')
            return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}
exports.getRunnableMiners = getRunnableMiners;
function getManagedMiners(config, params) {
    return Object.entries(minersConfigs_1.minersCommands).map(entry => {
        const [minerName, minerCommand] = entry;
        if (minerCommand.apiPort === -1)
            return '';
        return minerName;
    }).filter(minerName => minerName !== '');
}
exports.getManagedMiners = getManagedMiners;
function minerInstallStart(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if ((params.miner + '/install') in processes) {
            throw { message: `Miner ${params.miner} install is already running` };
        }
        if (!(params.miner in minersConfigs_1.minersCommands)) {
            throw { message: `Unknown miner ${params.miner}` };
        }
        const minerInstall = minersConfigs_1.minersInstalls[params.miner];
        /* await */ minerInstall.install(config, params);
    });
}
exports.minerInstallStart = minerInstallStart;
function minerRunStart(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!params.miner) {
            throw { message: `Missing miner parameter` };
        }
        if (`miner-run-${params.miner}` in processes) {
            throw { message: `Miner ${params.miner} run is already running` };
        }
        if (!(params.miner in minersConfigs_1.minersCommands)) {
            throw { message: `Unknown miner ${params.miner}` };
        }
        const rigInfos = getRigInfos();
        const opts = {
            rigName: rigInfos.infos.name,
        };
        params.poolUser = (0, utils_1.stringTemplate)(params.poolUser, opts, false, false, false);
        const minerCommands = minersConfigs_1.minersCommands[params.miner];
        const cmdFile = minerCommands.getCommandFile(config, params);
        const args = minerCommands.getCommandArgs(config, params);
        const dataDir = `${config.dataDir}${SEP}rig${SEP}miners${SEP}${params.miner}`;
        const appDir = `${config.appDir}${SEP}rig${SEP}miners${SEP}${params.miner}`;
        const cmdPath = `${appDir}${SEP}${cmdFile}`;
        const logDir = `${config.logDir}${SEP}rig${SEP}miners`;
        const logFile = `${logDir}${SEP}${params.miner}.run.log`;
        const errFile = `${logDir}${SEP}${params.miner}.run.err`;
        const pidDir = `${config.pidDir}${SEP}rig${SEP}miners`;
        const pidFile = `${pidDir}${SEP}${params.miner}.run.pid`;
        fs_1.default.mkdirSync(dataDir, { recursive: true });
        fs_1.default.mkdirSync(logDir, { recursive: true });
        fs_1.default.mkdirSync(pidDir, { recursive: true });
        if (true) {
            // truncate log files
            fs_1.default.writeFileSync(logFile, '');
            fs_1.default.writeFileSync(errFile, '');
        }
        if (!fs_1.default.existsSync(appDir)) {
            throw { message: `Miner ${params.miner} is not installed` };
        }
        if (!fs_1.default.existsSync(cmdPath)) {
            throw { message: `Miner ${params.miner} cmdPath is misconfigured` };
        }
        const process = {
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
        console.log(`${(0, utils_1.now)()} [INFO] [RIG] Miner Run Start: ${params.miner}`);
        const onSpawn = function (proc) {
            processes[`miner-run-${params.miner}`].pid = proc.pid;
            processes[`miner-run-${params.miner}`].process = proc;
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
            delete processes[`miner-run-${params.miner}`];
            fs_1.default.rmSync(pidFile, { force: true });
            console.debug(`${(0, utils_1.now)()} [DEBUG] [RIG] PROCESS COMPLETED ${params.miner} (rc: ${returnCode})`);
        };
        //console.debug(`${now()} [DEBUG] [RIG] Running command: ${cmdPath} ${args.join(' ')}`);
        (0, exec_1.exec)(cmdPath, args, '', dataDir, onSpawn, onStdOut, onStdErr, onEnd, processName)
            .catch((err) => {
            console.warn(`${(0, utils_1.now)()} [WARNING] [RIG] PROCESS ERROR ${params.miner} : ${err.message}`);
        });
        return processes[`miner-run-${params.miner}`];
    });
}
exports.minerRunStart = minerRunStart;
function minerRunStop(config, params, forceKill = false) {
    if (!(`miner-run-${params.miner}` in processes)) {
        throw { message: `Miner ${params.miner} is not running` };
    }
    const proc = processes[`miner-run-${params.miner}`];
    if (!proc.process) {
        throw { message: `Miner ${params.miner} process is not killable` };
    }
    const signal = forceKill ? 'SIGKILL' : 'SIGINT';
    console.debug(`${(0, utils_1.now)()} [DEBUG] [RIG] KILLING PROCESS ${params.miner} with signal ${signal}...`);
    proc.process.kill(signal);
}
exports.minerRunStop = minerRunStop;
function minerRunStatus(config, params) {
    if (!(`miner-run-${params.miner}` in processes)) {
        return false;
    }
    const proc = processes[`miner-run-${params.miner}`];
    if (!proc.process) {
        return false;
    }
    return proc.process.exitCode === null;
}
exports.minerRunStatus = minerRunStatus;
function minerRunLog(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const logFile = `${config.logDir}${SEP}rig${SEP}miners${SEP}${params.miner}.run.log`;
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
        if (!(`miner-run-${params.miner}` in processes)) {
            throw { message: `Miner ${params.miner} is not running` };
        }
        if (!(params.miner in minersConfigs_1.minersCommands)) {
            throw { message: `Unknown miner ${params.miner}` };
        }
        const miner = minersConfigs_1.minersCommands[params.miner];
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
    };
    return rigInfos;
}
exports.getRigInfos = getRigInfos;
function getAllMiners(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const installedMiners = yield getInstalledMiners(config);
        const runningMiners = getRunningMiners(config);
        const installableMiners = getInstallableMiners(config); // TODO: mettre en cache
        const runnableMiners = getRunnableMiners(config); // TODO: mettre en cache
        const managedMiners = getManagedMiners(config); // TODO: mettre en cache
        const minersNames = Array.from(new Set([
            ...installedMiners,
            ...runningMiners,
            ...installableMiners,
            ...runnableMiners,
            ...managedMiners,
        ]));
        const miners = Object.fromEntries(minersNames.map(minerName => {
            return [
                minerName,
                {
                    installed: installedMiners.includes(minerName),
                    running: runningMiners.includes(minerName),
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
