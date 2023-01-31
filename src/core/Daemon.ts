
import express from 'express';
import colors from 'colors/safe';
import path from 'path';
import os from 'os';
import * as http from 'http';
import * as WebSocket from 'ws';
const ejs = require('ejs');

import { loadConfig } from './Config';
import { now, sleep, hasOpt, buildRpcRequest, buildRpcResponse, buildRpcError } from '../common/utils';
import { getSystemInfos } from '../common/sysinfos';

import { registerCoreRoutes } from './http/routesCore';
import { registerRigRoutes }  from './http/routesRig';
import { registerFarmRoutes } from './http/routesFarm';
import { registerNodeRoutes } from './http/routesNode';
import { registerPoolRoutes } from './http/routesPool';
import * as Rig from '../rig/Rig';
import * as Node from '../node/Node';

import type *  as t from '../common/types';


/* ########## USAGE #########

# Start daemon
./frmd


*/
/* ########## MAIN ######### */


let config: t.Config;
let quitRunning = false;
const SEP = path.sep;
let sysInfos: any = null;


/* ########## FUNCTIONS ######### */

function usage(exitCode: number | null=null) {
    const _usage = 
`======================
| ⛏️   FreeMining  ⛏️  | => frmd
======================

Usage:

frmd <params>
     --help                                  # display this this message
     --user-dir                              # default %HOME%/.freemining-beta OR %HOME%/AppData/Local/freemining-beta
     --listen-address                        # default 127.0.0.1
     --listen-port                           # default 1234
     --wss-conn-timeout                      # default 10 seconds

     -r | --rig-monitor-start                # start rig monitor at freemining start
     -n | --node-monitor-start               # start node monitor at freemining start

     --rig-monitor-poll-delay                # delay between 2 checks of the rig status
     --node-monitor-poll-delay               # delay between 2 checks of the node status

`;

    console.log(_usage);

    if (exitCode !== null) {
        process.exit(exitCode);
    }
}


export function run(args: (t.DaemonParams & t.CommonParams & string)[] = []): void {
    if (hasOpt('--help', args)) {
        usage(0);
    }

    catchSignals();

    config = loadConfig(args);

    console.log('daemon start');

    const app = express(); // express app
    const server = http.createServer(app); // express server
    const wss = new WebSocket.Server({ server }); // websocket server

    app.engine('html', ejs.renderFile);
    app.set('view engine', 'ejs');
    app.set('views', config.httpTemplatesDir);

    registerHttpRoutes(config, app);

    registerWssRoutes(config, wss);

    server.listen(config.listenPort, config.listenAddress, () => {
        console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] Server started on ${config.listenAddress}:${config.listenPort}`);
    });

    getSysInfos();
}



function registerHttpRoutes(config: t.Config, app: express.Express): void {
    // Log http request
    app.use(function (req: express.Request, res: express.Response, next: Function) {
        console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] ${req.method.toLocaleUpperCase()} ${req.url}`);
        next();
    });

    // Parse Body (POST only)
    app.use(express.urlencoded({ extended: true }));

    // Static files
    console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] Using static folder ${config.httpStaticDir}`);
    app.use(express.static(config.httpStaticDir));

    console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] Using templates folder ${config.httpTemplatesDir}`);
    registerCoreRoutes(app);
    registerRigRoutes(app, '/rig');
    registerFarmRoutes(app, '/farm');
    registerNodeRoutes(app, '/node');
    registerPoolRoutes(app, '/pool');

    // Log Error 404
    app.use(function (req: express.Request, res: express.Response, next: Function) {
        console.warn(`${now()} [${colors.yellow('WARNING')}] [DAEMON] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);
        next();
    });
}



function registerWssRoutes(config: t.Config, wss: WebSocket.Server): void {

    wss.on('connection', function connection(ws: WebSocket, req: express.Request) {

        // Prepare connection heartbeat
        (ws as any).pongOk = true;

        // Prepare connection auth
        (ws as any).auth = null;


        // Get client informations
        let clientIP = getWsClientIp(req);

        /*
        if (allowedIps.length > 0 && ! allowedIps.includes(clientIP)) {
            //ws.send('ERROR: not authorized');
            console.warn(`${now()} [${colors.yellow('WARNING')}] [DAEMON] rejecting client ${clientIP} for non allowed IP`);
            ws.close();
            return;
        }
        */


        ws.on('pong', function pong(this: any) {
            // Received pong from client
            this.pongOk = true;
        });


        // Handle incoming message from client
        ws.on('message', async function message(data: Buffer) {
            const clientName = (ws as any).auth?.clientName || 'anonymous';

            const messageJson = data.toString();

            //console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] request from client ${colors.cyan(clientName)} (${clientIP}) : \n${messageJson}`);

            // try
            const message: t.RpcResponse | t.RpcRequest = JSON.parse(messageJson);

            if ('error' in message) {
                console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] received error from client ${colors.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                const err: t.RpcError = JSON.parse(messageJson);

            } else if ('result' in message) {
                console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] received response from client ${colors.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                const res: t.RpcResponse = JSON.parse(messageJson);

            } else if ('method' in message && 'params' in message) {
                console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] received request from client ${colors.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                const req: t.RpcRequest = JSON.parse(messageJson);

                switch (req.method) {

                    /* CORE */
                    case 'sysInfos':
                        const sysInfos = await getSystemInfos();
                        rpcSendResponse(ws, req.id, sysInfos);
                        break;

                    /* RIG */
                    case 'rigStatus':
                        const rigInfos = Rig.getRigInfos();
                        rpcSendResponse(ws, req.id, rigInfos);
                        break;

                    case 'rigMonitorStart':
                        Rig.monitorStart(config, req.params);
                        rpcSendResponse(ws, req.id, 'OK');
                        break;

                    case 'rigMonitorStop':
                        Rig.monitorStop(config, req.params);
                        rpcSendResponse(ws, req.id, 'OK');
                        break;

                    case 'rigMonitorStatus':
                        const rigMonitorStatus = Rig.monitorStatus(config, req.params);
                        rpcSendResponse(ws, req.id, rigMonitorStatus);
                        break;

                    case 'rigMinerInstallStart':
                        try {
                            await Rig.minerInstallStart(config, req.params);
                            rpcSendResponse(ws, req.id, 'OK');

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot start miner install. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'rigMinerRunStart':
                        try {
                            await Rig.minerRunStart(config, req.params);
                            rpcSendResponse(ws, req.id, 'OK');

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot start miner run. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'rigMinerRunStop':
                        try {
                            Rig.minerRunStop(config, req.params);
                            rpcSendResponse(ws, req.id, 'OK');

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot stop miner run. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'rigMinerRunStatus':
                        try {
                            const minerStatus = Rig.minerRunStatus(config, req.params);
                            rpcSendResponse(ws, req.id, minerStatus);

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot get miner run status. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'rigMinerRunLog':
                        try {
                            const minerLog = Rig.minerRunLog(config, req.params);
                            rpcSendResponse(ws, req.id, minerLog);

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot get miner run log. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'rigMinerRunInfos':
                        try {
                            const minerInfos = await Rig.minerRunInfos(config, req.params);
                            rpcSendResponse(ws, req.id, minerInfos);

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot get miner run infos. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;


                    /* NODE */
                    case 'nodeStatus':
                        const nodeInfos = Node.getNodeInfos();
                        rpcSendResponse(ws, req.id, nodeInfos);
                        break;

                    case 'nodeMonitorStart':
                        Node.monitorStart(config, req.params);
                        rpcSendResponse(ws, req.id, 'OK');
                        break;

                    case 'nodeMonitorStop':
                        Node.monitorStop(config, req.params);
                        rpcSendResponse(ws, req.id, 'OK');
                        break;

                    case 'nodeMonitorStatus':
                        const nodeMonitorStatus = Node.monitorStatus(config, req.params);
                        rpcSendResponse(ws, req.id, nodeMonitorStatus);
                        break;

                    case 'nodeFullnodeInstallStart':
                        try {
                            await Node.fullnodeInstallStart(config, req.params);
                            rpcSendResponse(ws, req.id, 'OK');

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot start fullnode install. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'nodeFullnodeRunStart':
                        try {
                            await Node.fullnodeRunStart(config, req.params);
                            rpcSendResponse(ws, req.id, 'OK');

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot start fullnode run. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'nodeFullnodeRunStop':
                        try {
                            Node.fullnodeRunStop(config, req.params);
                            rpcSendResponse(ws, req.id, 'OK');

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot stop fullnode run. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'nodeFullnodeRunStatus':
                        try {
                            const fullnodeStatus = Node.fullnodeRunStatus(config, req.params);
                            rpcSendResponse(ws, req.id, fullnodeStatus);

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot get fullnode run status. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'nodeFullnodeRunInfos':
                        try {
                            const fullnodeInfos = await Node.fullnodeRunInfos(config, req.params);
                            rpcSendResponse(ws, req.id, fullnodeInfos);

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot get fullnode run infos. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    /* DEFAULT */

                    default:
                        rpcSendError(ws, req.id, { code: -32601, message:  `the method ${req.method} does not exist/is not available` });
                        break;

                }

            } else {
                console.warn(`${now()} [${colors.blue('WARNING')}] [DAEMON] received invalid message from client ${colors.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                ws.close();
            }

        });


        // Handle connection close
        ws.on('close', function message(data: Buffer) {
            const clientName = (ws as any).auth?.clientName || 'anonymous';
            console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] client ${clientName} (${clientIP}) disconnected`);
        });


        // Send a welcome message
        //ws.send('Welcome on OpenMine websocket');
    });



    // Handle connections heartbeat
    const interval = setInterval(function pings() {
        // ping each client...
        wss.clients.forEach(function ping(ws: WebSocket | any): void {
            let clientIP = ws._socket.remoteAddress;

            if ((ws as any).pongOk === false) {
                console.warn(`${now()} [${colors.yellow('WARNING')}] [DAEMON] ejecting client ${clientIP} for inactivity`);
                return ws.terminate();
            }

            (ws as any).pongOk = false;
            ws.ping();
        });
    }, config.wssConnTimeout);

}



function getWsClientIp(req: express.Request): string {
    let clientIP = ((req as any).headers['x-forwarded-for'] as string || '').split(',')[0].trim(); // reverse-proxified IP address

    if (! clientIP) {
        clientIP = req.socket?.remoteAddress || ''; // direct IP address
    }

    return clientIP;
}



function rpcSendRequest(ws: WebSocket, id: number, method: string, params: any): void {
    const req: t.RpcRequest = buildRpcRequest(id, method, params);
    const reqStr = JSON.stringify(req);
    console.debug(`${now()} [DEBUG] [DAEMON] sending request: ${reqStr}`);
    ws.send(reqStr);
}



function rpcSendResponse(ws: WebSocket, id: number, result: any): void {
    const res: t.RpcResponse = buildRpcResponse(id, result);
    const resStr = JSON.stringify(res);
    console.debug(`${now()} [DEBUG] [DAEMON] sending response: ${resStr}`);
    ws.send(resStr);
}


function rpcSendError(ws: WebSocket, id: number, error: any): void {
    const err: t.RpcError = buildRpcError(id, error);
    const errStr = JSON.stringify(err);
    console.debug(`${now()} [DEBUG] [DAEMON] sending error: ${errStr}`);
    ws.send(errStr);
}


async function safeQuit(returnCode: number=1): Promise<void> {
    if (quitRunning) {
        process.exit();
    }
    quitRunning = true;

    // gracefully kill Rig active processes
    let procName: string;
    let rigProcesses = Rig.getProcesses();

    for (procName in rigProcesses) {
        const proc = rigProcesses[procName];

        if (! proc.process) {
            throw { message: `The processus ${(proc.process || {} as any).pid} is not killable` };
        }

        console.log(`Sending SIGINT signal to rig process PID ${proc.process.pid}`);
        proc.process.kill('SIGINT');
    }

    // waiting for kills are done...
    let rigProcessesCount = Object.keys(rigProcesses).length;
    let lastRigProcessesCount = -1;
    let waits = 0;
    const waitDelayBetweenPools = 100; // ms
    const WaitsCountBeforeSigKill = 10; // => 10 * 100 ms = 1 second
    while (true) {
        rigProcesses = Rig.getProcesses();
        rigProcessesCount = Object.keys(rigProcesses).length;
        if (rigProcessesCount === 0) {
            break;
        }
        if (rigProcessesCount !== lastRigProcessesCount) {
            console.log(`Remaining rig processes: ${rigProcessesCount}`);
            lastRigProcessesCount = rigProcessesCount;
        }
        await sleep(waitDelayBetweenPools);
        waits++;

        if (waits === WaitsCountBeforeSigKill) {
            // if SIGINT has no effect after x seconds, send SIGKILL signal...
            for (procName in rigProcesses) {
                const proc = rigProcesses[procName];
                if (! proc.process) continue;
                console.log(`Sending SIGKILL signal to rig process PID ${proc.process.pid}`);
                proc.process.kill('SIGKILL');
            }
        }
    }

    setTimeout(process.exit, 500, returnCode);
}


function catchSignals(): void {
    process.on('SIGINT', async () => {
        console.log(`${now()} [INFO] [DAEMON] CTRL+C detected`);
        safeQuit(2);
    });
    process.on('SIGQUIT', async () => {
        console.log(`${now()} [INFO] [DAEMON] Keyboard quit detected`);
        safeQuit(3);
    });
    process.on('SIGTERM', async () => {
        console.log(`${now()} [INFO] [DAEMON] Kill detected`);
        safeQuit(15);
    });
    process.on('SIGTERM', async () => {
        console.log(`${now()} [INFO] [DAEMON] Kill -9 detected`);
        safeQuit(9);
    });

    process.on('unhandledRejection', async (err: any, p) => {
        // Handle unhandled promises directly
        console.error(`${now()} [ERROR] [DAEMON] Error 'unhandledRejection' detected in promise : ${err.message}`);

        if (err.message.startsWith("Timeout error: ping")) {
            return;
        }

        console.log(p);

        //debugger;
        safeQuit(5);
    });
}


export function getConfig(): t.Config {
    return config;
}


export async function getSysInfos(refresh:boolean=false) {
    if (sysInfos === null || refresh) {
        sysInfos = await getSystemInfos();
    }
    return sysInfos;
}

