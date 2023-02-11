"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmMinerRunLog = exports.farmMinerRunGetStatus = exports.farmMinerRunStop = exports.farmMinerRunStart = exports.farmMinerInstallStop = exports.farmMinerInstallStart = exports.setRigWs = exports.getRigWs = exports.getFarmInfos = exports.getRigConfig = exports.setRigConfig = exports.getRigStatus = exports.setRigStatus = exports.rigAuthRequest = exports.rigsServerGetStatus = exports.rigsServerStop = exports.rigsServerStart = void 0;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const utils_1 = require("../common/utils");
/* ########## MAIN ######### */
const rigsConfigs = {};
const rigsInfos = {};
const rigsWs = {};
let farmMainInfos = null;
let active = false;
/* ########## FUNCTIONS ######### */
function rigsServerStart(config) {
    if (active)
        return;
    active = true;
    // TODO
    //console.log(`${now()} [INFO] [FARM] Rigs server started`);
}
exports.rigsServerStart = rigsServerStart;
function rigsServerStop() {
    //if (! active) return;
    active = false;
    // TODO
    //console.log(`${now()} [INFO] [FARM] Rigs server stopped`);
}
exports.rigsServerStop = rigsServerStop;
function rigsServerGetStatus() {
    return active;
}
exports.rigsServerGetStatus = rigsServerGetStatus;
function rigAuthRequest(config, params) {
    if (!rigsServerGetStatus())
        return;
    const rig = params.user;
    const pass = params.pass || '';
    if (!rig) {
        return false;
    }
    const websocketPassword = config.farm.wssPass || '';
    //if (! pass) {
    //    return false;
    //}
    if (pass !== websocketPassword) {
        return false;
    }
    return true;
}
exports.rigAuthRequest = rigAuthRequest;
function setRigStatus(rigName, rigInfos) {
    if (!rigsServerGetStatus())
        return;
    rigsInfos[rigName] = rigInfos;
}
exports.setRigStatus = setRigStatus;
function getRigStatus(rigName) {
    if (!rigsServerGetStatus())
        return null;
    if (!(rigName in rigsInfos))
        return null;
    return rigsInfos[rigName];
}
exports.getRigStatus = getRigStatus;
function setRigConfig(rigName, rigConfig) {
    if (!rigsServerGetStatus())
        return;
    rigsConfigs[rigName] = rigConfig;
}
exports.setRigConfig = setRigConfig;
function getRigConfig(rigName) {
    if (!rigsServerGetStatus())
        return null;
    if (!(rigName in rigsConfigs))
        return null;
    return rigsConfigs[rigName];
}
exports.getRigConfig = getRigConfig;
function getFarmInfos(config) {
    if (farmMainInfos === null) {
        farmMainInfos = {
            name: config.farm.name || os_1.default.hostname(),
            hostname: os_1.default.hostname(),
            ip: ((0, utils_1.getLocalIpAddresses)() || [])[0] || 'no-ip',
            farmOs: os_1.default.version(),
        };
    }
    const { name, hostname, ip, rigOs } = farmMainInfos;
    const uptime = os_1.default.uptime();
    const loadAvg = os_1.default.loadavg()[0];
    const memoryUsed = os_1.default.totalmem() - os_1.default.freemem();
    const memoryTotal = os_1.default.totalmem();
    return {
        farm: {
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
        rigsInfos,
        dataDate: null,
    };
}
exports.getFarmInfos = getFarmInfos;
function getRigWs(rigName) {
    return rigsWs[rigName];
}
exports.getRigWs = getRigWs;
function setRigWs(rigName, rigWs) {
    if (rigWs === null) {
        delete rigsWs[rigName];
    }
    else {
        rigsWs[rigName] = rigWs;
    }
}
exports.setRigWs = setRigWs;
function rpcSendRequest(ws, id, method, params) {
    const req = (0, utils_1.buildRpcRequest)(id, method, params);
    const reqStr = JSON.stringify(req);
    //console.debug(`${now()} [DEBUG] [FARM] sending request: ${reqStr}`);
    ws.send(reqStr);
}
function farmMinerInstallStart(rigName, params) {
    const rigWs = rigsWs[rigName];
    if (!rigWs)
        return; // todo return error
    const method = 'farmMinerInstallStart';
    rpcSendRequest(rigWs, 1, method, params);
}
exports.farmMinerInstallStart = farmMinerInstallStart;
function farmMinerInstallStop(rigName, params) {
    const rigWs = getRigWs(rigName);
    if (!rigWs)
        return; // todo return error
    const method = 'farmMinerInstallStop';
    rpcSendRequest(rigWs, 1, method, params);
}
exports.farmMinerInstallStop = farmMinerInstallStop;
function farmMinerRunStart(rigName, params) {
    const rigWs = getRigWs(rigName);
    if (!rigWs)
        return; // todo return error
    const method = 'farmMinerRunStart';
    rpcSendRequest(rigWs, 1, method, params);
}
exports.farmMinerRunStart = farmMinerRunStart;
function farmMinerRunStop(rigName, params, forceKill = false) {
    const rigWs = getRigWs(rigName);
    if (!rigWs)
        return; // todo return error
    const method = 'farmMinerRunStop';
    rpcSendRequest(rigWs, 1, method, params);
}
exports.farmMinerRunStop = farmMinerRunStop;
function farmMinerRunGetStatus(rigName, params) {
    const rigWs = getRigWs(rigName);
    if (!rigWs)
        return; // todo return error
    const method = 'farmMinerRunGetStatus';
    rpcSendRequest(rigWs, 1, method, params);
}
exports.farmMinerRunGetStatus = farmMinerRunGetStatus;
function farmMinerRunLog(rigName, params) {
    const rigWs = getRigWs(rigName);
    if (!rigWs)
        return; // todo return error
    const method = 'farmMinerRunLog';
    rpcSendRequest(rigWs, 1, method, params);
}
exports.farmMinerRunLog = farmMinerRunLog;
