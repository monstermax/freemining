
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
    //farmDate?: number,
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

const installablesMiners = (process.env.INSTALLABLE_MINERS || '').split(' ');
let installedMiners = (process.env.INSTALLED_MINERS || '').split(' ');
const configuredMiners = (process.env.CONFIGURED_MINERS || '').split(' ');


const wsServerHost = configRig.farmServer?.host || null;
const wsServerPort = configRig.farmServer?.port || 4200;

const serverConnTimeout = 10_000; // si pas de réponse d'un client au bout de x millisecondes on le déconnecte
const serverNewConnDelay = 10_000; // attend x millisecondes avant de se reconnecter (en cas de déconnexion)

const checkStatusInterval = 10_000; // verifie le statut du rig toutes les x millisecondes
const checkStatusIntervalIdle = 30_000; // when no service running

const sendStatusInterval = 10_000; // envoie le (dernier) statut du rig au farmServer toutes les x millisecondes
//const sendStatusIntervalIdle = 60_000; // when no service running

let checkStatusTimeout: any = null;
let connectionCount = 0;

const toolsDir = `${__dirname}/../tools`;
const cmdService = `${toolsDir}/run_miner.sh`;
const cmdRigMonitorJson = `${toolsDir}/rig_monitor_json.sh`;
const cmdRigMonitorTxt = `${toolsDir}/rig_monitor_txt.sh`;

const cmdInstallMiner = `${toolsDir}/install_miner.sh`;
const cmdUninstallMiner = `${toolsDir}/uninstall_miner.sh`;

let rigStatusJson: RigStatusJson | null = null;
let rigStatusTxt: string | null = null;




console.log(`${now()} [${colors.blue('INFO')}] Starting Rig ${rigName}`);



// LOG HTTP REQUEST
app.use(function (req: express.Request, res: express.Response, next: Function) {
    console.log(`${now()} [${colors.blue('INFO')}] ${req.method.toLocaleUpperCase()} ${req.url}`);

    next();
});


app.use(express.urlencoded({ extended: true })); // parse POST body


// STATIC DIR
console.log(`${now()} [${colors.blue('INFO')}] Using static folder ${staticDir}`);
app.use(express.static(staticDir));


// HOMEPAGE
app.get('/', async (req: express.Request, res: express.Response, next: Function) => {
    const activeProcesses: string = await getRigProcesses();

    const installedMiners = getInstalledMiners();

    const opts = {
        rigName,
        rig: getLastRigJsonStatus(),
        miners: getAllMiners(),
        rigs:[],
        activeProcesses,
        installedMiners,
        installablesMiners,
    };
    const pageContent = loadTemplate('index.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


// RIG STATUS
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
        miners: getAllMiners(),
        runnableMiners: getRunnableMiners(),
        presets,
    };
    const pageContent = loadTemplate('status.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


app.get('/miners/miner-run-modal', async (req: express.Request, res: express.Response, next: Function) => {
    const minerName = req.query.miner as string || '';

    if (! rigStatusJson) {
        res.send(`Rig not initialized`);
        res.end();
        return;
    }

    const presets = configRig.pools || {};

    const opts = {
        rigName,
        rig: getLastRigJsonStatus(),
        miners: getAllMiners(),
        runnableMiners: getRunnableMiners(),
        presets,
        miner: minerName,
    };
    const pageContent = loadTemplate('run_miner_modal.html', opts, req.url, false);
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


// GET MINER
app.get('/miners/miner', async (req: express.Request, res: express.Response, next: Function) => {
    const minerName = req.query.miner as string || '';

    if (! minerName) {
        res.send(`Error: missing {miner} parameter`);
        res.end();
        return;
    }

    const minerStatus = rigStatusJson?.services[minerName];
    const installStatus = await getMinerInstallStatus(minerName);
    const uninstallStatus = await getMinerUninstallStatus(minerName);
    const installedMiners = getInstalledMiners();

    const opts = {
        configRig,
        miner: minerName,
        minerStatus,
        installablesMiners,
        installedMiners,
        configuredMiners,
        installStatus,
        uninstallStatus,
    };
    const pageContent = loadTemplate('miner.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


// GET MINER-STATUS
app.get('/miners/miner-status', async (req: express.Request, res: express.Response, next: Function) => {
    const minerName = req.query.miner as string || '';
    const asJson = req.query.json === "1";
    const rawOutput = req.query.raw === "1";

    if (! minerName) {
        res.send(`Error: missing {miner} parameter`);
        res.end();
        return;
    }

    const minerStatus = await getMinerStatus(minerName, asJson ? '-json' : '-txt');

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
        miner: minerName,
        minerStatus,
    };
    const pageContent = loadTemplate('miner_status.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


// GET MINER-RUN
app.get('/miners/miner-run', async (req: express.Request, res: express.Response, next: Function) => {
    const minerName = req.query.miner as string || '';
    const action = req.query.action as string || '';

    if (! minerName) {
        res.send(`Error: missing {miner} parameter`);
        res.end();
        return;
    }

    const minerStatus = await getMinerStatus(minerName);
    const installedMiners = getInstalledMiners();

    if (action === 'log') {
        const logs = await getMinerLogs(minerName);

        res.header({'Content-Type': 'text/plain'});
        res.send(logs);
        res.end();
        return;
    }

    const opts = {
        configRig,
        miner: minerName,
        minerStatus,
        installablesMiners,
        installedMiners,
        configuredMiners,
    };
    const pageContent = loadTemplate('miner_run.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


// POST MINER-RUN
app.post('/miners/miner-run', async (req: express.Request, res: express.Response, next: Function) => {
    const minerName = req.query.miner as string || '';
    const action = req.body.action as string || '';

    if (! minerName) {
        res.send(`Error: missing {miner} parameter`);
        res.end();
        return;
    }

    const minerStatus = await getMinerStatus(minerName);
    const installStatus = await getMinerInstallStatus(minerName);
    const uninstallStatus = await getMinerUninstallStatus(minerName);

    if (action === 'start') {
        if (minerStatus) {
            res.send("Error: cannot start a running miner");
            res.end();
            return;
        }
        if (installStatus) {
            res.send("Error: cannot start a miner while an install is running");
            res.end();
            return;
        }
        if (uninstallStatus) {
            res.send("Error: cannot start a miner while an uninstall is running");
            res.end();
            return;
        }

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

        const ok = await startMiner(minerName, params);

        if (ok) {
            res.send(`OK: miner started`);

        } else {
            res.send(`ERROR: cannot start miner`);
        }

        res.end();
        return;

    } else if (action === 'stop') {
        if (! minerStatus) {
            res.send("Error: cannot stop a non-running miner");
            res.end();
            return;
        }

        const ok = await stopMiner(minerName);

        if (ok) {
            res.send(`OK: miner stopped`);

        } else {
            res.send(`ERROR: cannot stop miner`);
        }

        res.end();
        return;

    } else {
        res.send(`Error: unknown action`);
        res.end();
        return;
    }

});


// GET MINER-INSTALL
app.get('/miners/miner-install', async (req: express.Request, res: express.Response, next: Function) => {
    const minerName = req.query.miner as string || '';
    const action = req.query.action as string || '';

    if (! minerName) {
        res.send(`Error: missing {miner} parameter`);
        res.end();
        return;
    }

    const minerStatus = rigStatusJson?.services[minerName];

    if (action === 'log') {
        const logs = await getMinerInstallLogs(minerName);

        res.header({'Content-Type': 'text/plain'});
        res.send(logs);
        res.end();
        return;
    }

    const installStatus = await getMinerInstallStatus(minerName);
    const uninstallStatus = await getMinerUninstallStatus(minerName);
    const installedMiners = getInstalledMiners();

    const opts = {
        configRig,
        miner: minerName,
        minerStatus,
        installStatus,
        uninstallStatus,
        installablesMiners,
        installedMiners,
        configuredMiners,
    };
    const pageContent = loadTemplate('miner_install.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


// POST MINER-INSTALL
app.post('/miners/miner-install', async (req: express.Request, res: express.Response, next: Function) => {
    const minerName = req.query.miner as string || '';
    const action = req.body.action as string || '';

    if (! minerName) {
        res.send(`Error: missing {miner} parameter`);
        res.end();
        return;
    }

    const minerStatus = rigStatusJson?.services[minerName];
    const installStatus = await getMinerInstallStatus(minerName);
    const uninstallStatus = await getMinerUninstallStatus(minerName);

    if (action === 'start') {
        if (minerStatus) {
            res.send("Error: cannot re-intall a running miner");
            res.end();
            return;
        }
        if (installStatus) {
            res.send("Error: cannot install a miner while another install is running");
            res.end();
            return;
        }
        if (uninstallStatus) {
            res.send("Error: cannot install a miner while an uninstall is running");
            res.end();
            return;
        }

        const ok = await startMinerInstall(minerName);

        // TODO: voir pour raffraichir la liste installedMiners (mettre à null pour provoquer un rechargement au prochain getInstalledMiners)

        if (ok) {
            res.send(`OK: install started`);

        } else {
            res.send(`ERROR: cannot start install`);
        }

        res.end();
        return;

    } else if (action === 'stop') {
        if (! installStatus) {
            res.send("Error: cannot stop a non-running install");
            res.end();
            return;
        }

        const ok = await stopMinerInstall(minerName);

        if (ok) {
            res.send(`OK: install stopped`);

        } else {
            res.send(`ERROR: cannot stop install`);
        }

        res.end();
        return;

    } else {
        res.send(`Error: unknown action`);
        res.end();
        return;
    }
});


// GET MINER-UNINSTALL
app.get('/miners/miner-uninstall', async (req: express.Request, res: express.Response, next: Function) => {
    const minerName = req.query.miner as string || '';
    const action = req.query.action as string || '';

    if (! minerName) {
        res.send(`Error: missing {miner} parameter`);
        res.end();
        return;
    }

    const minerStatus = rigStatusJson?.services[minerName];

    if (action === 'log') {
        const logs = await getMinerUninstallLogs(minerName);

        res.header({'Content-Type': 'text/plain'});
        res.send(logs);
        res.end();
        return;
    }

    const installStatus = await getMinerInstallStatus(minerName);
    const uninstallStatus = await getMinerUninstallStatus(minerName);
    const installedMiners = getInstalledMiners();

    const opts = {
        configRig,
        miner: minerName,
        minerStatus,
        installStatus,
        uninstallStatus,
        installablesMiners,
        installedMiners,
        configuredMiners,
    };
    const pageContent = loadTemplate('miner_uninstall.html', opts, req.url);
    res.send( pageContent );
    res.end();
});



// POST MINER-UNINSTALL
app.post('/miners/miner-uninstall', async (req: express.Request, res: express.Response, next: Function) => {
    const minerName = req.query.miner as string || '';
    const action = req.body.action as string || '';

    if (! minerName) {
        res.send(`Error: missing {miner} parameter`);
        res.end();
        return;
    }

    const minerStatus = rigStatusJson?.services[minerName];
    const installStatus = await getMinerInstallStatus(minerName);
    const uninstallStatus = await getMinerUninstallStatus(minerName);

    if (action === 'start') {
        if (minerStatus) {
            res.send("Error: cannot uninstall a running miner");
            res.end();
            return;
        }
        if (installStatus) {
            res.send("Error: cannot uninstall a miner while an install is running");
            res.end();
            return;
        }
        if (uninstallStatus) {
            res.send("Error: cannot uninstall a miner while another uninstall is running");
            res.end();
            return;
        }

        const ok = await startMinerUninstall(minerName);

        // TODO: voir pour raffraichir la liste installedMiners (mettre à null pour provoquer un rechargement au prochain getInstalledMiners)

        if (ok) {
            res.send(`OK: uninstall started`);

        } else {
            res.send(`ERROR: cannot start uninstall`);
        }

        res.end();
        return;

    } else if (action === 'stop') {
        if (! uninstallStatus) {
            res.send("Error: cannot stop a non-running uninstall");
            res.end();
            return;
        }

        const ok = await stopMinerUninstall(minerName);

        if (ok) {
            res.send(`OK: uninstall stopped`);

        } else {
            res.send(`ERROR: cannot stop uninstall`);
        }

        res.end();
        return;

    } else {
        res.send(`Error: unknown action`);
        res.end();
        return;
    }
});


// ERROR 404
app.use(function (req: express.Request, res: express.Response, next: Function) {
    console.log(`${now()} [${colors.yellow('WARNING')}] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);

    next();
});


// LISTEN
server.listen(httpServerPort, httpServerHost, () => {
    console.log(`${now()} [${colors.blue('INFO')}] Webserver started on ${httpServerHost}:${httpServerPort}`);
});




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



// WEBSOCKET
function websocketConnect() {
    let newConnectionTimeout: any = null;

    const connectionId = connectionCount++;

    console.log(`${now()} [${colors.blue('INFO')}] connecting to websocket server ${wsServerHost}:${wsServerPort} ... [conn ${connectionId}]`);

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

        // TODO: envoyer la liste des miners installés ( process.env.INSTALLED_MINERS )

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

                if (minerName && args.length > 0) {
                    const paramsJson = args.join(' ');

                    let params: any;
                    try {
                        params = JSON.parse(paramsJson);

                    } catch (err: any) {
                        console.error(`${now()} [${colors.red('ERROR')}] cannot start service : ${err.message}`);
                        return;
                    }

                    const ok = await startMiner(minerName, params);
                    var debugme = 1;

                }

            }

            if (args[1] === 'stop') {
                args.shift();
                args.shift();
                const minerName = args.shift();

                if (minerName) {
                    const ok = await stopMiner(minerName);
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



// MINER RUN
async function startMiner(minerName: string, params: any) {
    const cmd = `${cmdService} ${minerName} start -algo "${params.algo}" -url "${params.poolUrl}" -user "${params.poolAccount}" ${params.optionalParams}`;

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


async function stopMiner(minerName: string) {
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


async function getMinerStatus(minerName: string, option:string=''): Promise<string> {
    const cmd = `${cmdService} ${minerName} status${option}`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    let ret: string = (await cmdExec(cmd, 5_000)) || '';

    if (ret) {
        ret = ret.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors
    }

    return ret || '';
}


async function getMinerLogs(minerName: string): Promise<string> {
    const cmd = `${cmdService} ${minerName} log -n 50`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return ret || '';
}




// RIG STATUS

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



// MINER INSTALL
async function startMinerInstall(minerName: string): Promise<boolean> {
    const cmd = `${cmdInstallMiner} ${minerName} --daemon start`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return !!ret;
}


async function stopMinerInstall(minerName: string): Promise<boolean> {
    const cmd = `${cmdInstallMiner} ${minerName} --daemon stop`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return !!ret;
}


async function getMinerInstallStatus(minerName: string): Promise<boolean> {
    const cmd = `${cmdInstallMiner} ${minerName} --daemon status`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return !!ret;
}


async function getMinerInstallLogs(minerName: string): Promise<string> {
    const cmd = `${cmdInstallMiner} ${minerName} --daemon log -n 50`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return ret || '';
}


// MINER UNINSTALL
async function startMinerUninstall(minerName: string): Promise<boolean> {
    const cmd = `${cmdUninstallMiner} ${minerName} -y`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return !!ret;
}


async function stopMinerUninstall(minerName: string): Promise<boolean> {
    //const cmd = `${cmdUninstallMiner} ${minerName} --daemon stop`;
    return false;
}


async function getMinerUninstallStatus(minerName: string): Promise<boolean> {
    //const cmd = `${cmdUninstallMiner} ${minerName} --daemon status`;
    return false;
}


async function getMinerUninstallLogs(minerName: string): Promise<string> {
    //const cmd = `${cmdUninstallMiner} ${minerName} log -n 50`;
    return '';
}



// MISC

function getAllMiners() {
    const miners = installablesMiners;
    return miners;
}

function getRunnableMiners() {
    const installedMiners = getInstalledMiners();
    const miners = installedMiners.filter(miner => configuredMiners.includes(miner));
    return miners;
}


async function getRigProcesses(): Promise<string> {
    const cmd = rigManagerCmd;
    const result = await cmdExec(cmd, 2_000);
    return result || '';
}


function loadTemplate(tplFile: string, data: any={}, currentUrl:string='', withLayout: boolean=true): string {
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

    if (withLayout) {
        content = applyHtmlLayout(content, data, layoutPath, currentUrl) || '';

    }

    return content;
}


function getInstalledMiners(): string[] {
    // TODO: prevoir de rafraichir la liste en live (cf en cas d'install/desinstall de miners)
    if (installedMiners === null) {
        installedMiners = (process.env.INSTALLED_MINERS || '').split(' ');
    }
    return installedMiners;
}

