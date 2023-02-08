
import os from 'os';
import WebSocket from 'ws';
import colors from 'colors/safe';

import { now, buildRpcRequest, buildRpcResponse, buildRpcError } from '../common/utils';
import * as Rig from './Rig';
import * as Daemon from '../core/Daemon';

import type * as t from '../common/types';



let websocket: WebSocket | null;
let wsServerHost = '';
let wsServerPort = 0;

const serverConnTimeout = 10_000; // si pas de réponse d'un client au bout de x millisecondes on le déconnecte
const serverNewConnDelay = 10_000; // attend x millisecondes avant de se reconnecter (en cas de déconnexion)
const sendStatusInterval = 10_000; // envoie le (dernier) statut du rig au farmServer toutes les x millisecondes
let connectionCount = 0;
let requestsCount = 0;
let sendStatusTimeout: any = null;
//let checkStatusTimeout: any = null;


let active = false;


export function start(config: t.DaemonConfigAll) {
    if (websocket) return;
    if (active) return;

    active = true;

    websocketConnect(config);
    //console.log(`${now()} [INFO] [RIG] Farm agent started`);
}


export function stop() {
    //if (! websocket) return;
    //if (! active) return;

    active = false;

    if (sendStatusTimeout) {
        clearTimeout(sendStatusTimeout);
        sendStatusTimeout = null;
    }

    if (websocket) {
        websocket.close();
        websocket = null;
    }

    //console.log(`${now()} [INFO] [RIG] Farm agent stopped`);
}


export function status() {
    return active;
}



export function sendRigStatusToFarm(config: t.DaemonConfigAll) {
    if (websocket && websocket.readyState === websocket.OPEN) {
        sendRigStatusAuto(websocket, config);
    }
}


async function sendRigStatusAuto(ws: WebSocket, config: t.DaemonConfigAll) {
    if (sendStatusTimeout) {
        clearTimeout(sendStatusTimeout);
        sendStatusTimeout = null;
    }
    const rigInfos = await Rig.getRigInfos(config);

    try {
        if (! ws || ws.readyState !== ws.OPEN) throw new Error(`Websocket not opened`);

        sendRigStatus(ws, rigInfos);

    } catch (err: any) {
        console.warn(`${now()} [${colors.yellow('WARNING')}] [RIG] cannot send status to farm : ${err.message} [connId: ${(ws as any)._connId}]`);
    }

    //sendStatusTimeout = setTimeout(sendRigStatusAuto, sendStatusInterval, ws, config);
}


function sendRigStatus(ws: WebSocket, rigInfos: t.RigInfos): void {
    console.log(`${now()} [${colors.blue('INFO')}] [RIG] Sending rigInfos to farm agent... [connId: ${(websocket as any)._connId}]`);
    //ws.send( `rigStatus ${JSON.stringify(rigInfos)}`);

    //const req: any = {
    //    method: "farmRigUpdateStatus",
    //    params: rigInfos,
    //};

    let reqId = ++requestsCount;
    const req = buildRpcRequest(reqId, "farmRigUpdateStatus", rigInfos);

    ws.send(JSON.stringify(req));
}


// WEBSOCKET
function websocketConnect(config: t.DaemonConfigAll) {
    let newConnectionTimeout: any = null;
    const rigName = config.rig.name || os.hostname();
    const websocketPassword = config.rig.farmAgent?.pass || '';

    wsServerHost = config.rig.farmAgent?.host || '';
    wsServerPort = Number(config.rig.farmAgent?.port) || 0;

    if (! wsServerHost || ! wsServerPort) {
        return;
    }


    if (! active) return;

    if (websocket) {
        throw new Error( `websocket already up` );
    }

    const connectionId = ++connectionCount;
    requestsCount = 0;

    console.log(`${now()} [${colors.blue('INFO')}] [RIG] connecting to websocket server ${wsServerHost}:${wsServerPort} ... [connId ${connectionId}]`);

    try {
        websocket = new WebSocket(`ws://${wsServerHost}:${wsServerPort}/`);

    } catch (err: any) {
        console.warn(`${now()} [${colors.red('ERROR')}] [RIG] cannot connect to websocket server [conn ${connectionId}]`);
        if (newConnectionTimeout === null && active) {
            websocket = null;
            newConnectionTimeout = setTimeout(websocketConnect, serverNewConnDelay, config);
        }
        return;
    }

    (websocket as any)._connId = connectionId;


    websocket.on('error', function (err: any) {
        console.warn(`${now()} [${colors.red('ERROR')}] [RIG] connection error with websocket server => ${err.message} [connId ${connectionId}]`);
        this.terminate();
    });


    websocket.on('open', async function open() {

        // Send auth
        let reqId = ++requestsCount;
        let req = buildRpcRequest(reqId, "farmAuth", {
            user: rigName,
            pass: websocketPassword,
        });
        console.log(`${now()} [${colors.blue('INFO')}] [RIG] sending auth to server (open) [connId ${connectionId}]`)
        this.send( JSON.stringify(req) );


        // Send rig config
        reqId = ++requestsCount;
        req = buildRpcRequest(reqId, "farmRigUpdateConfig", config);
        console.log(`${now()} [${colors.blue('INFO')}] [RIG] sending rigConfig to server (open) [conn ${connectionId}]`)
        this.send( JSON.stringify(req) );


        // Send rig status
        const rigInfos = await Rig.getRigInfos(config);
        if (! rigInfos) {
            console.warn(`${now()} [${colors.yellow('WARNING')}] [RIG] cannot send rigInfos to server (open) [connId ${connectionId}]`)
            this.close();
            websocket = null;
            return;
        }
        sendRigStatus(this, rigInfos);


        // send rig status every 10 seconds
        if (sendStatusTimeout === null) {
            sendStatusTimeout = setTimeout(sendRigStatusAuto, sendStatusInterval, this, config);
        }

        // Prepare connection heartbeat
        heartbeat.call(this);
    });


    // Handle connections heartbeat
    websocket.on('ping', function ping() {
        // received a ping from the farm
        heartbeat.call(this);
    });


    // Handle incoming message from farm
    websocket.on('message', async function message(data: Buffer) {
        const messageJson = data.toString();
        //console.log(`${now()} [${colors.blue('INFO')}] [RIG] received: ${message} [connId ${connectionId}]`);

        let message: t.RpcResponse | t.RpcRequest;
        try {
            message = JSON.parse(messageJson);

        } catch (err: any) {
            console.warn(`${now()} [${colors.yellow('WARNING')}] [RIG] received invalid json from farm : \n${messageJson}`);
            return;
        }



        if ('error' in message) {
            console.log(`${now()} [${colors.blue('INFO')}] [RIG] received error from farm : \n${messageJson}`);
            const err: t.RpcError = JSON.parse(messageJson);

        } else if ('result' in message) {
            //console.log(`${now()} [${colors.blue('INFO')}] [RIG] received response from farm : \n${messageJson}`);
            //const res: t.RpcResponse = JSON.parse(messageJson);

        } else if ('method' in message && 'params' in message) {
            //console.log(`${now()} [${colors.blue('INFO')}] [RIG] received request from farm : \n${messageJson}`);
            //console.log(`${now()} [${colors.blue('INFO')}] [RIG] received request from farm (${messageJson.length} chars.)`);
            const req: t.RpcRequest = JSON.parse(messageJson);

            console.log(`${now()} [${colors.blue('INFO')}] [RIG] received request from farm (${req.method})`);

            switch (req.method) {

                case 'farmMinerInstallStart':
                    {
                        const ok = Rig.minerInstallStart(config, message.params);
                        rpcSendResponse(this, req.id, 'OK');
                    }
                    break;

                case 'farmMinerInstallStop':
                    {
                        const ok = Rig.minerInstallStop(config, message.params);
                        rpcSendResponse(this, req.id, 'OK');
                    }
                    break;

                case 'farmMinerRunStart':
                    {
                        const ok = Rig.minerRunStart(config, message.params);
                        rpcSendResponse(this, req.id, 'OK');
                    }
                    break;

                case 'farmMinerRunStop':
                    {
                        const ok = Rig.minerRunStop(config, message.params);
                        rpcSendResponse(this, req.id, 'OK');
                    }
                    break;

                case 'farmMinerRunStatus':
                    {
                        const status = Rig.minerRunGetStatus(config, message.params);
                        rpcSendResponse(this, req.id, status);
                    }
                    break;

                case 'farmMinerRunLog':
                    {
                        const log = Rig.minerRunGetLog(config, message.params);
                        rpcSendResponse(this, req.id, log);
                    }
                    break;

                default:
                    rpcSendError(this, req.id, { code: -32601, message:  `the method ${req.method} does not exist/is not available on RIG` });
                    break;

            }

        } else {
            console.warn(`${now()} [${colors.yellow('WARNING')}] [RIG] received invalid message from farm : \n${messageJson}`);
            //ws.close();
        }

    });


    // Handle connection close
    websocket.on('close', function close() {
        console.log(`${now()} [${colors.blue('INFO')}] [RIG] disconnected from server [connId ${connectionId}]`);

        if (sendStatusTimeout) {
            clearTimeout(sendStatusTimeout);
            sendStatusTimeout = null;
        }

        //process.exit();

        // handle reconnection
        if (newConnectionTimeout === null && active) {
            websocket = null;
            newConnectionTimeout = setTimeout(websocketConnect, 10_000, config);
        }
    });


    function heartbeat(this: WebSocket) {
        clearTimeout((this as any).pingTimeout);

        // Use `WebSocket#terminate()`, which immediately destroys the connection,
        // instead of `WebSocket#close()`, which waits for the close timer.
        // Delay should be equal to the interval at which your server
        // sends out pings plus a conservative assumption of the latency.
        (this as any).pingTimeout = setTimeout(() => {
            if (! active) return;
            if (! websocket || websocket !== this) return;

            console.log(`${now()} [${colors.blue('INFO')}] [RIG] terminate connection with the server [conn ${connectionId}]`);
            this.terminate();
            websocket = null;

            if (newConnectionTimeout === null && active) {
                websocket = null;
                newConnectionTimeout = setTimeout(websocketConnect, 5_000, config);
            }

        }, serverConnTimeout + 1000);

    }

    return websocket;
}



function rpcSendResponse(ws: WebSocket, id: number, result: any) {
    const res: t.RpcResponse = buildRpcResponse(id, result);
    const resStr = JSON.stringify(res);
    //console.debug(`${now()} [DEBUG] [CLI] sending response: ${resStr}`);
    ws.send(resStr);
}


function rpcSendError(ws: WebSocket, id: number, result: any) {
    const err: t.RpcError = buildRpcError(id, result);
    const errStr = JSON.stringify(err);
    //console.debug(`${now()} [DEBUG] [CLI] sending error: ${errStr}`);
    ws.send(errStr);
}


