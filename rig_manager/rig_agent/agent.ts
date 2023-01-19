
import WebSocket from 'ws';
import os from 'os';
import colors from 'colors/safe';
const { exec } = require('child_process');
const config: any = require('../rig_manager.json');


type Rig = {
    hostname: string,
    ip: string,
    os: string,
    uptime: number,
    loadAvg: number,
    memory: {
        used: number,
        total: number,
    },
    devices: {
        cpu: {
            name: string,
            threads: number,
        },
        gpu: [
            {
                id: number,
                name: string,
                driver: string,
            }
        ]
    },
    dateRig?: number,
    dataAge?: number,
}

type Service = {
    worker: {
        name: string,
        miner: string,
        pid: number,
        algo: string,
        hashRate: number,
        uptime: number,
        date: string,
    }
    pool: {
        url: string,
        account: string,
    },
    cpu: {[key:string]: any}[],
    gpu: {[key:string]: any}[],
}

type RigStatus = {
    rig: Rig,
    services: { [key: string]: Service },
    dateFarm?: number,
    dataAge?: number,
};


const wsServerHost = config.farmServer?.host || null;
const wsServerPort = config.farmServer?.port || 4200;

const serverConnTimeout = 10_000; // si pas de réponse d'un client au bout de x millisecondes on le déconnecte
const serverNewConnDelay = 10_000; // attend x millisecondes avant de se reconnecter (en cas de déconnexion)
const checkStatusInterval = 10_000; // verifie le statut du rig toutes les x millisecondes
const sendStatusInterval = 10_000; // envoie le (dernier) statut du rig au farmServer toutes les x millisecondes

let checkStatusTimeout: any = null;
let connectionCount = 0;

const toolsDir = `${__dirname}/../tools`;
const cmdService = `${toolsDir}/miner.sh`;
const cmdRigMonitorJson = `${toolsDir}/rig_monitor_json.sh`;

let rigStatus: RigStatus | null = null;


function websocketConnect() {
    let sendStatusTimeout: any = null;
    let newConnectionTimeout: any = null;

    const connectionId = connectionCount++;

    console.log(`${now()} [${colors.blue('INFO')}] connecting to websocket server... [conn ${connectionId}]`);

    let ws: WebSocket;
    try {
        ws = new WebSocket(`ws://${wsServerHost}:${wsServerPort}/`);

    } catch (err: any) {
        console.log(`${now()} [${colors.red('ERROR')}] cannot connect to websocket server [conn ${connectionId}]`);
        if (newConnectionTimeout === null) {
            newConnectionTimeout = setTimeout(() => websocketConnect(), serverNewConnDelay);
        }
        return;
    }


    ws.on('error', function (err: any) {
        console.log(`${now()} [${colors.red('ERROR')}] connection error with websocket server => ${err.message} [conn ${connectionId}]`);
        ws.terminate();
    });


    ws.on('open', async function open() {
        // Prepare connection heartbeat
        heartbeat.call(this);

        const rigName = os.hostname();

        // Send auth
        ws.send(`auth ${rigName} xxx`);

        // Send rig status
        if (rigStatus) {
            console.log(`${now()} [${colors.blue('INFO')}] sending rigStatus to server (open) [conn ${connectionId}]`)
            ws.send( `rigStatus ${JSON.stringify(rigStatus)}`);

        } else {
            console.log(`${now()} [${colors.yellow('WARNING')}] cannot send rigStatus to server (open) [conn ${connectionId}]`)
        }

        // send rig status every 10 seconds
        if (sendStatusTimeout === null) {
            sendStatusTimeout = setTimeout(hello, sendStatusInterval);
        }
    });


    // Handle connections heartbeat
    ws.on('ping', function ping() {
        // received a ping from the server
        heartbeat.call(this);
    });


    // Handle incoming message from server
    ws.on('message', async function message(data: Buffer) {
        const message = data.toString();
        console.log(`${now()} [${colors.blue('INFO')}] received: ${message} [conn ${connectionId}]`);

        const args = message.split(' ');

        if (args[0] === 'service') {

            if (args[1] === 'start') {
                args.shift();
                args.shift();
                const serviceName = args.shift();

                if (serviceName && args.length > 0) {
                    const paramsJson = args.join(' ');

                    let params: any;
                    try {
                        params = JSON.parse(paramsJson);

                    } catch (err: any) {
                        console.error(`${now()} [${colors.red('ERROR')}] cannot start service : ${err.message}`);
                        return;
                    }

                    const cmd = `${cmdService} start ${serviceName} -algo "${params.algo}" -url "${params.poolUrl}" -user "${params.poolAccount}" ${params.optionalParams}`;

                    console.log(`${now()} [DEBUG] executing command: ${cmd}`)

                    const ret = await cmdExec(cmd);

                    console.log(`${now()} [DEBUG] command result: ${ret}`)

                    var debugme = 1;

                }

            }

            if (args[1] === 'stop') {
                args.shift();
                args.shift();
                const serviceName = args.shift();

                if (serviceName) {
                    const cmd = `${cmdService} stop ${serviceName}`;

                    console.log(`${now()} [DEBUG] executing command: ${cmd}`)

                    const ret = await cmdExec(cmd);

                    console.log(`${now()} [DEBUG] command result: ${ret}`)

                    var debugme = 1;

                }

            }

        }
    });


    // Handle connection close
    ws.on('close', function close() {
        console.log(`${now()} [${colors.blue('INFO')}] disconnected from server [conn ${connectionId}]`);

        if (sendStatusTimeout) {
            clearTimeout(sendStatusTimeout);
            sendStatusTimeout = null;
        }

        //process.exit();

        // handle reconnection
        if (newConnectionTimeout === null) {
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
            console.log(`${now()} [${colors.blue('INFO')}] terminate connection with the server [conn ${connectionId}]`);
            this.terminate();

            if (newConnectionTimeout === null) {
                newConnectionTimeout = setTimeout(() => websocketConnect(), 5_000);
            }

        }, serverConnTimeout + 1000);

    }


    async function hello() {
        sendStatusTimeout = null;

        if (rigStatus) {
            if (ws.readyState === WebSocket.OPEN) {
                console.log(`${now()} [${colors.blue('INFO')}] sending rigStatus to server (hello) [conn ${connectionId}]`);
                ws.send( `rigStatus ${JSON.stringify(rigStatus)}`);

                var debugSentData = JSON.stringify(rigStatus);
                var debugme = 1;

            } else {
                console.log(`${now()} [${colors.yellow('WARNING')}] cannot send rigStatus to server (hello. ws closed) [conn ${connectionId}]`);
                ws.close();
                return;
            }

        } else {
            console.log(`${now()} [${colors.yellow('WARNING')}] cannot send rigStatus to server (hello. no status available) [conn ${connectionId}]`)
            ws.close();
            return;
        }

        sendStatusTimeout = setTimeout(hello, 10_000);
    }


    return ws;
}



async function getRigStatus(): Promise<RigStatus | null> {
    const cmd = cmdRigMonitorJson;

    const statusJson = await cmdExec(cmd);

    if (statusJson) {
        try {
            const _rigStatus = JSON.parse(statusJson);
            return _rigStatus;

        } catch (err: any) {
            console.error(`${now()} [${colors.red('ERROR')}] cannot read rig status (invalid shell response)`);
            console.debug(statusJson);
        }

    } else {
        console.log(`${now()} [${colors.red('WAWRNING')}] cannot read rig status (no response from shell)`);
    }

    return null;
}



async function cmdExec(cmd: string) {
    let ret: any = null;

    await new Promise((resolve, reject) => {
        exec(cmd, (error: any, stdout: string, stderr: string) => {
            if (error) {
                //console.error(`${now()} [${colors.red('ERROR')}] Error while running exec command : ${error.message.trim()}`);
                reject( error );
                return;
            }

            if (stderr) {
                reject( { message: stderr, code: 500 } );
                return;
            }
            resolve(stdout);
        });

    }).then((result: any) => {
        ret = result;

    }).catch((err: any) => {
        console.error(`${now()} [${colors.red('ERROR')}] catched while running exec command => ${colors.red(err.message)}`)
    });

    return ret;
}


function now(): string {
    const options: {hour:string|any, minute:string|any, second:string|any} = {
        /* year: "numeric", month: "2-digit", day: "2-digit", */
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    }
    return new Date().toLocaleTimeString("fr-FR", options);
}


async function checkStatus() {
    console.log(`${now()} [${colors.blue('INFO')}] refreshing rigStatus`)
    checkStatusTimeout = null;
    rigStatus = await getRigStatus();

    // poll services every x seconds
    checkStatusTimeout = setTimeout(checkStatus, checkStatusInterval);
}


async function main() {
    await checkStatus();

    if (wsServerHost) {
        // connect to websocket server
        websocketConnect();
    }

    if (false) {
        // run local webserver
        // TODO
    }
}


main();

