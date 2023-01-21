
import fs from 'fs';
import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import colors from 'colors/safe';

import { now, stringTemplate, applyHtmlLayout } from './common/utils';



/* ############################## TYPES ##################################### */


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
        [key: string]: RigDevice,
    },
    dateRig?: number,
    dataAge?: number,
};

type RigDevice = {
    cpu: {
        name: string,
        threads: number,
    },
    gpu: RigDeviceGpu[],
};

type RigDeviceGpu = {
    id: number,
    name: string,
    driver: string,
}


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


const rigs: {[key:string]: Rig} = {};
const rigsConfigs: {[key:string]: any} = {};

const wsClients: {[key:string]: wsClient} = {};

app.use(express.urlencoded({ extended: true }));

console.log(`${now()} [${colors.blue('INFO')}] Using static folder ${staticDir}`);
app.use(express.static(staticDir));



app.get('/', (req: express.Request, res: express.Response, next: Function) => {
    const pageContent = loadTemplate('index.html', {}, req.url);
    res.send(pageContent);
    res.end();
});


app.get('/status.json', (req: express.Request, res: express.Response, next: Function) => {
    res.header({'Content-Type': 'application/json'});

    let rigsName: string;
    for (rigsName in rigs) {
        const rigStatus: any = rigs[rigsName];
        rigStatus.dataAge = !rigStatus.dateFarm ? undefined : Math.round(Date.now()/1000 - rigStatus.dateFarm);
        rigStatus.rig.dataAge = !rigStatus.rig.dateRig ? undefined : Math.round(Date.now()/1000 - rigStatus.rig.dateRig);
    }


    res.send( JSON.stringify(rigs) );
    res.end();
});


app.get('/rigs/', (req: express.Request, res: express.Response, next: Function) => {

    const tplData = {
        rigs,
    };

    const tplHtml = fs.readFileSync(`${templatesDir}/rigs.html`).toString();
    const content = stringTemplate(tplHtml, tplData);

    const rigsTmp: {[key:string]: Rig} = {} = {};

    let rigsName: string;
    for (rigsName in rigs) {
        const rigStatus: any = rigs[rigsName];
        rigStatus.dataAge = !rigStatus.dateFarm ? undefined : Math.round(Date.now()/1000 - rigStatus.dateFarm);
        rigStatus.rig.dataAge = !rigStatus.rig.dateRig ? undefined : Math.round(Date.now()/1000 - rigStatus.rig.dateRig);

        rigsTmp[rigsName] = {
            ...rigStatus,
        };
    }


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
            rigs: rigsTmp,
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

            if (rigName && rigPass) {
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

                rigConfig.dateFarm = Math.round((new Date).getTime() / 1000);
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

                const rigHostname = status.rig.hostname;

                if (rigHostname != wsClients[rigHostname].rigName) {
                    var debugme = 1;
                }

                if (rigName != rigHostname) {
                    var debugme = 1;
                }

                status.dateFarm = Math.round((new Date).getTime() / 1000);
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
    const layoutTemplate = fs.readFileSync(tplPath).toString();
    let content = stringTemplate(layoutTemplate, data) || '';

    const pageContent = applyHtmlLayout(content, data, layoutPath, currentUrl);
    return pageContent;
}

