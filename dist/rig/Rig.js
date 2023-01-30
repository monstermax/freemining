"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProcesses = exports.minerRunInfos = exports.minerRunStatus = exports.minerRunStop = exports.minerRunStart = exports.minerInstallStart = exports.monitorCheckRig = exports.monitorStop = exports.monitorStart = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = require("../common/utils");
const exec_1 = require("../common/exec");
const minersConfigs_1 = require("./minersConfigs");
/* ########## MAIN ######### */
const processes = {};
let monitorIntervalId = null;
const defaultPollDelay = 10000; // 10 seconds
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
        const minersProcessesInfos = {};
        for (procId in processes) {
            const proc = processes[procId];
            if (proc.type === 'miner-run') {
                const minerCommands = minersConfigs_1.minersCommands[proc.name];
                const infos = yield minerCommands.getInfos(config, {});
                minersProcessesInfos[proc.name] = infos;
            }
        }
        const rigInfos = {
            rigName: 'noname',
            miners: minersProcessesInfos,
        };
        console.log();
        console.log(`Infos of local RIG :`);
        console.log(rigInfos);
        console.log();
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
        const runningDir = `${config.dataDir}/rig/miners/${params.miner}`;
        const appDir = `${config.appDir}/rig/miners/${params.miner}`;
        const cmdPath = `${appDir}${path_1.default.sep}${cmdFile}`;
        const logDir = `${config.logDir}/rig/miners`;
        const logFile = `${logDir}/${params.miner}.run.log`;
        const errFile = `${logDir}/${params.miner}.run.err`;
        const pidDir = `${config.pidDir}/rig/miners`;
        const pidFile = `${pidDir}/${params.miner}.run.pid`;
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
        const minerInfos = yield miner.getInfos(config, params);
        return minerInfos;
    });
}
exports.minerRunInfos = minerRunInfos;
function getProcesses() {
    return processes;
}
exports.getProcesses = getProcesses;
