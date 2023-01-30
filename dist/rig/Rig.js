"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRigInfos = exports.getProcesses = exports.minerRunInfos = exports.minerRunStatus = exports.minerRunStop = exports.minerRunStart = exports.minerInstallStart = exports.monitorCheckRig = exports.monitorStop = exports.monitorStart = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const os_1 = tslib_1.__importDefault(require("os"));
const path_1 = tslib_1.__importDefault(require("path"));
const child_process_1 = require("child_process");
const utils_1 = require("../common/utils");
const exec_1 = require("../common/exec");
const minersConfigs_1 = require("./minersConfigs");
/* ########## MAIN ######### */
const SEP = (os_1.default.platform() === 'win32') ? path_1.default.sep.repeat(2) : path_1.default.sep;
const processes = {};
let monitorIntervalId = null;
const defaultPollDelay = 10000; // 10 seconds
const minersInfos = {};
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
    const pollDelay = Number((0, utils_1.getOpt)('--poll-delay')) || defaultPollDelay;
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
/**
 * Check rig active processes
 *
 */
function monitorCheckRig(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // check all services
        let procId;
        for (procId in processes) {
            const proc = processes[procId];
            if (proc.type === 'miner-run') {
                const minerCommands = minersConfigs_1.minersCommands[proc.name];
                let minerInfos;
                try {
                    minerInfos = yield minerCommands.getInfos(config, {});
                    minerInfos.dataDate = new Date;
                    minersInfos[proc.name] = minerInfos;
                }
                catch (err) {
                    //throw { message: err.message };
                    delete minersInfos[proc.name];
                }
            }
        }
    });
}
exports.monitorCheckRig = monitorCheckRig;
function minerInstallStart(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if ((params.miner + '/install') in processes) {
            throw { message: `Miner ${params.miner} install is already running` };
        }
        if (!(params.miner in minersConfigs_1.minersCommands)) {
            throw { message: `Unknown miner ${params.miner}` };
        }
        const minerInstall = minersConfigs_1.minersInstalls[params.miner];
        minerInstall.install(config, params);
    });
}
exports.minerInstallStart = minerInstallStart;
function minerRunStart(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!params.miner) {
            throw { message: `Missing '-miner' parameter` };
        }
        if (`miner-run-${params.miner}` in processes) {
            throw { message: `Miner ${params.miner} run is already running` };
        }
        if (!(params.miner in minersConfigs_1.minersCommands)) {
            throw { message: `Unknown miner ${params.miner}` };
        }
        const minerCommands = minersConfigs_1.minersCommands[params.miner];
        const cmdFile = minerCommands.getCommandFile(config, params);
        const args = minerCommands.getCommandArgs(config, params);
        const runningDir = `${config.dataDir}${SEP}rig${SEP}miners${SEP}${params.miner}`;
        const appDir = `${config.appDir}${SEP}rig${SEP}miners${SEP}${params.miner}`;
        const cmdPath = `${appDir}${SEP}${cmdFile}`;
        const logDir = `${config.logDir}${SEP}rig${SEP}miners`;
        const logFile = `${logDir}${SEP}${params.miner}.run.log`;
        const errFile = `${logDir}${SEP}${params.miner}.run.err`;
        const pidDir = `${config.pidDir}${SEP}rig${SEP}miners`;
        const pidFile = `${pidDir}${SEP}${params.miner}.run.pid`;
        fs_1.default.mkdirSync(logDir, { recursive: true });
        fs_1.default.mkdirSync(pidDir, { recursive: true });
        fs_1.default.mkdirSync(runningDir, { recursive: true });
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
        if (!fs_1.default.existsSync(runningDir)) {
            throw { message: `Miner ${params.miner} dataDir is misconfigured` };
        }
        const process = {
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
        (0, exec_1.exec)(cmdPath, args, '', runningDir, onSpawn, onStdOut, onStdErr, onEnd, processName)
            .catch((err) => {
            console.warn(`${(0, utils_1.now)()} [WARNING] [RIG] PROCESS ERROR ${params.miner} : ${err.message}`);
        });
        return processes[`miner-run-${params.miner}`];
    });
}
exports.minerRunStart = minerRunStart;
function minerRunStop(config, params, forceKill = false) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
    });
}
exports.minerRunStop = minerRunStop;
function minerRunStatus(config, params) {
    // TODO
}
exports.minerRunStatus = minerRunStatus;
function minerRunInfos(config, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        //if (! (`miner-run-${params.miner}` in processes)) {
        //    throw { message: `Miner ${params.miner} is not running` };
        //}
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
function getRigInfos() {
    const name = (0, utils_1.getOpt)('--rig-name') || os_1.default.hostname();
    const hostname = os_1.default.hostname();
    const ip = ((0, utils_1.getLocalIpAddresses)() || [])[0] || 'no-ip';
    const rigOs = os_1.default.version();
    const uptime = os_1.default.uptime();
    const loadAvg = os_1.default.loadavg()[0];
    const memoryUsed = os_1.default.totalmem() - os_1.default.freemem();
    const memoryTotal = os_1.default.totalmem();
    const _cpus = os_1.default.cpus();
    const cpus = [
        {
            name: _cpus[0].model,
            threads: _cpus.length,
            avgSpeed: _cpus.map(cpu => cpu.speed).reduce((a, b) => a + b, 0) / _cpus.length,
        }
    ];
    let gpuList;
    if (os_1.default.platform() === 'linux') {
        gpuList = (0, child_process_1.execSync)(`lspci | grep VGA |cut -d' ' -f5-`).toString().trim();
        // detailed output: 
        // lspci -nnkd ::300
        // temperatures & fanSpeeed [NVIDIA]
        // nvidia-smi --query-gpu=temperature.gpu,fan.speed --format=csv,noheader,nounits
        /*
        04:00.0 VGA compatible controller: Intel Corporation UHD Graphics 630 (Mobile)
        07:00.0 VGA compatible controller: NVIDIA Corporation GP104M [GeForce GTX 1070 Mobile] (rev a1)
        */
    }
    else if (os_1.default.platform() === 'win32') {
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
        };
    });
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
    };
    return rigInfos;
}
exports.getRigInfos = getRigInfos;
