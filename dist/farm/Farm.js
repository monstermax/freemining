"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFarmInfos = exports.getRigConfig = exports.setRigConfig = exports.getRigStatus = exports.setRigStatus = exports.rigAuthRequest = exports.farmAgentGetStatus = exports.farmAgentStop = exports.farmAgentStart = exports.rigsServerGetStatus = exports.rigsServerStop = exports.rigsServerStart = void 0;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const farmRigsServerWebsocket = tslib_1.__importStar(require("./farmRigsServerWebsocket"));
const utils_1 = require("../common/utils");
/* ########## MAIN ######### */
const rigsConfigs = {};
const rigsInfos = {};
/*
TODO: a transformer en :
{
    rig: {
        name: string,
        hostname: string,
        ip: string,
        os: string,
        uptime: number,
    }
    usage
    devices
    freeminingVersion: string,
    installableMiners: string[],
    installedMiners: string[], // + aliases ?
    runningMiners: string[], // + aliases ?
    monitorStatus: boolean,
    minersStats: t.RigInfos (renommer RigInfos en MinersStats)
}
*/
//const websocketPassword = 'xxx'; // password to access farm websocket server
let farmMainInfos = null;
/* ########## FUNCTIONS ######### */
function rigsServerStart(config) {
    farmRigsServerWebsocket.start(config);
}
exports.rigsServerStart = rigsServerStart;
function rigsServerStop() {
    farmRigsServerWebsocket.stop();
}
exports.rigsServerStop = rigsServerStop;
function rigsServerGetStatus() {
    return farmRigsServerWebsocket.status();
}
exports.rigsServerGetStatus = rigsServerGetStatus;
function farmAgentStart(config) {
    farmRigsServerWebsocket.start(config);
    console.log(`${(0, utils_1.now)()} [INFO] [FARM] Rigs server started`);
}
exports.farmAgentStart = farmAgentStart;
function farmAgentStop() {
    farmRigsServerWebsocket.stop();
    console.log(`${(0, utils_1.now)()} [INFO] [FARM] Rigs server stopped`);
}
exports.farmAgentStop = farmAgentStop;
function farmAgentGetStatus() {
    // TODO
    return false;
}
exports.farmAgentGetStatus = farmAgentGetStatus;
function rigAuthRequest(config, params) {
    if (!farmRigsServerWebsocket.status())
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
    if (!farmRigsServerWebsocket.status())
        return;
    rigsInfos[rigName] = rigInfos;
}
exports.setRigStatus = setRigStatus;
function getRigStatus(rigName) {
    if (!farmRigsServerWebsocket.status())
        return null;
    if (!(rigName in rigsInfos))
        return null;
    return rigsInfos[rigName];
}
exports.getRigStatus = getRigStatus;
function setRigConfig(rigName, rigConfig) {
    if (!farmRigsServerWebsocket.status())
        return;
    rigsConfigs[rigName] = rigConfig;
}
exports.setRigConfig = setRigConfig;
function getRigConfig(rigName) {
    if (!farmRigsServerWebsocket.status())
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
