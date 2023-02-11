
import os from 'os';
//import colors from 'colors/safe';
import WebSocket from 'ws';

import { now, getLocalIpAddresses, buildRpcRequest } from '../common/utils';

import type *  as t from '../common/types';


/* ########## MAIN ######### */

const rigsConfigs: { [rigName: string]: t.DaemonConfigAll } = {};
const rigsInfos: { [rigName: string]: t.RigInfos } = {};
const rigsWs: { [rigName: string]: WebSocket } = {};

let farmMainInfos: any | null = null;
let active = false;


/* ########## FUNCTIONS ######### */


export function rigsServerStart(config: t.DaemonConfigAll) {
    if (active) return;

    active = true;

    // TODO

    //console.log(`${now()} [INFO] [FARM] Rigs server started`);
}


export function rigsServerStop() {
    //if (! active) return;

    active = false;
    // TODO

    //console.log(`${now()} [INFO] [FARM] Rigs server stopped`);
}


export function rigsServerGetStatus(): boolean {
    return active;
}







export function rigAuthRequest(config: t.DaemonConfigAll, params: t.MapString<any>) {
    if (! rigsServerGetStatus()) return;

    const rig = params.user;
    const pass = params.pass || '';

    if (! rig) {
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


export function setRigStatus(rigName: string, rigInfos: t.RigInfos): void {
    if (! rigsServerGetStatus()) return;

    rigsInfos[rigName] = rigInfos;
}


export function getRigStatus(rigName: string): t.RigInfos | null {
    if (! rigsServerGetStatus()) return null;
    if (! (rigName in rigsInfos)) return null;

    return rigsInfos[rigName];
}


export function setRigConfig(rigName: string, rigConfig: t.DaemonConfigAll): void {
    if (! rigsServerGetStatus()) return;

    rigsConfigs[rigName] = rigConfig;
}


export function getRigConfig(rigName: string): t.DaemonConfigAll | null {
    if (! rigsServerGetStatus()) return null;
    if (! (rigName in rigsConfigs)) return null;

    return rigsConfigs[rigName];
}


export function getFarmInfos(config: t.DaemonConfigAll): t.FarmInfos {

    if (farmMainInfos === null) {
        farmMainInfos = {
            name: config.farm.name || os.hostname(),
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


export function getRigWs(rigName: string): WebSocket | undefined {
    return rigsWs[rigName];
}


export function setRigWs(rigName: string, rigWs: WebSocket | null): void {
    if (rigWs === null) {
        delete rigsWs[rigName];

    } else {
        rigsWs[rigName] = rigWs;
    }
}




function rpcSendRequest(ws: WebSocket, id: number, method: string, params: any) {
    const req: t.RpcRequest = buildRpcRequest(id, method, params);
    const reqStr = JSON.stringify(req);
    //console.debug(`${now()} [DEBUG] [FARM] sending request: ${reqStr}`);
    ws.send(reqStr);
}


export function farmMinerInstallStart(rigName: string, params: t.minerInstallStartParams) {
    const rigWs = rigsWs[rigName];
    if (!rigWs) return; // todo return error
    const method = 'farmMinerInstallStart';
    rpcSendRequest(rigWs, 1, method, params);
}

export function farmMinerInstallStop(rigName: string, params: t.minerInstallStopParams) {
    const rigWs = getRigWs(rigName);
    if (!rigWs) return; // todo return error
    const method = 'farmMinerInstallStop';
    rpcSendRequest(rigWs, 1, method, params);
}


export function farmMinerRunStart(rigName: string, params: t.minerRunStartParams) {
    const rigWs = getRigWs(rigName);
    if (!rigWs) return; // todo return error
    const method = 'farmMinerRunStart';
    rpcSendRequest(rigWs, 1, method, params);
}


export function farmMinerRunStop(rigName: string, params: t.minerRunStopParams, forceKill: boolean=false) {
    const rigWs = getRigWs(rigName);
    if (!rigWs) return; // todo return error
    const method = 'farmMinerRunStop';
    rpcSendRequest(rigWs, 1, method, params);
}


export function farmMinerRunGetStatus(rigName: string, params: t.minerRunStatusParams) {
    const rigWs = getRigWs(rigName);
    if (!rigWs) return; // todo return error
    const method = 'farmMinerRunGetStatus';
    rpcSendRequest(rigWs, 1, method, params);
}

export function farmMinerRunLog(rigName: string, params: t.minerRunLogParams) {
    const rigWs = getRigWs(rigName);
    if (!rigWs) return; // todo return error
    const method = 'farmMinerRunLog';
    rpcSendRequest(rigWs, 1, method, params);
}
