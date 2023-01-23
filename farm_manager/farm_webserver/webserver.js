"use strict";
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const express_1 = tslib_1.__importDefault(require("express"));
const http = tslib_1.__importStar(require("http"));
const WebSocket = tslib_1.__importStar(require("ws"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const utils_1 = require("./common/utils");
/* ############################## MAIN ###################################### */
const app = (0, express_1.default)();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const configFarm = require('../farm_manager.json');
const configFrm = require('../../freemining.json');
const wsServerHost = ((_a = configFarm.farmServer) === null || _a === void 0 ? void 0 : _a.host) || '0.0.0.0';
const wsServerPort = ((_b = configFarm.farmServer) === null || _b === void 0 ? void 0 : _b.port) || 4200;
const allowedIps = ((_c = configFarm.farmServer) === null || _c === void 0 ? void 0 : _c.wsAllowedIps) || [];
const serverConnTimeout = 10000;
let staticDir = ((_d = configFarm.farmServer) === null || _d === void 0 ? void 0 : _d.root) || `${__dirname}/web/public`;
let templatesDir = ((_e = configFarm.farmServer) === null || _e === void 0 ? void 0 : _e.templates) || `${__dirname}/web/templates`;
const farmAppDir = __dirname + '/..'; // configFrm.frmDataDir + '/farm';
const ctx = Object.assign(Object.assign(Object.assign({}, configFrm), configFarm), { farmAppDir });
templatesDir = (0, utils_1.stringTemplate)(templatesDir, ctx, false, true, true) || '';
staticDir = (0, utils_1.stringTemplate)(staticDir, ctx, false, true, true) || '';
const layoutPath = `${templatesDir}/layout_farm_webserver.html`;
const farmManagerCmd = `${__dirname}/../farm_manager.sh ps`;
const websocketPassword = 'xxx'; // password required to connect to the websocket
const rigs = {};
const rigsConfigs = {};
const wsClients = {};
app.use(function (req, res, next) {
    // Log http request
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] ${req.method.toLocaleUpperCase()} ${req.url}`);
    next();
});
app.use(express_1.default.urlencoded({ extended: true }));
console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Using static folder ${staticDir}`);
app.use(express_1.default.static(staticDir));
app.get('/', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const activeProcesses = yield getFarmProcesses();
    const opts = {
        configFarm,
        activeProcesses,
    };
    const pageContent = loadTemplate('index.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
app.get('/status.json', (req, res, next) => {
    res.header({ 'Content-Type': 'application/json' });
    const rigsStatuses = getLastRigsJsonStatus();
    res.send(JSON.stringify(rigsStatuses));
    res.end();
});
app.get('/rigs/', (req, res, next) => {
    const rigsStatuses = getLastRigsJsonStatus();
    const tplData = {
        rigs: rigsStatuses,
    };
    const tplHtml = fs_1.default.readFileSync(`${templatesDir}/rigs.html`).toString();
    const content = (0, utils_1.stringTemplate)(tplHtml, tplData);
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
    const layoutTemplate = fs_1.default.readFileSync(`${templatesDir}/layout_farm_webserver.html`).toString();
    let pageContent = (0, utils_1.stringTemplate)(layoutTemplate, opts);
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
            presets: configFarm.pools || {},
            rigPresets: (rigsConfigs[rigName] || {}).pools || {},
            farmRigPresets: ((configFarm.rigs || {})[rigName] || {}).pools || {},
            rigs,
            miners,
            rigName,
            workerName: rigName,
        };
        const tplHtml = fs_1.default.readFileSync(`${templatesDir}/rig.html`).toString();
        const content = (0, utils_1.stringTemplate)(tplHtml, tplData);
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
        const layoutTemplate = fs_1.default.readFileSync(`${templatesDir}/layout_farm_webserver.html`).toString();
        let pageContent = (0, utils_1.stringTemplate)(layoutTemplate, opts);
        res.send(pageContent);
        res.end();
    }
    res.end();
});
app.post('/api/rigs/rig/service/start', (req, res, next) => {
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
app.post('/api/rigs/rig/service/stop', (req, res, next) => {
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
        console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] rejecting client ${clientIP} for non allowed IP`);
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
        console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] received message of ${message.length} characters from ${safe_1.default.cyan(tmpRigName)} (${clientIP})`);
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
                console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] refusing client ${clientIP} for invalid name`);
                ws.close();
                //setRigOffline(clientIP??); // TODO
            }
            if (rigName && rigPass == websocketPassword) {
                wsClients[rigName] = ws.auth = {
                    rigName: rigName,
                    ip: clientIP,
                    ws,
                };
                ws.send('welcome');
                // TODO: empecher les multiples connexions d'un meme rig/agent
            }
            else {
                console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] refusing client ${clientIP} for invalid credentials`);
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
            console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] refusing client ${clientIP} for message before auth`);
            ws.send('ERROR: missing auth');
            ws.close();
            //setRigOffline(clientIP??); // TODO
            return;
        }
        const rigName = ws.auth.rigName;
        if (action === 'kick') {
            console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}]: ejecting client ${clientIP} for kick`);
            ws.close();
            //setRigOffline(clientIP??); // TODO
        }
        else if (action === 'rigConfig') {
            try {
                // parse status an,d store into 'rigs' variable
                const rigConfig = JSON.parse(argsStr);
                if (!rigConfig) {
                    console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] received invalid config from ${clientIP}`);
                    return;
                }
                rigConfig.farmDate = Math.round((new Date).getTime() / 1000);
                rigsConfigs[rigName] = rigConfig;
            }
            catch (err) {
                console.error(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] received invalid rigConfig from ${clientIP} => ${err.message}`);
            }
        }
        else if (action === 'rigStatus') {
            try {
                // parse status an,d store into 'rigs' variable
                const status = JSON.parse(argsStr);
                if (!status) {
                    console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] received invalid status from ${clientIP}`);
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
            }
            catch (err) {
                console.error(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] received invalid rigStatus from ${clientIP} => ${err.message}`);
            }
        }
    });
    // Handle connection close
    ws.on('close', function message(data) {
        console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] client ${clientIP} disconnected`);
        //setRigOffline(clientIP??); // TODO
    });
    // Send a welcome message
    ws.send('info Welcome on OpenMine websocket. Please auth first');
});
server.listen(wsServerPort, wsServerHost, () => {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Server started on ${wsServerHost}:${wsServerPort}`);
});
// Handle connections heartbeat
const interval = setInterval(function pings() {
    // ping each client...
    wss.clients.forEach(function ping(ws) {
        let clientIP = ws._socket.remoteAddress;
        if (ws.pongOk === false) {
            console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] ejecting client for inactivity`);
            //console.log(`${now()} [${colors.yellow('WARNING')}] ejecting client ${ws.ip} for inactivity`);
            //setRigOffline(clientIP??); // TODO
            return ws.terminate();
        }
        ws.pongOk = false;
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
function loadTemplate(tplFile, data = {}, currentUrl = '') {
    const tplPath = `${templatesDir}/${tplFile}`;
    if (!fs_1.default.existsSync(tplPath)) {
        return null;
    }
    let content = '';
    try {
        const layoutTemplate = fs_1.default.readFileSync(tplPath).toString();
        content = (0, utils_1.stringTemplate)(layoutTemplate, data) || '';
    }
    catch (err) {
        content = `Error: ${err.message}`;
    }
    const pageContent = (0, utils_1.applyHtmlLayout)(content, data, layoutPath, currentUrl);
    return pageContent;
}
function getFarmProcesses() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = farmManagerCmd;
        const result = yield (0, utils_1.cmdExec)(cmd);
        return result || '';
    });
}
function getLastRigsJsonStatus() {
    const rigsStatuses = {};
    let rigName;
    for (rigName in rigs) {
        rigsStatuses[rigName] = getLastRigJsonStatus(rigName);
    }
    return rigsStatuses;
}
function getLastRigJsonStatus(rigName) {
    const rigStatusJson = rigs[rigName];
    if (!rigStatusJson) {
        return null;
    }
    const _rigStatusJson = Object.assign({}, rigStatusJson);
    _rigStatusJson.dataAge = !(rigStatusJson === null || rigStatusJson === void 0 ? void 0 : rigStatusJson.dataDate) ? undefined : Math.round(Date.now() / 1000 - rigStatusJson.dataDate);
    return _rigStatusJson;
}
