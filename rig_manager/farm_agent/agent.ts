
import WebSocket from 'ws';
import os from 'os';
const { exec } = require('child_process');


const wsServerHost = '82.64.213.186';
const wsServerPort = 4200;
const serverConnTimeout = 10_000;

let connectionCount = 0;


function websocketConnect() {
    let sendStatusTimeout: any = null;
    let newConnectionTimeout: any = null;

    const connectionId = connectionCount++;

    console.log(`${now()} [INFO] connecting to websocket server... [conn ${connectionId}]`);

    let ws: WebSocket;
    try {
        ws = new WebSocket(`ws://${wsServerHost}:${wsServerPort}/`);

    } catch (err: any) {
        console.log(`${now()} [ERROR] cannot connect to websocket server [conn ${connectionId}]`);
        if (newConnectionTimeout === null) {
            newConnectionTimeout = setTimeout(() => websocketConnect(), 10_000);
        }
        return;
    }


    ws.on('error', function (err: any) {
        console.log(`${now()} [ERROR] connection error with websocket server => ${err.message} [conn ${connectionId}]`);
        ws.terminate();
    });


    ws.on('open', async function open() {
        // Prepare connection heartbeat
        heartbeat.call(this);

        const rigName = os.hostname();

        // Send auth
        ws.send(`auth ${rigName} xxx`);

        // Send rig status
        const rigStatus = await getRigStatus();
        if (rigStatus) {
            console.log(`${now()} [INFO] sending rigStatus to server (open) [conn ${connectionId}]`)
            ws.send( `rigStatus ${JSON.stringify(rigStatus)}`);

        } else {
            console.log(`${now()} [WARNING] cannot send rigStatus to server (open) [conn ${connectionId}]`)
        }

        // send rig status every 10 seconds
        if (sendStatusTimeout === null) {
            sendStatusTimeout = setTimeout(hello, 10_000);
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
        console.log(`${now()} [INFO] received: ${message} [conn ${connectionId}]`);

        const args = message.split(' ');

        if (args[0] === 'service') {

            if (args[1] === 'start') {
                args.shift();
                args.shift();
                const serviceName = args.shift();

                if (serviceName && args.length > 0) {
                    const paramsJson = args.join('');

                    let params: any;
                    try {
                        params = JSON.parse(paramsJson);

                    } catch (err: any) {
                        console.error(`${now()} [ERROR] cannot start service : ${err.message}`);
                        return;
                    }

                    const cmd = `${__dirname}/../service.sh start ${serviceName} ${params.poolUrl} ${params.poolAccount} ${params.workerName} ${params.algo}`;

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
                    const cmd = `${__dirname}/../service.sh stop ${serviceName}`;

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
        console.log(`${now()} [INFO] disconnected from server [conn ${connectionId}]`);

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
            console.log(`${now()} [INFO] terminate connection with the server [conn ${connectionId}]`);
            this.terminate();

            if (newConnectionTimeout === null) {
                newConnectionTimeout = setTimeout(() => websocketConnect(), 5_000);
            }

        }, serverConnTimeout + 1000);

    }


    async function hello() {
        sendStatusTimeout = null;

        const rigStatus = await getRigStatus();
        if (rigStatus) {

            if (ws.readyState === WebSocket.OPEN) {
                console.log(`${now()} [INFO] sending rigStatus to server (hello) [conn ${connectionId}]`);
                ws.send( `rigStatus ${JSON.stringify(rigStatus)}`);

                var debugSentData = JSON.stringify(rigStatus);
                var debugme = 1;

            } else {
                console.log(`${now()} [WARNING] cannot send rigStatus to server (hello. ws closed) [conn ${connectionId}]`);
                ws.close();
                return;
            }

        } else {
            console.log(`${now()} [WARNING] cannot send rigStatus to server (hello. no status available) [conn ${connectionId}]`)
            ws.close();
            return;
        }

        sendStatusTimeout = setTimeout(hello, 10_000);
    }


    return ws;
}



async function getRigStatus(): Promise<any> {
    const cmd = __dirname + '/../monitor/rig_monitor_json.sh';

    const statusJson = await cmdExec(cmd);

    if (statusJson) {
        try {
            const rigStatus = JSON.parse(statusJson);
            return rigStatus;

        } catch (err: any) {
            console.error(`${now()} [ERROR] cannot read rig status`);
        }
    }

    return null;
}



async function cmdExec(cmd: string) {
    let ret: any = null;

    await new Promise((resolve, reject) => {
        exec(cmd, (error: any, stdout: string, stderr: string) => {
            if (error) {
                console.error(`${now()} [ERROR] Error while running exec command : ${error.message.trim()}`);
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
        console.error(`${now()} [ERROR] catched while running exec command => ${err.message}`)
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



function main() {
    websocketConnect();
}


main();

