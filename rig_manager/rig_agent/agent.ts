
import fs from 'fs';
import express from 'express';
import * as http from 'http';
import WebSocket from 'ws';

import os from 'os';
import colors from 'colors/safe';

import { now, cmdExec, stringTemplate, applyHtmlLayout } from './common/utils';


/* ############################## TYPES ##################################### */


type RigInfo = {
    name: string,
    hostname: string,
    ip: string,
    os: string,
    uptime: number,
}

type RigUsage = {
    loadAvg: number,
    memory: {
        used: number,
        total: number,
    },
}

type RigDevices = {
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
}

type RigService = {
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

type RigStatusJson = {
    infos: RigInfo,
    usage: RigUsage,
    devices: RigDevices,
    services: { [key: string]: RigService },
    dataDate: number,
    dataAge?: number,
    //dateFarm?: number,
    //dataAge?: number,
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

let ws: WebSocket;
let sendStatusTimeout: any = null;

console.log(`${now()} [${colors.blue('INFO')}] Starting Rig ${rigName}`);


app.use(express.urlencoded({ extended: true }));

console.log(`${now()} [${colors.blue('INFO')}] Using static folder ${staticDir}`);
app.use(express.static(staticDir));



app.get('/', async (req: express.Request, res: express.Response, next: Function) => {
    if (! rigStatusJson) {
        res.send(`Rig not initialized`);
        res.end();
        return;
    }

    const activeProcesses: string = await getRigProcesses();

    const installedMiners = (process.env.CONFIGURED_MINERS || '').split(' ');
    const installablesMiners = (process.env.INSTALLED_MINERS || '').split(' ');

    const opts = {
        rigName,
        rig: getLastRigJsonStatus(),
        miners: getMiners(),
        rigs:[],
        activeProcesses,
        installedMiners,
        installablesMiners,
    };
    const pageContent = loadTemplate('index.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


app.get('/status', async (req: express.Request, res: express.Response, next: Function) => {
    if (! rigStatusJson) {
        res.send(`Rig not initialized`);
        res.end();
        return;
    }

    const presets = configRig.pools || {};

    const opts = {
        rigName,
        rig: getLastRigJsonStatus(),
        miners: getMiners(),
        rigs:[],
        presets,
    };
    const pageContent = loadTemplate('status.html', opts, req.url);
    res.send( pageContent );
    res.end();
});



app.get('/status.json', (req: express.Request, res: express.Response, next: Function) => {
    res.header({'Content-Type': 'application/json'});

    res.send( JSON.stringify(getLastRigJsonStatus()) );
    res.end();
});


app.get('/status.txt', async (req: express.Request, res: express.Response, next: Function) => {
    res.header({'Content-Type': 'text/plain'});

    rigStatusTxt = await getRigTxtStatus();

    res.send( getLastRigTxtStatus() );
    res.end();
});


app.get('/miners/miner', async (req: express.Request, res: express.Response, next: Function) => {
    const miner = req.query.miner as string || '';
    const asJson = req.query.json === "1";
    const rawOutput = req.query.raw === "1";

    const minerStatus = await getRigServiceStatus(miner, asJson ? '-json' : '-txt');

    if (rawOutput) {
        if (asJson) {
            res.header( {"Content-Type": "application/json"} );
        } else {
            res.header( {"Content-Type": "text/plain"} );
        }
        res.send( minerStatus );
        res.end();
        return;
    }

    const opts = {
        configRig,
        miner,
        minerStatus,
    };
    const pageContent = loadTemplate('miner.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


app.post('/api/rig/service/start', async (req: express.Request, res: express.Response, next: Function) => {
    const minerName = req.body.service;

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

    const ok = await startRigService(minerName, params);
});


app.post('/api/rig/service/stop', async (req: express.Request, res: express.Response, next: Function) => {
    const minerName = req.body.service;
    const ok = await stopRigService(minerName);
});


app.use(function (req: express.Request, res: express.Response, next: Function) {
    // Error 404
    console.log(`${now()} [${colors.yellow('WARNING')}] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);

    next();
});

server.listen(httpServerPort, httpServerHost, () => {
    console.log(`${now()} [${colors.blue('INFO')}] Webserver started on ${httpServerHost}:${httpServerPort}`);
});



// Init Websocket Cliennt
const wsServerHost = configRig.farmServer?.host || null;
const wsServerPort = configRig.farmServer?.port || 4200;

const serverConnTimeout = 10_000; // si pas de réponse d'un client au bout de x millisecondes on le déconnecte
const serverNewConnDelay = 10_000; // attend x millisecondes avant de se reconnecter (en cas de déconnexion)

const checkStatusInterval = 10_000; // verifie le statut du rig toutes les x millisecondes
const checkStatusIntervalIdle = 30_000; // when no service running

const sendStatusInterval = 10_000; // envoie le (dernier) statut du rig au farmServer toutes les x millisecondes
const sendStatusIntervalIdle = 60_000; // when no service running

let checkStatusTimeout: any = null;
let connectionCount = 0;

const toolsDir = `${__dirname}/../tools`;
const cmdService = `${toolsDir}/run_miner.sh`;
const cmdRigMonitorJson = `${toolsDir}/rig_monitor_json.sh`;
const cmdRigMonitorTxt = `${toolsDir}/rig_monitor_txt.sh`;

let rigStatusJson: RigStatusJson | null = null;
let rigStatusTxt: string | null = null;



main();


/* ############################ FUNCTIONS ################################### */



async function main() {
    await checkStatus(false);

    if (wsServerHost) {
        // connect to websocket server
        websocketConnect();
    }

    if (false) {
        // run local webserver
        // TODO
    }
}



function loadTemplate(tplFile: string, data: any={}, currentUrl:string=''): string {
    const tplPath = `${templatesDir}/${tplFile}`;

    if (! fs.existsSync(tplPath)) {
        return '';
    }

    let content = '';
    try {
        const layoutTemplate = fs.readFileSync(tplPath).toString();
        content = stringTemplate(layoutTemplate, data) || '';

    } catch (err: any) {
        content = `Error: ${err.message}`;
    }

    const pageContent = applyHtmlLayout(content, data, layoutPath, currentUrl) || '';
    return pageContent;
}



function websocketConnect() {
    let newConnectionTimeout: any = null;

    const connectionId = connectionCount++;

    console.log(`${now()} [${colors.blue('INFO')}] connecting to websocket server... [conn ${connectionId}]`);

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
        // Send auth
        ws.send(`auth ${rigName} ${websocketPassword}`);

        // Send rig config
        console.log(`${now()} [${colors.blue('INFO')}] sending rigConfig to server (open) [conn ${connectionId}]`)
        ws.send( `rigConfig ${JSON.stringify(configRig)}`);

        if (! rigStatusJson) {
            console.log(`${now()} [${colors.yellow('WARNING')}] cannot send rigStatusJson to server (open) [conn ${connectionId}]`)
            ws.close();
            return;
        }

        // Send rig status
        sendStatus(`(open)`);

        // send rig status every 10 seconds
        //if (sendStatusTimeout === null) {
        //    sendStatusTimeout = setTimeout(sendStatusSafe, sendStatusInterval, ws);
        //}

        // Prepare connection heartbeat
        heartbeat.call(this);
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
                const minerName = args.shift();

                if (minerName && args.length > 0) {
                    const paramsJson = args.join(' ');

                    let params: any;
                    try {
                        params = JSON.parse(paramsJson);

                    } catch (err: any) {
                        console.error(`${now()} [${colors.red('ERROR')}] cannot start service : ${err.message}`);
                        return;
                    }

                    const ok = await startRigService(minerName, params);
                    var debugme = 1;

                }

            }

            if (args[1] === 'stop') {
                args.shift();
                args.shift();
                const minerName = args.shift();

                if (minerName) {
                    const ok = stopRigService(minerName);
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

    return ws;
}


async function startRigService(minerName: string, params: any) {
    // TODO: prevoir une version full nodejs (et compatible windows)

    const cmd = `${cmdService} ${minerName} start -algo "${params.algo}" -url "${params.poolUrl}" -user "${params.poolAccount}" ${params.optionalParams ? ("-- " + params.optionalParams) : ""}`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    await checkStatus();

    return !!ret;
}


async function stopRigService(minerName: string) {
    // TODO: prevoir une version full nodejs (et compatible windows)

    const cmd = `${cmdService} ${minerName} stop`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    await checkStatus();

    return !!ret;
}



async function getRigServiceStatus(minerName: string, option:string=''): Promise<string> {
    // TODO: prevoir une version full nodejs (et compatible windows)

    const cmd = `${cmdService} ${minerName} status${option}`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    let ret: string = (await cmdExec(cmd, 5_000)) || '';

    if (ret) {
        ret = ret.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors
    }

    return ret || '';
}



function getLastRigTxtStatus(): string | null {
    if (! rigStatusTxt) {
        return null;
    }
    let _rigStatusTxt = rigStatusTxt;

    if (_rigStatusTxt) {
        _rigStatusTxt = _rigStatusTxt.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors
    }

    return _rigStatusTxt;
}


async function getRigTxtStatus(): Promise<string | null> {
    const cmd = cmdRigMonitorTxt;

    // poll services status...
    console.log(`${now()} [${colors.blue('INFO')}] polling TXT rig status...`);
    const statusTxt = await cmdExec(cmd, 5_000);

    if (statusTxt) {
        console.log(`${now()} [${colors.blue('INFO')}]  => rig TXT status OK`)

    } else {
        console.error(`${now()} [${colors.red('ERROR')}]  => rig TXT status KO. cannot read rig status (no response from shell)`);
    }

    return statusTxt;
}





function getLastRigJsonStatus(): RigStatusJson | null {
    if (! rigStatusJson) {
        return null;
    }
    const _rigStatusJson = {
        ...rigStatusJson,
    }
    _rigStatusJson.dataAge = !rigStatusJson?.dataDate ? undefined : Math.round(Date.now()/1000 - rigStatusJson.dataDate);

    return _rigStatusJson;
}


async function getRigJsonStatus(): Promise<RigStatusJson | null> {
    const cmd = cmdRigMonitorJson;

    // poll services status...
    console.log(`${now()} [${colors.blue('INFO')}] polling JSON rig status...`);
    const statusJson = await cmdExec(cmd, 5_000);

    if (statusJson) {
        try {
            const _rigStatusJson = JSON.parse(statusJson);

            // status is OK
            console.log(`${now()} [${colors.blue('INFO')}]  => rig JSON status OK`)

            return _rigStatusJson;

        } catch (err: any) {
            // status ERROR: empty or malformed JSON
            console.error(`${now()} [${colors.red('ERROR')}]  => rig JSON status KO. cannot read rig status (invalid shell response)`);
            console.debug(statusJson);
        }

    } else {
        // status ERROR: shell command error
        console.log(`${now()} [${colors.red('WARNING')}]  => rig JSON status KO. cannot read rig status (no response from shell)`);
    }

    return null;
}



async function checkStatus(sendStatusToFarm: boolean=true) {
    if (checkStatusTimeout) {
        clearTimeout(checkStatusTimeout);
        checkStatusTimeout = null;
    }

    // retrieve current rig status
    rigStatusJson = await getRigJsonStatus();

    if (sendStatusToFarm) {
        sendStatusSafe();
    }

    // re-check status in {delay} seconds...
    const delay = (!rigStatusJson || Object.keys(rigStatusJson.services).length == 0) ? checkStatusIntervalIdle : checkStatusInterval;
    checkStatusTimeout = setTimeout(checkStatus, delay);
}



function sendStatusSafe(): void {
    //if (sendStatusTimeout) {
    //    clearTimeout(sendStatusTimeout);
    //    sendStatusTimeout = null;
    //}

    if (rigStatusJson) {
        if (ws.readyState === WebSocket.OPEN) {
            sendStatus(`(sendStatusSafe)`);

            //var debugSentData = JSON.stringify(rigStatusJson);
            //var debugme = 1;

        } else {
            console.log(`${now()} [${colors.yellow('WARNING')}] cannot send rigStatusJson to server (sendStatusSafe. ws closed)`);
            ws.close();
            return;
        }

    } else {
        console.log(`${now()} [${colors.yellow('WARNING')}] cannot send rigStatusJson to server (sendStatusSafe. no status available)`)
        ws.close();
        return;
    }

    //sendStatusTimeout = setTimeout(sendStatusSafe, sendStatusInterval);
}


function sendStatus(debugInfos:string=''): void {
    console.log(`${now()} [${colors.blue('INFO')}] sending rigStatusJson to server ${debugInfos}`);
    ws.send( `rigStatus ${JSON.stringify(getLastRigJsonStatus())}`);
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
    const result = await cmdExec(cmd, 10_000);
    return result || '';
}


