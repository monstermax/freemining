"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const express_1 = tslib_1.__importDefault(require("express"));
const http = tslib_1.__importStar(require("http"));
const WebSocket = tslib_1.__importStar(require("ws"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const app = (0, express_1.default)();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const config = require('../farm_manager.json');
const wsServerHost = ((_a = config.farmServer) === null || _a === void 0 ? void 0 : _a.host) || '0.0.0.0';
const wsServerPort = ((_b = config.farmServer) === null || _b === void 0 ? void 0 : _b.port) || 4200;
const allowedIps = ((_c = config.farmServer) === null || _c === void 0 ? void 0 : _c.wsAllowedIps) || [];
const serverConnTimeout = 10000;
const templatesDir = `${__dirname}/web/templates`;
const staticDir = `${__dirname}/web/public`;
const rigs = {};
const wsClients = {};
app.use(express_1.default.urlencoded());
app.use(express_1.default.static(staticDir));
app.get('/', (req, res, next) => {
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
    const layoutTemplate = fs_1.default.readFileSync(`${templatesDir}/layout.html`).toString();
    let pageContent = stringTemplate(layoutTemplate, opts);
    res.send(pageContent);
    res.end();
});
app.get('/status.json', (req, res, next) => {
    res.header({ 'Content-Type': 'application/json' });
    let rigsName;
    for (rigsName in rigs) {
        const rigStatus = rigs[rigsName];
        rigStatus.dataAge = !rigStatus.dateFarm ? undefined : Math.round(Date.now() / 1000 - rigStatus.dateFarm);
        rigStatus.rig.dataAge = !rigStatus.rig.dateRig ? undefined : Math.round(Date.now() / 1000 - rigStatus.rig.dateRig);
    }
    res.send(JSON.stringify(rigs));
    res.end();
});
app.get('/rigs/', (req, res, next) => {
    const tplData = {
        rigs,
    };
    const tplHtml = fs_1.default.readFileSync(`${templatesDir}/rigs.html`).toString();
    const content = stringTemplate(tplHtml, tplData);
    const rigsTmp = {} = {};
    let rigsName;
    for (rigsName in rigs) {
        const rigStatus = rigs[rigsName];
        rigStatus.dataAge = !rigStatus.dateFarm ? undefined : Math.round(Date.now() / 1000 - rigStatus.dateFarm);
        rigStatus.rig.dataAge = !rigStatus.rig.dateRig ? undefined : Math.round(Date.now() / 1000 - rigStatus.rig.dateRig);
        rigsTmp[rigsName] = Object.assign({}, rigStatus);
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
    const layoutTemplate = fs_1.default.readFileSync(`${templatesDir}/layout.html`).toString();
    let pageContent = stringTemplate(layoutTemplate, opts);
    res.send(pageContent);
    res.end();
});
app.get('/rigs/rig', (req, res, next) => {
    const rigName = req.query.rig;
    const miners = getMiners();
    if (rigName in rigs) {
        const rig = rigs[rigName];
        const tplData = {
            rig,
            rigs,
            miners,
        };
        const tplHtml = fs_1.default.readFileSync(`${templatesDir}/rig.html`).toString();
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
            data: {}
        };
        const layoutTemplate = fs_1.default.readFileSync(`${templatesDir}/layout.html`).toString();
        let pageContent = stringTemplate(layoutTemplate, opts);
        res.send(pageContent);
        res.end();
    }
    res.end();
});
app.post('/rigs/rig/service/start', (req, res, next) => {
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
app.post('/rigs/rig/service/stop', (req, res, next) => {
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
app.post('/rigs/rig/service/kill', (req, res, next) => {
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
function getWsClientIp(req) {
    var _a;
    let clientIP = (req.headers['x-forwarded-for'] || '').split(',')[0].trim(); // reverse-proxified IP address
    if (!clientIP) {
        clientIP = ((_a = req.socket) === null || _a === void 0 ? void 0 : _a.remoteAddress) || ''; // direct IP address
    }
    return clientIP;
}
wss.on('connection', function connection(ws, req) {
    // Prepare connection heartbeat
    ws.pongOk = true;
    // Prepare connection auth
    ws.auth = null;
    // Get client informations
    let clientIP = getWsClientIp(req);
    if (allowedIps.length > 0 && !allowedIps.includes(clientIP)) {
        //ws.send('ERROR: not authorized');
        //setRigOffline(clientIP??); // TODO
        console.log(`${now()} [${safe_1.default.yellow('WARNING')}] rejecting client ${clientIP} for non allowed IP`);
        ws.close();
        return;
    }
    ws.on('pong', function pong() {
        // Received pong from client
        this.pongOk = true;
    });
    // Handle incoming message from client
    ws.on('message', function message(data) {
        var _a;
        const message = data.toString();
        const tmpRigName = ((_a = ws.auth) === null || _a === void 0 ? void 0 : _a.rigName) || 'anonymous';
        console.log(`${now()} [${safe_1.default.blue('INFO')}] received message of ${message.length} characters from ${safe_1.default.cyan(tmpRigName)} (${clientIP})`);
        //console.log(`${now()} [${colors.blue('INFO')}] received message of ${message.length} characters from ${clientIP}`);
        const args = message.split(' ');
        const action = args.shift();
        const argsStr = args.join(' ');
        if (action === 'auth' && !ws.auth) {
            // auth...
            const rigName = args[0];
            const rigPass = args[1];
            const isNameValid = /^[a-zA-Z0-9_][a-zA-Z0-9_.-]+$/.test(rigName);
            if (!isNameValid) {
                console.log(`${now()} [${safe_1.default.yellow('WARNING')}] refusing client ${clientIP} for invalid name`);
                ws.close();
                //setRigOffline(clientIP??); // TODO
            }
            if (rigName && rigPass) {
                wsClients[rigName] = ws.auth = {
                    rigName: rigName,
                    ip: clientIP,
                    ws,
                };
                ws.send('welcome');
                // TODO: empecher les multiples connexions d'un meme rig/agent
            }
            else {
                console.log(`${now()} [${safe_1.default.yellow('WARNING')}] refusing client ${clientIP} for invalid credentials`);
                ws.send('ERROR: missing credentials');
                ws.close();
                //setRigOffline(clientIP??); // TODO
                return;
            }
        }
        else if (action === 'auth' && ws.auth) {
            // error?: already auth
            return;
        }
        else if (action !== 'auth' && !ws.auth) {
            // error: not auth
            console.log(`${now()} [${safe_1.default.yellow('WARNING')}] refusing client ${clientIP} for message before auth`);
            ws.send('ERROR: missing auth');
            ws.close();
            //setRigOffline(clientIP??); // TODO
            return;
        }
        const rigName = ws.auth.rigName;
        if (action === 'kick') {
            console.log(`${now()} [${safe_1.default.yellow('WARNING')}]: ejecting client ${clientIP} for kick`);
            ws.close();
            //setRigOffline(clientIP??); // TODO
        }
        else if (action === 'rigStatus') {
            try {
                // parse status an,d store into 'rigs' variable
                const status = JSON.parse(argsStr);
                if (!status) {
                    console.log(`${now()} [${safe_1.default.yellow('WARNING')}] received invalid status from ${clientIP}`);
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
            }
            catch (err) {
                console.error(`${now()} [${safe_1.default.yellow('WARNING')}] received invalid rigStatus from ${clientIP} => ${err.message}`);
            }
        }
    });
    // Handle connection close
    ws.on('close', function message(data) {
        console.log(`${now()} [${safe_1.default.blue('INFO')}] client ${clientIP} disconnected`);
        //setRigOffline(clientIP??); // TODO
    });
    // Send a welcome message
    ws.send('info Welcome on OpenMine websocket. Please auth first');
});
// Handle connections heartbeat
const interval = setInterval(function pings() {
    // ping each client...
    wss.clients.forEach(function ping(ws) {
        let clientIP = ws._socket.remoteAddress;
        if (ws.pongOk === false) {
            console.log(`${now()} [${safe_1.default.yellow('WARNING')}] ejecting client for inactivity`);
            //console.log(`${now()} [${colors.yellow('WARNING')}] ejecting client ${ws.ip} for inactivity`);
            //setRigOffline(clientIP??); // TODO
            return ws.terminate();
        }
        ws.pongOk = false;
        ws.ping();
    });
}, serverConnTimeout);
server.listen(wsServerPort, wsServerHost, () => {
    console.log(`${now()} [${safe_1.default.blue('INFO')}] Server started on ${wsServerHost}:${wsServerPort}`);
});
// Send a message every x seconds to all clients
//setInterval(function hello() {
//    wss.clients.forEach(function ping(ws: any) {
//        ws.send(`hello client, are you fine ?`);
//    });
//}, 7_000);
function stringTemplate(text, params, ignoreErrors = false) {
    params.formatNumber = formatNumber;
    try {
        const names = Object.keys(params);
        const vals = Object.values(params);
        return new Function(...names, `return \`${text}\`;`)(...vals);
    }
    catch (err) {
        if (ignoreErrors) {
            return null;
        }
        throw err;
    }
}
function formatNumber(n) {
    return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format(n);
}
function now() {
    const options = {
        /* year: "numeric", month: "2-digit", day: "2-digit", */
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    };
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
