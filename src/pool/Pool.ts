
import os from 'os';
import colors from 'colors/safe';

import { now, getOpt, getLocalIpAddresses } from '../common/utils';

import type *  as t from '../common/types';


/* ########## MAIN ######### */

let poolMainInfos: any | null = null;


/* ########## FUNCTIONS ######### */

export function getPoolInfos(config: t.DaemonConfigAll): t.PoolInfos {

    if (poolMainInfos === null) {
        poolMainInfos = {
            name: config.pool.name || os.hostname(),
            hostname: os.hostname(),
            ip: (getLocalIpAddresses() || [])[0] || 'no-ip',
            poolOs: os.version(),
        }
    }

    const { name, hostname, ip, rigOs } = poolMainInfos;
    const uptime = os.uptime();
    const loadAvg = os.loadavg()[0];
    const memoryUsed = os.totalmem() - os.freemem();
    const memoryTotal = os.totalmem();

    const freeminingVersion = ''; // TODO
    const farmConfig = {}; // TODO
    const farmStatus = {}; // TODO
    const farmDevices = { cpus:[] }; // TODO

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
    }
}

