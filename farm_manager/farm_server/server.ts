
import fs from 'fs';
import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import colors from 'colors/safe';


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


const config: any = require('../farm_manager.json');

const wsServerHost = config.farmServer?.host || '0.0.0.0';
const wsServerPort = config.farmServer?.port || 4200;

const allowedIps = config.farmServer?.wsAllowedIps || [];
const serverConnTimeout = 10_000;

const templatesDir = `${__dirname}/web/templates`;


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


const rigs: {[key:string]: Rig} = {};

const wsClients: {[key:string]: wsClient} = {};

//app.use(bodyParser());
app.use(express.urlencoded());

app.use(express.static(__dirname + '/web/public'));


app.get('/', (req: express.Request, res: express.Response, next: Function) => {

    const opts = {
        meta: {
            title: '',
            noIndex: false,
        },
        currentUrl: req.url,
        body: {
            content: 'welcome',
        }
    };

    const layoutTemplate = fs.readFileSync(`${templatesDir}/layout.html`).toString();
    let pageContent = stringTemplate(layoutTemplate, opts);

    res.send( pageContent );
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

    const layoutTemplate = fs.readFileSync(`${templatesDir}/layout.html`).toString();
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
            rigs,
            miners,
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

        const layoutTemplate = fs.readFileSync(`${templatesDir}/layout.html`).toString();
        let pageContent = stringTemplate(layoutTemplate, opts);

        res.send( pageContent );
        res.end();
    }

    res.end();
});



app.post('/rigs/rig/service/start', (req: express.Request, res: express.Response, next: Function) => {
    // TODO: check client ip

    const rigName = req.body.rig;
    const serviceName = req.body.service;

    const algo = req.body.algo || '';
    const service = req.body.service || '';
    const poolUrl = req.body.poolUrl || '';
    const poolAccount = req.body.poolAccount || '';
    const workerName = req.body.workerName || '';
    const optionnalParams = req.body.optionnalParams || '';

    const wsClient = Object.values(wsClients).filter(_wsClient => _wsClient.rigName === rigName).shift();

    const params = {
        //coin: '',
        algo,
        service,
        poolUrl,
        poolAccount,
        workerName,
        optionnalParams,
    };
    const paramsJson = JSON.stringify(params);

    if (wsClient && serviceName) {
        wsClient.ws.send(`service start ${serviceName} ${paramsJson}`);

        res.send('OK');
        return;
    }
    res.send('KO');
});


app.post('/rigs/rig/service/stop', (req: express.Request, res: express.Response, next: Function) => {
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


app.post('/rigs/rig/service/kill', (req: express.Request, res: express.Response, next: Function) => {
    // TODO: check client ip

    const rigName = req.body.rig;
    const serviceName = req.body.service;

    const wsClient = Object.values(wsClients).filter(_wsClient => _wsClient.rigName === rigName).shift();

    if (wsClient && serviceName) {
        wsClient.ws.send(`service kill ${serviceName}`);

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



server.listen(wsServerPort, wsServerHost, () => {
    console.log(`${now()} [${colors.blue('INFO')}] Server started on ${wsServerHost}:${wsServerPort}`);
});


// Send a message every x seconds to all clients
//setInterval(function hello() {
//    wss.clients.forEach(function ping(ws: any) {
//        ws.send(`hello client, are you fine ?`);
//    });
//}, 7_000);




function stringTemplate(text: string, params: any, ignoreErrors=false) {
    params.formatNumber = formatNumber;

    try {
        const names = Object.keys(params);
        const vals = Object.values(params);
        return new Function(...names, `return \`${text}\`;`)(...vals);

    } catch (err) {
        if (ignoreErrors) {
            return null;
        }
        throw err;
    }
}


function formatNumber(n: number) {
    return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format(n);
}



function now(): string {
    const options: {hour:string|any, minute:string|any, second:string|any} = {
        /* year: "numeric", month: "2-digit", day: "2-digit", */
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    }
    return new Date().toLocaleTimeString("fr-FR", options);
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
