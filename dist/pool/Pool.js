"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPoolInfos = void 0;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const utils_1 = require("../common/utils");
/* ########## MAIN ######### */
let poolMainInfos = null;
/* ########## FUNCTIONS ######### */
function getPoolInfos(config) {
    if (poolMainInfos === null) {
        poolMainInfos = {
            name: config.pool.name || os_1.default.hostname(),
            hostname: os_1.default.hostname(),
            ip: ((0, utils_1.getLocalIpAddresses)() || [])[0] || 'no-ip',
            poolOs: os_1.default.version(),
        };
    }
    const { name, hostname, ip, rigOs } = poolMainInfos;
    const uptime = os_1.default.uptime();
    const loadAvg = os_1.default.loadavg()[0];
    const memoryUsed = os_1.default.totalmem() - os_1.default.freemem();
    const memoryTotal = os_1.default.totalmem();
    const freeminingVersion = ''; // TODO
    const farmConfig = {}; // TODO
    const farmStatus = {}; // TODO
    const farmDevices = { cpus: [] }; // TODO
    return {
        pool: {
            name,
            hostname,
            ip,
            os: rigOs,
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
        devices: farmDevices,
        config: farmConfig,
        status: farmStatus,
        dataDate: null,
    };
}
exports.getPoolInfos = getPoolInfos;
