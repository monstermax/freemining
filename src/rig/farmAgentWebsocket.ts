
import os from 'os';
import WebSocket from 'ws';
import colors from 'colors/safe';

import { now, getOpt, getLocalIpAddresses, getDirFiles, tailFile, stringTemplate } from '../common/utils';
import * as Rig from './Rig';
import * as Daemon from '../core/Daemon';

import type * as t from '../common/types';



let websocket: WebSocket | null;
const wsServerHost = '127.0.0.1.'; // TODO: lire config
const wsServerPort = 1234; // TODO: lire config

const serverConnTimeout = 10_000; // si pas de réponse d'un client au bout de x millisecondes on le déconnecte
const serverNewConnDelay = 10_000; // attend x millisecondes avant de se reconnecter (en cas de déconnexion)
const sendStatusInterval = 10_000; // envoie le (dernier) statut du rig au farmServer toutes les x millisecondes
let connectionCount = 0;
let sendStatusTimeout: any = null;
//let checkStatusTimeout: any = null;


const rigName = 'test-ws' || os.hostname();
const websocketPassword = 'xxx'; // password to access farm websocket server
let active = false;


export function start(config: t.Config) {
    if (websocket) return;
    if (active) return;

    active = true;

    websocketConnect();
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


function sendStatusAuto(ws: WebSocket) {
    if (sendStatusTimeout) {
        clearTimeout(sendStatusTimeout);
        sendStatusTimeout = null;
    }
    const rigInfos = Rig.getRigInfos();
    sendStatus(ws, rigInfos);
    sendStatusTimeout = setTimeout(sendStatusAuto, sendStatusInterval, ws);
}


function sendStatus(ws: WebSocket, rigInfos: t.Rig): void {
    console.log(`${now()} [${colors.blue('INFO')}] sending rigInfos to server`);
    //ws.send( `rigStatus ${JSON.stringify(rigInfos)}`);

    const req: any = {
        method: "farmRigStatus",
        params: rigInfos,
    };
    ws.send(JSON.stringify(req));
}


// WEBSOCKET
function websocketConnect() {
    let newConnectionTimeout: any = null;

    if (! active) return;

    if (websocket) {
        throw new Error( `websocket already up` );
    }

    const connectionId = connectionCount++;

    console.log(`${now()} [${colors.blue('INFO')}] connecting to websocket server ${wsServerHost}:${wsServerPort} ... [conn ${connectionId}]`);

    try {
        websocket = new WebSocket(`ws://${wsServerHost}:${wsServerPort}/`);

    } catch (err: any) {
        console.log(`${now()} [${colors.red('ERROR')}] cannot connect to websocket server [conn ${connectionId}]`);
        if (newConnectionTimeout === null && active) {
            newConnectionTimeout = setTimeout(() => websocketConnect(), serverNewConnDelay);
        }
        return;
    }


    websocket.on('error', function (err: any) {
        console.log(`${now()} [${colors.red('ERROR')}] connection error with websocket server => ${err.message} [conn ${connectionId}]`);
        this.terminate();
    });


    websocket.on('open', async function open() {
        const rigInfos = Rig.getRigInfos();

        // Send auth
        this.send(`{ "method": "farmAuth", "params": {\"rig\": \"${rigName}\", \"pass\": \"${websocketPassword}\"} }`);

        // Send rig config
        //console.log(`${now()} [${colors.blue('INFO')}] sending rigConfig to server (open) [conn ${connectionId}]`)
        //this.send( `rigConfig ${JSON.stringify(configRig)}`);

        if (! rigInfos) {
            console.log(`${now()} [${colors.yellow('WARNING')}] cannot send rigInfos to server (open) [conn ${connectionId}]`)
            this.close();
            websocket = null;
            return;
        }

        // Send rig status
        sendStatus(this, rigInfos);

        // TODO: envoyer la liste des miners installés ( process.env.INSTALLED_MINERS )

        // send rig status every 10 seconds
        if (sendStatusTimeout === null) {
            sendStatusTimeout = setTimeout(sendStatusAuto, sendStatusInterval, this);
        }

        // Prepare connection heartbeat
        heartbeat.call(this);
    });


    // Handle connections heartbeat
    websocket.on('ping', function ping() {
        // received a ping from the server
        heartbeat.call(this);
    });


    // Handle incoming message from server
    websocket.on('message', async function message(data: Buffer) {
        const message = data.toString();
        console.log(`${now()} [${colors.blue('INFO')}] received: ${message} [conn ${connectionId}]`);

        const args = message.split(' ');

        if (args[0] === 'miner-install') {
            // TODO

        } else if (args[0] === 'miner-uninstall') {
            // TODO

        //} else if (args[0] === 'get-installed-miners') {
        //    // TODO

        } else if (args[0] === 'service') {

            if (args[1] === 'start') {
                args.shift();
                args.shift();
                const minerName = args.shift();
                //const minerAlias = args.shift() || '';
                const minerAlias = ''; // TODO: get from params

                if (minerName && args.length > 0) {
                    const paramsJson = args.join(' ');

                    let params: any;
                    try {
                        params = JSON.parse(paramsJson);

                    } catch (err: any) {
                        console.error(`${now()} [${colors.red('ERROR')}] cannot start service : ${err.message}`);
                        return;
                    }

                    params.miner = minerName;
                    params.alias = minerAlias;

                    const config = Daemon.getConfig();
                    const ok = await Rig.minerRunStart(config, params);
                    var debugme = 1;

                } else {
                    // error
                }

            }

            if (args[1] === 'stop') {
                args.shift();
                args.shift();
                const minerName = args.shift();
                //const minerAlias = args.shift() || '';
                const minerAlias = ''; // TODO: get from params

                if (minerName) {
                    const config = Daemon.getConfig();
                    const params = {
                        miner: minerName,
                        alias: minerAlias,
                    };
                    const ok = await Rig.minerRunStop(config, params);
                    var debugme = 1;

                } else {
                    // error
                }

            }

        }
    });


    // Handle connection close
    websocket.on('close', function close() {
        console.log(`${now()} [${colors.blue('INFO')}] disconnected from server [conn ${connectionId}]`);

        if (sendStatusTimeout) {
            clearTimeout(sendStatusTimeout);
            sendStatusTimeout = null;
        }

        //process.exit();

        // handle reconnection
        if (newConnectionTimeout === null && active) {
            newConnectionTimeout = setTimeout(() => websocketConnect(), 10_000);
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

            console.log(`${now()} [${colors.blue('INFO')}] terminate connection with the server [conn ${connectionId}]`);
            this.terminate();
            websocket = null;

            if (newConnectionTimeout === null && active) {
                newConnectionTimeout = setTimeout(() => websocketConnect(), 5_000);
            }

        }, serverConnTimeout + 1000);

    }

    return websocket;
}

