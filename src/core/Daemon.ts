
import express from 'express';
import colors from 'colors/safe';
import path from 'path';
import os from 'os';
import * as http from 'http';
import * as WebSocket from 'ws';
const ejs = require('ejs');

import { loadDaemonConfig } from './Config';
import { now, sleep, hasOpt, buildRpcRequest, buildRpcResponse, buildRpcError } from '../common/utils';
import { getSystemInfos } from '../common/sysinfos';

import { registerCoreRoutes } from './http/routesCore';
import { registerRigRoutes }  from './http/routesRig';
import { registerFarmRoutes } from './http/routesFarm';
import { registerNodeRoutes } from './http/routesNode';
import { registerPoolRoutes } from './http/routesPool';
import * as Rig from '../rig/Rig';
import * as Farm from '../farm/Farm';
import * as Node from '../node/Node';
import * as Pool from '../pool/Pool';

import type *  as t from '../common/types';


/* ########## USAGE #########

# Start daemon
./frmd


*/
/* ########## MAIN ######### */


let config: t.DaemonConfigAll;
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
     --user-dir                              # default %HOME%/.freemining OR %HOME%/AppData/Local/freemining

     --create-config

     --listen-address                        # daemon listen address. default 127.0.0.1
     --listen-port                           # daemon listen port. default 1234
     --wss-conn-timeout                      # clients connection timeout (if no ping). default 10 seconds

     -r | --rig-monitor-start                # start rig monitor at freemining start
     -a | --rig-farm-agent-start             # start rig farm agent at freemining start
     -n | --node-monitor-start               # start node monitor at freemining start
     -f | --farm-server-start                # start farm rigs server at freemining start
     -p | --pool-monitor-start               # start pool monitor at freemining start

     --rig-monitor-poll-delay                # delay between 2 checks of the rig status
     --node-monitor-poll-delay               # delay between 2 checks of the node status

     --rig-farm-server-host
     --rig-farm-server-port
     --rig-farm-server-pass

`;

    console.log(_usage);

    if (exitCode !== null) {
        process.exit(exitCode);
    }
}


export function run(args: (t.DaemonParamsAll)[] = []): void {
    if (hasOpt('--help', args)) {
        usage(0);
    }

    catchSignals();

    config = loadDaemonConfig(args);

    if (hasOpt('--create-config', args)) {
        console.log( `${now()} [INFO] [DAEMON] config files generated` );
        return;
    }

    console.info( `${now()} [INFOO] [DAEMON] Daemon start...` );

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

    if (hasOpt('-r', args) || hasOpt('--rig-monitor-start', args)) {
        Rig.monitorStart(config);
    }

    if (hasOpt('-n', args) || hasOpt('--node-monitor-start', args)) {
        Node.monitorStart(config);
    }

    if (hasOpt('-f', args) || hasOpt('--farm-server-start', args)) {
        Farm.rigsServerStart(config);
    }

    if (hasOpt('-a', args) || hasOpt('--rig-farm-agent-start', args)) {
        setTimeout(() => {
            Rig.farmAgentStart(config);
        }, 1000);
    }
}



function registerHttpRoutes(config: t.DaemonConfigAll, app: express.Express): void {
    // Log http request
    app.use(function (req: express.Request, res: express.Response, next: Function) {
        console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] ${req.method.toLocaleUpperCase()} ${req.url}`);
        next();
    });

    if (config.httpAllowedIps.length > 0) {
        // IP Filter
        app.use(function (req: express.Request, res: express.Response, next: Function) {
            const clientIP: string = req.header('x-real-ip') || req.header('x-forwarded-for') || req.ip;

            if (! config.httpAllowedIps.includes(clientIP)) {
                console.warn(`${now()} [${colors.blue('WARNING')}] [DAEMON] IP REFUSED ${req.method.toLocaleUpperCase()} ${req.url}`);
                res.send(`Access not granted`);
                res.end();
                return;
            }

            next();
        });
    }

    // Parse Body (POST only)
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json({  }));

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



function registerWssRoutes(config: t.DaemonConfigAll, wss: WebSocket.Server): void {

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
            const clientName = (ws as any).auth?.name || 'anonymous';
            const messageJson = data.toString();

            //console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] request from client ${colors.cyan(clientName)} (${clientIP}) : \n${messageJson}`);

            let message: t.RpcResponse | t.RpcRequest;
            try {
                message = JSON.parse(messageJson);

            } catch (err: any) {
                console.warn(`${now()} [${colors.yellow('WARNING')}] [DAEMON] received invalid json from client ${colors.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                return;
            }

            if ('error' in message) {
                console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] received error from client ${colors.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                const err: t.RpcError = JSON.parse(messageJson);

            } else if ('result' in message) {
                console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] received response from client ${colors.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                const res: t.RpcResponse = JSON.parse(messageJson);

            } else if ('method' in message && 'params' in message) {
                //console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] received request from client ${colors.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                //console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] received request from client ${colors.cyan(clientName)} (${clientIP}) (${messageJson.length} chars.)`);
                const req: t.RpcRequest = JSON.parse(messageJson);

                console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] received request from client ${colors.cyan(clientName)} (${clientIP}) (${req.method})`);

                switch (req.method) {

                    /* CORE */
                    case 'sysInfos':
                        {
                            const sysInfos = await getSystemInfos();
                            rpcSendResponse(ws, req.id, sysInfos);
                        }
                        break;

                    /* RIG */
                    case 'rigGetInfos':
                        {
                            const rigInfos = Rig.getRigInfos(config);
                            rpcSendResponse(ws, req.id, rigInfos);
                        }
                        break;

                    case 'rigMonitorStart':
                        {
                            Rig.monitorStart(config);
                            rpcSendResponse(ws, req.id, 'OK');
                        }
                        break;

                    case 'rigMonitorStop':
                        {
                            Rig.monitorStop();
                            rpcSendResponse(ws, req.id, 'OK');
                        }
                        break;

                    case 'rigMonitorGetStatus':
                        {
                            const rigMonitorStatus = Rig.monitorGetStatus();
                            rpcSendResponse(ws, req.id, rigMonitorStatus);
                        }
                        break;

                    case 'rigFarmAgentStart':
                        {
                            Rig.farmAgentStart(config);
                            rpcSendResponse(ws, req.id, 'OK');
                        }
                        break;

                    case 'rigFarmAgentStop':
                        {
                            Rig.farmAgentStop();
                            rpcSendResponse(ws, req.id, 'OK');
                        }
                        break;

                    case 'rigFarmAgentGetStatus':
                        {
                            const rigFarmAgentStatus = Rig.farmAgentGetStatus();
                            rpcSendResponse(ws, req.id, rigFarmAgentStatus);
                        }
                        break;

                    case 'rigMinerInstallStart':
                        try {
                            Rig.minerInstallStart(config, req.params);
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

                    case 'rigMinerRunGetStatus':
                        try {
                            const minerStatus = Rig.minerRunGetStatus(config, req.params);
                            rpcSendResponse(ws, req.id, minerStatus);

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot get miner run status. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'rigMinerRunGetLog':
                        try {
                            const minerLog = await Rig.minerRunGetLog(config, req.params);
                            rpcSendResponse(ws, req.id, minerLog);

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot get miner run log. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'rigMinerRunGetInfos':
                        try {
                            const minerInfos = await Rig.minerRunGetInfos(config, req.params);
                            rpcSendResponse(ws, req.id, minerInfos);

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot get miner run infos. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;


                    /* NODE */
                    case 'nodeGetStatus':
                        {
                            const nodeInfos = Node.getNodeInfos(config);
                            rpcSendResponse(ws, req.id, nodeInfos);
                        }
                        break;

                    case 'nodeMonitorStart':
                        {
                            Node.monitorStart(config);
                            rpcSendResponse(ws, req.id, 'OK');
                        }
                        break;

                    case 'nodeMonitorStop':
                        {
                            Node.monitorStop();
                            rpcSendResponse(ws, req.id, 'OK');
                        }
                        break;

                    case 'nodeMonitorGetStatus':
                        {
                            const nodeMonitorStatus = Node.monitorGetStatus();
                            rpcSendResponse(ws, req.id, nodeMonitorStatus);
                        }
                        break;

                    case 'nodeFullnodeInstallStart':
                        try {
                            Node.fullnodeInstallStart(config, req.params);
                            rpcSendResponse(ws, req.id, 'OK');

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot start fullnode install. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'nodeFullnodeRunStart':
                        try {
                            Node.fullnodeRunStart(config, req.params);
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

                    case 'nodeFullnodeRunGetStatus':
                        try {
                            const fullnodeStatus = Node.fullnodeRunGetStatus(config, req.params);
                            rpcSendResponse(ws, req.id, fullnodeStatus);

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot get fullnode run status. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'rigFullnodeRunGetLog':
                        try {
                            const fullnodeLog = await Node.fullnodeRunGetLog(config, req.params);
                            rpcSendResponse(ws, req.id, fullnodeLog);

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot get fullnode run log. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;

                    case 'nodeFullnodeRunGetInfos':
                        try {
                            const fullnodeInfos = await Node.fullnodeRunGetInfos(config, req.params);
                            rpcSendResponse(ws, req.id, fullnodeInfos);

                        } catch (err: any) {
                            console.warn(`${now()} [${colors.blue('WARN')}] [DAEMON] cannot get fullnode run infos. ${err.message}`);
                            rpcSendError(ws, req.id, { code: -1, message: err.message });
                        }
                        break;


                    /* FARM */
                    case 'farmGetStatus':
                        {
                            const farmInfos = Farm.getFarmInfos(config);
                            rpcSendResponse(ws, req.id, farmInfos);
                        }
                        break;

                    case 'farmAuth':
                        if (! req.params.user) {
                            rpcSendError(ws, req.id, { code: -1, message: `Missing auth` } );
                            ws.close();
                            break;
                        }
                        const authResult = Farm.rigAuthRequest(config, req.params);
                        if (authResult) {
                            const rigName = req.params.user;

                            (ws as any).auth = {
                                name: rigName,
                                ip: clientIP,
                                type: 'rig',
                            };
                            rpcSendResponse(ws, req.id, 'OK');

                            Farm.setRigWs(rigName, ws);

                        } else {
                            rpcSendError(ws, req.id, { code: -1, message: `Auth rejected` } );
                            ws.close();
                        }
                        break;

                    case 'farmRigUpdateStatus': // requires auth
                        {
                            if (! (ws as any).auth || (ws as any).auth.type !== 'rig') {
                                rpcSendError(ws, req.id, { code: -1, message: `Auth required` } );
                                ws.close();
                                break;
                            }
                            const rigName = (ws as any).auth.name;
                            const rigInfos = req.params;
                            Farm.setRigStatus(rigName, rigInfos);
                            rpcSendResponse(ws, req.id, 'OK');
                        }
                        break;

                    case 'farmRigUpdateConfig':
                        if (! (ws as any).auth || (ws as any).auth.type !== 'rig') {
                            rpcSendError(ws, req.id, { code: -1, message: `Auth required` } );
                            ws.close();
                            break;
                        }
                        const rigName = (ws as any).auth.name;
                        const rigConfig = req.params;
                        Farm.setRigConfig(rigName, rigConfig);
                        rpcSendResponse(ws, req.id, 'OK');
                        break;

                    /*
                    case 'farmRigUpdateInstalledMiners':
                        break;

                    case 'farmRigUpdateRunningMinersAliases':
                        break;
                    */


                    /* POOL */
                    case 'poolGetStatus':
                        {
                            const poolInfos = Pool.getPoolInfos(config);
                            rpcSendResponse(ws, req.id, poolInfos);
                        }
                        break;


                    /* DEFAULT */

                    default:
                        rpcSendError(ws, req.id, { code: -32601, message:  `the method ${req.method} does not exist/is not available on DAEMON` });
                        break;

                }

            } else {
                console.warn(`${now()} [${colors.yellow('WARNING')}] [DAEMON] received invalid message from client ${colors.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                ws.close();
            }

        });


        // Handle connection close
        ws.on('close', function message(data: Buffer) {
            const clientName = (ws as any).auth?.name || 'anonymous';
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


export async function safeQuit(returnCode: number=1): Promise<void> {
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

        console.log(`${now()} [DEBUG] [DAEMON] Sending SIGINT signal to rig process PID ${proc.process.pid}`);
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
            console.log(`${now()} [DEBUG] [DAEMON] Remaining rig processes: ${rigProcessesCount}`);
            lastRigProcessesCount = rigProcessesCount;
        }
        await sleep(waitDelayBetweenPools);
        waits++;

        if (waits === WaitsCountBeforeSigKill) {
            // if SIGINT has no effect after x seconds, send SIGKILL signal...
            for (procName in rigProcesses) {
                const proc = rigProcesses[procName];
                if (! proc.process) continue;
                console.log(`${now()} [DEBUG] [DAEMON] Sending SIGKILL signal to rig process PID ${proc.process.pid}`);
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


export function getConfig(): t.DaemonConfigAll {
    return config;
}


export async function getSysInfos(refresh:boolean=false) {
    if (sysInfos === null || refresh) {
        sysInfos = await getSystemInfos();
    }
    return sysInfos;
}

