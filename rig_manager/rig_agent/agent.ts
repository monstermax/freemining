
import fs from 'fs';
import express from 'express';
import * as http from 'http';
import WebSocket from 'ws';

import os from 'os';
import colors from 'colors/safe';

import { now, cmdExec, stringTemplate, applyHtmlLayout } from './common/utils';


/* ############################## TYPES ##################################### */


type Rig = {
    name: string,
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



/* ############################## MAIN ###################################### */

const configFrm: any = require('../../freemining.json');

let rigConfigPath: string = configFrm.frmConfDir + '/rig/rig_manager.json';
rigConfigPath = stringTemplate(rigConfigPath, {}, false, true, true) || '';
if (! fs.existsSync(rigConfigPath)) {
    rigConfigPath = '../rig_manager.json';
}

const configRig: any = require(rigConfigPath);


// Init HTTP Webserver
const app = express();
const server = http.createServer(app);

const httpServerHost: string = configRig.rigWebServer?.host || '0.0.0.0';
const httpServerPort: number = Number(configRig.rigWebServer?.port || 4300);

let staticDir = configRig.rigWebServer?.root || `${__dirname}/web/public`;
let templatesDir = configRig.rigWebServer?.templates || `${__dirname}/web/templates`;

const rigAppDir = __dirname + '/..'; // configFrm.frmDataDir + '/rig';
const ctx: any = {
    ...configFrm,
    ...configRig,
    rigAppDir,
};
templatesDir = stringTemplate(templatesDir, ctx, false, true, true);
staticDir = stringTemplate(staticDir, ctx, false, true, true);

const layoutPath = `${templatesDir}/layout_rig_agent.html`;

const rigName = configRig.rigName || os.hostname();

const websocketPassword = 'xxx'; // password to access farm websocket server

const rigManagerCmd = `${__dirname}/../rig_manager.sh ps`;



console.log(`${now()} [${colors.blue('INFO')}] Starting Rig ${rigName}`);


app.use(express.urlencoded({ extended: true }));

console.log(`${now()} [${colors.blue('INFO')}] Using static folder ${staticDir}`);
app.use(express.static(staticDir));



app.get('/', async (req: express.Request, res: express.Response, next: Function) => {
    if (! rigStatus) {
        res.send(`Rig not initialized`);
        res.end();
        return;
    }

    const presets = configRig.pools || {};
    const activeProcesses: string = await getRigProcesses();

    const opts = {
        rigName,
        rig: rigStatus,
        miners: getMiners(),
        rigs:[],
        presets,
        activeProcesses,
    };
    const pageContent = loadTemplate('index.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


app.get('/status.json', (req: express.Request, res: express.Response, next: Function) => {
    res.header({'Content-Type': 'application/json'});

    res.send( JSON.stringify(rigStatus) );
    res.end();
});


app.post('/api/rig/service/start', async (req: express.Request, res: express.Response, next: Function) => {
    const serviceName = req.body.service;

    const algo = req.body.algo || '';
    const service = req.body.service || '';
    const poolUrl = req.body.poolUrl || '';
    const poolAccount = req.body.poolAccount || '';
    const optionalParams = req.body.optionalParams || '';

    const params = {
        //coin: '',
        algo,
        service,
        poolUrl,
        poolAccount,
        optionalParams,
    };
    //const paramsJson = JSON.stringify(params);

    const ok = await startRigService(serviceName, params);
});


app.post('/api/rig/service/stop', async (req: express.Request, res: express.Response, next: Function) => {
    const serviceName = req.body.service;
    const ok = await stopRigService(serviceName);
});


app.use(function (req: express.Request, res: express.Response, next: Function) {
    // Error 404
    console.log(`${now()} [${colors.yellow('WARNING')}] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);

    next();
});

server.listen(httpServerPort, httpServerHost, () => {
    console.log(`${now()} [${colors.blue('INFO')}] Server started on ${httpServerHost}:${httpServerPort}`);
});



// Init Websocket Cliennt
const wsServerHost = configRig.farmServer?.host || null;
const wsServerPort = configRig.farmServer?.port || 4200;

const serverConnTimeout = 10_000; // si pas de réponse d'un client au bout de x millisecondes on le déconnecte
const serverNewConnDelay = 10_000; // attend x millisecondes avant de se reconnecter (en cas de déconnexion)
const checkStatusInterval = 10_000; // verifie le statut du rig toutes les x millisecondes
const sendStatusInterval = 10_000; // envoie le (dernier) statut du rig au farmServer toutes les x millisecondes

let checkStatusTimeout: any = null;
let connectionCount = 0;

const toolsDir = `${__dirname}/../tools`;
const cmdService = `${toolsDir}/run_miner.sh`;
const cmdRigMonitorJson = `${toolsDir}/rig_monitor_json.sh`;

let rigStatus: RigStatus | null = null;



main();


/* ############################ FUNCTIONS ################################### */



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



function loadTemplate(tplFile: string, data: any={}, currentUrl:string='') {
    const tplPath = `${templatesDir}/${tplFile}`;

    if (! fs.existsSync(tplPath)) {
        return null;
    }
    const layoutTemplate = fs.readFileSync(tplPath).toString();
    let content = stringTemplate(layoutTemplate, data) || '';

    const pageContent = applyHtmlLayout(content, data, layoutPath, currentUrl);
    return pageContent;
}



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

        // Send auth
        ws.send(`auth ${rigName} ${websocketPassword}`);

        // Send rig config
        console.log(`${now()} [${colors.blue('INFO')}] sending rigConfig to server (open) [conn ${connectionId}]`)
        ws.send( `rigConfig ${JSON.stringify(configRig)}`);


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

                    const ok = await startRigService(serviceName, params);
                    var debugme = 1;

                }

            }

            if (args[1] === 'stop') {
                args.shift();
                args.shift();
                const serviceName = args.shift();

                if (serviceName) {
                    const ok = stopRigService(serviceName);
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


async function startRigService(serviceName: string, params: any) {
    // TODO: prevoir une version full nodejs (et compatible windows)

    const cmd = `${cmdService} start ${serviceName} -algo "${params.algo}" -url "${params.poolUrl}" -user "${params.poolAccount}" ${params.optionalParams ? ("-- " + params.optionalParams) : ""}`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);

    }

    return !!ret;
}


async function stopRigService(serviceName: string) {
    // TODO: prevoir une version full nodejs (et compatible windows)

    const cmd = `${cmdService} stop ${serviceName}`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);

    }

    return !!ret;
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



async function checkStatus() {
    console.log(`${now()} [${colors.blue('INFO')}] refreshing rigStatus`)
    checkStatusTimeout = null;
    rigStatus = await getRigStatus();

    // poll services every x seconds
    checkStatusTimeout = setTimeout(checkStatus, checkStatusInterval);
}


function getMiners() {
    const miners = [
        'gminer',
        'lolminer',
        'nbminer',
        'teamredminer',
        'trex',
        'xmrig',
    ];
    return miners;
}


async function getRigProcesses(): Promise<string> {
    const cmd = rigManagerCmd;
    const result = await cmdExec(cmd);
    return result || '';
}


