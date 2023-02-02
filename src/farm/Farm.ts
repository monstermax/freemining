
import os from 'os';
import colors from 'colors/safe';

import * as farmRigsServerWebsocket from './farmRigsServerWebsocket';
import { now, getOpt, getLocalIpAddresses } from '../common/utils';

import type *  as t from '../common/types';


/* ########## MAIN ######### */

const rigsInfos: t.MapString<t.RigInfos> = {};

/*
TODO: a transformer en :
{
    freeminingVersion: string,
    installableMiners: string[],
    installedMiners: string[], // + aliases ?
    runningMiners: string[], // + aliases ?
    monitorStatus; boolean,
    minerStats: t.RigInfos (renommer RigInfos en MinersStats)
}
*/


const websocketPassword = 'xxx'; // password to access farm websocket server

let farmMainInfos: any | null = null;


/* ########## FUNCTIONS ######### */

export function rigsServerStart(config: t.Config) {
    farmRigsServerWebsocket.start(config);
}


export function rigsServerStop() {
    farmRigsServerWebsocket.stop();
}

export function rigsServerStatus(): boolean {
    return farmRigsServerWebsocket.status();
}




export function farmAgentStart(config: t.Config): void {
    farmRigsServerWebsocket.start(config);
    console.log(`${now()} [INFO] [FARM] Rigs server started`);
}


export function farmAgentStop(): void {
    farmRigsServerWebsocket.stop();
    console.log(`${now()} [INFO] [FARM] Rigs server stopped`);
}

export function farmAgentStatus(): boolean {
    // TODO
    return false;
}



export function rigAuthRequest(config: t.Config, params: t.MapString<any>) {
    if (! farmRigsServerWebsocket.status()) return;

    const rig = params.user;
    const pass = params.pass || '';

    if (! rig) {
        return false;
    }

    //if (! pass) {
    //    return false;
    //}

    if (pass !== websocketPassword) {
        return false;
    }

    return true;
}


export function setRigStatus(rigName: string, rigInfos: any): void {
    if (! farmRigsServerWebsocket.status()) return;

    rigsInfos[rigName] = rigInfos;
}


export function getRigStatus(rigName: string): t.RigInfos | null {
    if (! farmRigsServerWebsocket.status()) return null;
    if (! (rigName in rigsInfos)) return null;

    return rigsInfos[rigName];
}



export function getFarmInfos(): t.FarmInfos {

    if (farmMainInfos === null) {
        farmMainInfos = {
            name: getOpt('--rig-name') || os.hostname(),
            hostname: os.hostname(),
            ip: (getLocalIpAddresses() || [])[0] || 'no-ip',
            farmOs: os.version(),
        }
    }

    const { name, hostname, ip, rigOs } = farmMainInfos;
    const uptime = os.uptime();
    const loadAvg = os.loadavg()[0];
    const memoryUsed = os.totalmem() - os.freemem();
    const memoryTotal = os.totalmem();

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
    }
}

