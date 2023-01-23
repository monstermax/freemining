
import fs from 'fs';
import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
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



type wsClient = any;



/* ############################## MAIN ###################################### */


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


const configFarm: any = require('../farm_manager.json');
const configFrm: any = require('../../freemining.json');

const wsServerHost = configFarm.farmServer?.host || '0.0.0.0';
const wsServerPort = configFarm.farmServer?.port || 4200;

const allowedIps = configFarm.farmServer?.wsAllowedIps || [];
const serverConnTimeout = 10_000;

let staticDir = configFarm.farmServer?.root || `${__dirname}/web/public`;
let templatesDir = configFarm.farmServer?.templates || `${__dirname}/web/templates`;

const farmAppDir = __dirname + '/..'; // configFrm.frmDataDir + '/farm';
const ctx: any = {
    ...configFrm,
    ...configFarm,
    farmAppDir,
};
templatesDir = stringTemplate(templatesDir, ctx, false, true, true) || '';
staticDir = stringTemplate(staticDir, ctx, false, true, true) || '';

const layoutPath = `${templatesDir}/layout_farm_webserver.html`;

const farmManagerCmd = `${__dirname}/../farm_manager.sh ps`;

const websocketPassword = 'xxx'; // password required to connect to the websocket


const rigs: {[key:string]: RigStatusJson} = {};
const rigsConfigs: {[key:string]: any} = {};

const wsClients: {[key:string]: wsClient} = {};

app.use(express.urlencoded({ extended: true }));

console.log(`${now()} [${colors.blue('INFO')}] Using static folder ${staticDir}`);
app.use(express.static(staticDir));



app.get('/', async (req: express.Request, res: express.Response, next: Function) => {
    const activeProcesses: string = await getFarmProcesses();

    const opts = {
        configFarm,
        activeProcesses,
    };

    const pageContent = loadTemplate('index.html', opts, req.url);
    res.send(pageContent);
    res.end();
});


app.get('/status.json', (req: express.Request, res: express.Response, next: Function) => {
    res.header({'Content-Type': 'application/json'});

    const rigsStatuses = getLastRigsJsonStatus();

    res.send( JSON.stringify(rigsStatuses) );
    res.end();
});


app.get('/rigs/', (req: express.Request, res: express.Response, next: Function) => {

    const rigsStatuses = getLastRigsJsonStatus();

    const tplData = {
        rigs:rigsStatuses,
    };

    const tplHtml = fs.readFileSync(`${templatesDir}/rigs.html`).toString();
    const content = stringTemplate(tplHtml, tplData);

    const opts = {
        meta: {
            title: '',
            noIndex: false,
        },
        currentUrl: req.url,
        body: {
            content,
        },
        data: {
            rigs: rigsStatuses,
        }
    };

    const layoutTemplate = fs.readFileSync(`${templatesDir}/layout_farm_webserver.html`).toString();
    let pageContent = stringTemplate(layoutTemplate, opts);

    res.send( pageContent );
    res.end();
});


app.get('/rigs/rig', (req: express.Request, res: express.Response, next: Function) => {
    const rigName: string = req.query.rig as string;
    const miners = getMiners();

    if (rigName in rigs) {
        const rig = rigs[rigName];

        const tplData = {
            rig,
            presets: configFarm.pools || {},
            rigPresets: (rigsConfigs[rigName] || {}).pools || {},
            farmRigPresets: ((configFarm.rigs || {})[rigName] || {}).pools || {},
            rigs,
            miners,
            rigName,
            workerName: rigName,
        };

        const tplHtml = fs.readFileSync(`${templatesDir}/rig.html`).toString();
        const content = stringTemplate(tplHtml, tplData);

        const opts = {
            meta: {
                title: '',
                noIndex: false,
            },
            currentUrl: req.url,
            body: {
                content,
            },
            data: {
            }
        };

        const layoutTemplate = fs.readFileSync(`${templatesDir}/layout_farm_webserver.html`).toString();
        let pageContent = stringTemplate(layoutTemplate, opts);

        res.send( pageContent );
        res.end();
    }

    res.end();
});



app.post('/api/rigs/rig/service/start', (req: express.Request, res: express.Response, next: Function) => {
    // TODO: check client ip

    const rigName = req.body.rig;
    const serviceName = req.body.service;

    const algo = req.body.algo || '';
    const service = req.body.service || '';
    const poolUrl = req.body.poolUrl || '';
    const poolAccount = req.body.poolAccount || '';
    const optionalParams = req.body.optionalParams || '';

    const wsClient = Object.values(wsClients).filter(_wsClient => _wsClient.rigName === rigName).shift();

    const params = {
        //coin: '',
        algo,
        service,
        poolUrl,
        poolAccount,
        optionalParams,
    };
    const paramsJson = JSON.stringify(params);

    if (wsClient && serviceName) {
        wsClient.ws.send(`service start ${serviceName} ${paramsJson}`);

        res.send('OK');
        return;
    }
    res.send('KO');
});


app.post('/api/rigs/rig/service/stop', (req: express.Request, res: express.Response, next: Function) => {
    // TODO: check client ip

    const rigName = req.body.rig;
    const serviceName = req.body.service;

    const wsClient = Object.values(wsClients).filter(_wsClient => _wsClient.rigName === rigName).shift();

    if (wsClient && serviceName) {
        wsClient.ws.send(`service stop ${serviceName}`);

        res.send('OK');
        return;
    }
    res.send('KO');
});



function getWsClientIp(req: express.Request) {
    let clientIP = ((req as any).headers['x-forwarded-for'] as string || '').split(',')[0].trim(); // reverse-proxified IP address

    if (! clientIP) {
        clientIP = req.socket?.remoteAddress || ''; // direct IP address
    }

    return clientIP;
}


wss.on('connection', function connection(ws: WebSocket, req: express.Request) {

    // Prepare connection heartbeat
    (ws as any).pongOk = true;

    // Prepare connection auth
    (ws as any).auth = null;


    // Get client informations
    let clientIP = getWsClientIp(req);

    if (allowedIps.length > 0 && ! allowedIps.includes(clientIP)) {
        //ws.send('ERROR: not authorized');
        //setRigOffline(clientIP??); // TODO
        console.log(`${now()} [${colors.yellow('WARNING')}] rejecting client ${clientIP} for non allowed IP`);
        ws.close();
        return;
    }


    ws.on('pong', function pong(this: any) {
        // Received pong from client
        this.pongOk = true;
    });


    // Handle incoming message from client
    ws.on('message', function message(data: Buffer) {
        const message = data.toString();
        const tmpRigName = (ws as any).auth?.rigName || 'anonymous';
        console.log(`${now()} [${colors.blue('INFO')}] received message of ${message.length} characters from ${colors.cyan(tmpRigName)} (${clientIP})`);
        //console.log(`${now()} [${colors.blue('INFO')}] received message of ${message.length} characters from ${clientIP}`);

        const args = message.split(' ');
        const action = args.shift();
        const argsStr = args.join(' ');

        if (action === 'auth' && ! (ws as any).auth) {
            // auth...
            const rigName = args[0];
            const rigPass = args[1];

            const isNameValid = /^[a-zA-Z0-9_][a-zA-Z0-9_.-]+$/.test(rigName);

            if (! isNameValid) {
                console.log(`${now()} [${colors.yellow('WARNING')}] refusing client ${clientIP} for invalid name`);
                ws.close();
                //setRigOffline(clientIP??); // TODO
            }

            if (rigName && rigPass == websocketPassword) {
                wsClients[rigName] = (ws as any).auth = {
                    rigName: rigName,
                    ip: clientIP,
                    ws,
                };
                ws.send('welcome');

                // TODO: empecher les multiples connexions d'un meme rig/agent

            } else {
                console.log(`${now()} [${colors.yellow('WARNING')}] refusing client ${clientIP} for invalid credentials`);
                ws.send('ERROR: missing credentials');
                ws.close();
                //setRigOffline(clientIP??); // TODO
                return;
            }

        } else if (action === 'auth' && (ws as any).auth) {
            // error?: already auth
            return;

        } else if (action !== 'auth' && !(ws as any).auth) {
            // error: not auth
            console.log(`${now()} [${colors.yellow('WARNING')}] refusing client ${clientIP} for message before auth`);
            ws.send('ERROR: missing auth');
            ws.close();
            //setRigOffline(clientIP??); // TODO
            return;
        }

        const rigName: string = (ws as any).auth.rigName;


        if (action === 'kick') {
            console.log(`${now()} [${colors.yellow('WARNING')}]: ejecting client ${clientIP} for kick`);
            ws.close();
            //setRigOffline(clientIP??); // TODO

        } else if (action === 'rigConfig') {
            try {
                // parse status an,d store into 'rigs' variable
                const rigConfig = JSON.parse(argsStr);
                if (! rigConfig) {
                    console.log(`${now()} [${colors.yellow('WARNING')}] received invalid config from ${clientIP}`);
                    return;
                }

                rigConfig.farmDate = Math.round((new Date).getTime() / 1000);
                rigsConfigs[rigName] = rigConfig;

            } catch(err: any) {
                console.error(`${now()} [${colors.yellow('WARNING')}] received invalid rigConfig from ${clientIP} => ${err.message}`);
            }

        } else if (action === 'rigStatus') {
            try {
                // parse status an,d store into 'rigs' variable
                const status = JSON.parse(argsStr);
                if (! status) {
                    console.log(`${now()} [${colors.yellow('WARNING')}] received invalid status from ${clientIP}`);
                    return;
                }

                const rigName = status.infos.name || status.infos.hostname;

                if (rigName != wsClients[rigName].rigName) {
                    var debugme = 1;
                }

                status.farmDate = Math.round((new Date).getTime() / 1000);
                rigs[rigName] = status;

                // save to json file
                //fs.writeFileSync('/tmp/farm_rig_' + rigName + '.json', JSON.stringify(status));

            } catch(err: any) {
                console.error(`${now()} [${colors.yellow('WARNING')}] received invalid rigStatus from ${clientIP} => ${err.message}`);
            }
        }

    });


    // Handle connection close
    ws.on('close', function message(data: Buffer) {
        console.log(`${now()} [${colors.blue('INFO')}] client ${clientIP} disconnected`);

        //setRigOffline(clientIP??); // TODO
    });


    // Send a welcome message
    ws.send('info Welcome on OpenMine websocket. Please auth first');
});


server.listen(wsServerPort, wsServerHost, () => {
    console.log(`${now()} [${colors.blue('INFO')}] Server started on ${wsServerHost}:${wsServerPort}`);
});




// Handle connections heartbeat
const interval = setInterval(function pings() {
    // ping each client...
    wss.clients.forEach(function ping(ws: WebSocket | any): void {
        let clientIP = ws._socket.remoteAddress;

        if ((ws as any).pongOk === false) {
            console.log(`${now()} [${colors.yellow('WARNING')}] ejecting client for inactivity`);
            //console.log(`${now()} [${colors.yellow('WARNING')}] ejecting client ${ws.ip} for inactivity`);

            //setRigOffline(clientIP??); // TODO

            return ws.terminate();
        }

        (ws as any).pongOk = false;
        ws.ping();
    });
}, serverConnTimeout);



// Send a message every x seconds to all clients
//setInterval(function hello() {
//    wss.clients.forEach(function ping(ws: any) {
//        ws.send(`hello client, are you fine ?`);
//    });
//}, 7_000);



/* ############################ FUNCTIONS ################################### */


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



function loadTemplate(tplFile: string, data: any={}, currentUrl:string='') {
    const tplPath = `${templatesDir}/${tplFile}`;

    if (! fs.existsSync(tplPath)) {
        return null;
    }

    let content = '';
    try {
        const layoutTemplate = fs.readFileSync(tplPath).toString();
        content = stringTemplate(layoutTemplate, data) || '';

    } catch (err: any) {
        content = `Error: ${err.message}`;
    }

    const pageContent = applyHtmlLayout(content, data, layoutPath, currentUrl);
    return pageContent;
}



async function getFarmProcesses(): Promise<string> {
    const cmd = farmManagerCmd;
    const result = await cmdExec(cmd);
    return result || '';
}


function getLastRigsJsonStatus(): {[key:string]: (RigStatusJson | null)} {
    const rigsStatuses: {[key:string]: (RigStatusJson | null)} = {};
    let rigName: string;

    for (rigName in rigs) {
        rigsStatuses[rigName] = getLastRigJsonStatus(rigName);
    }
    return rigsStatuses;
}

function getLastRigJsonStatus(rigName: string): RigStatusJson | null {
    const rigStatusJson = rigs[rigName];

    if (! rigStatusJson) {
        return null;
    }

    const _rigStatusJson = {
        ...rigStatusJson,
    }
    _rigStatusJson.dataAge = !rigStatusJson?.dataDate ? undefined : Math.round(Date.now()/1000 - rigStatusJson.dataDate);

    return _rigStatusJson;
}
