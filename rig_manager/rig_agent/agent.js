"use strict";
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const express_1 = tslib_1.__importDefault(require("express"));
const http = tslib_1.__importStar(require("http"));
const ws_1 = tslib_1.__importDefault(require("ws"));
const os_1 = tslib_1.__importDefault(require("os"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const utils_1 = require("./common/utils");
/* ############################## MAIN ###################################### */
const configFrm = require('../../freemining.json');
let rigConfigPath = configFrm.frmConfDir + '/rig/rig_manager.json';
rigConfigPath = (0, utils_1.stringTemplate)(rigConfigPath, {}, false, true, true) || '';
if (!fs_1.default.existsSync(rigConfigPath)) {
    rigConfigPath = '../rig_manager.json';
}
const configRig = require(rigConfigPath);
// Init HTTP Webserver
const app = (0, express_1.default)();
const server = http.createServer(app);
const httpServerHost = ((_a = configRig.rigWebServer) === null || _a === void 0 ? void 0 : _a.host) || '0.0.0.0';
const httpServerPort = Number(((_b = configRig.rigWebServer) === null || _b === void 0 ? void 0 : _b.port) || 4300);
let staticDir = ((_c = configRig.rigWebServer) === null || _c === void 0 ? void 0 : _c.root) || `${__dirname}/web/public`;
let templatesDir = ((_d = configRig.rigWebServer) === null || _d === void 0 ? void 0 : _d.templates) || `${__dirname}/web/templates`;
const rigAppDir = __dirname + '/..'; // configFrm.frmDataDir + '/rig';
const ctx = Object.assign(Object.assign(Object.assign({}, configFrm), configRig), { rigAppDir });
templatesDir = (0, utils_1.stringTemplate)(templatesDir, ctx, false, true, true);
staticDir = (0, utils_1.stringTemplate)(staticDir, ctx, false, true, true);
const layoutPath = `${templatesDir}/layout_rig_agent.html`;
const rigName = configRig.rigName || os_1.default.hostname();
const websocketPassword = 'xxx'; // password to access farm websocket server
const rigManagerCmd = `${__dirname}/../rig_manager.sh ps`;
console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Starting Rig ${rigName}`);
app.use(express_1.default.urlencoded({ extended: true }));
console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Using static folder ${staticDir}`);
app.use(express_1.default.static(staticDir));
app.get('/', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    if (!rigStatus) {
        res.send(`Rig not initialized`);
        res.end();
        return;
    }
    const activeProcesses = yield getRigProcesses();
    const installedMiners = (process.env.CONFIGURED_MINERS || '').split(' ');
    const installablesMiners = (process.env.INSTALLED_MINERS || '').split(' ');
    const opts = {
        rigName,
        rig: rigStatus,
        miners: getMiners(),
        rigs: [],
        activeProcesses,
        installedMiners,
        installablesMiners,
    };
    const pageContent = loadTemplate('index.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
app.get('/status', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    if (!rigStatus) {
        res.send(`Rig not initialized`);
        res.end();
        return;
    }
    const presets = configRig.pools || {};
    const opts = {
        rigName,
        rig: rigStatus,
        miners: getMiners(),
        rigs: [],
        presets,
    };
    const pageContent = loadTemplate('status.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
app.get('/status.json', (req, res, next) => {
    res.header({ 'Content-Type': 'application/json' });
    res.send(JSON.stringify(rigStatus));
    res.end();
});
app.get('/miners/miner', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const miner = req.query.miner || '';
    const asJson = req.query.json === "1";
    const rawOutput = req.query.raw === "1";
    const minerStatus = yield getRigServiceStatus(miner, asJson ? '-json' : '-txt');
    if (rawOutput) {
        if (asJson) {
            res.header({ "Content-Type": "application/json" });
        }
        else {
            res.header({ "Content-Type": "text/plain" });
        }
        res.send(minerStatus);
        res.end();
        return;
    }
    const opts = {
        configRig,
        miner,
        minerStatus,
    };
    const pageContent = loadTemplate('miner.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
app.post('/api/rig/service/start', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
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
    const ok = yield startRigService(serviceName, params);
}));
app.post('/api/rig/service/stop', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const serviceName = req.body.service;
    const ok = yield stopRigService(serviceName);
}));
app.use(function (req, res, next) {
    // Error 404
    console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);
    next();
});
server.listen(httpServerPort, httpServerHost, () => {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Server started on ${httpServerHost}:${httpServerPort}`);
});
// Init Websocket Cliennt
const wsServerHost = ((_e = configRig.farmServer) === null || _e === void 0 ? void 0 : _e.host) || null;
const wsServerPort = ((_f = configRig.farmServer) === null || _f === void 0 ? void 0 : _f.port) || 4200;
const serverConnTimeout = 10000; // si pas de réponse d'un client au bout de x millisecondes on le déconnecte
const serverNewConnDelay = 10000; // attend x millisecondes avant de se reconnecter (en cas de déconnexion)
const checkStatusInterval = 10000; // verifie le statut du rig toutes les x millisecondes
const sendStatusInterval = 10000; // envoie le (dernier) statut du rig au farmServer toutes les x millisecondes
let checkStatusTimeout = null;
let connectionCount = 0;
const toolsDir = `${__dirname}/../tools`;
const cmdService = `${toolsDir}/run_miner.sh`;
const cmdRigMonitorJson = `${toolsDir}/rig_monitor_json.sh`;
let rigStatus = null;
main();
/* ############################ FUNCTIONS ################################### */
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield checkStatus();
        if (wsServerHost) {
            // connect to websocket server
            websocketConnect();
        }
        if (false) {
            // run local webserver
            // TODO
        }
    });
}
function loadTemplate(tplFile, data = {}, currentUrl = '') {
    const tplPath = `${templatesDir}/${tplFile}`;
    if (!fs_1.default.existsSync(tplPath)) {
        return null;
    }
    const layoutTemplate = fs_1.default.readFileSync(tplPath).toString();
    let content = (0, utils_1.stringTemplate)(layoutTemplate, data) || '';
    const pageContent = (0, utils_1.applyHtmlLayout)(content, data, layoutPath, currentUrl);
    return pageContent;
}
function websocketConnect() {
    let sendStatusTimeout = null;
    let newConnectionTimeout = null;
    const connectionId = connectionCount++;
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] connecting to websocket server... [conn ${connectionId}]`);
    let ws;
    try {
        ws = new ws_1.default(`ws://${wsServerHost}:${wsServerPort}/`);
    }
    catch (err) {
        console.log(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}] cannot connect to websocket server [conn ${connectionId}]`);
        if (newConnectionTimeout === null) {
            newConnectionTimeout = setTimeout(() => websocketConnect(), serverNewConnDelay);
        }
        return;
    }
    ws.on('error', function (err) {
        console.log(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}] connection error with websocket server => ${err.message} [conn ${connectionId}]`);
        ws.terminate();
    });
    ws.on('open', function open() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Prepare connection heartbeat
            heartbeat.call(this);
            // Send auth
            ws.send(`auth ${rigName} ${websocketPassword}`);
            // Send rig config
            console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] sending rigConfig to server (open) [conn ${connectionId}]`);
            ws.send(`rigConfig ${JSON.stringify(configRig)}`);
            // Send rig status
            if (rigStatus) {
                console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] sending rigStatus to server (open) [conn ${connectionId}]`);
                ws.send(`rigStatus ${JSON.stringify(rigStatus)}`);
            }
            else {
                console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] cannot send rigStatus to server (open) [conn ${connectionId}]`);
            }
            // send rig status every 10 seconds
            if (sendStatusTimeout === null) {
                sendStatusTimeout = setTimeout(hello, sendStatusInterval);
            }
        });
    });
    // Handle connections heartbeat
    ws.on('ping', function ping() {
        // received a ping from the server
        heartbeat.call(this);
    });
    // Handle incoming message from server
    ws.on('message', function message(data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const message = data.toString();
            console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] received: ${message} [conn ${connectionId}]`);
            const args = message.split(' ');
            if (args[0] === 'service') {
                if (args[1] === 'start') {
                    args.shift();
                    args.shift();
                    const serviceName = args.shift();
                    if (serviceName && args.length > 0) {
                        const paramsJson = args.join(' ');
                        let params;
                        try {
                            params = JSON.parse(paramsJson);
                        }
                        catch (err) {
                            console.error(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}] cannot start service : ${err.message}`);
                            return;
                        }
                        const ok = yield startRigService(serviceName, params);
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
    });
    // Handle connection close
    ws.on('close', function close() {
        console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] disconnected from server [conn ${connectionId}]`);
        if (sendStatusTimeout) {
            clearTimeout(sendStatusTimeout);
            sendStatusTimeout = null;
        }
        //process.exit();
        // handle reconnection
        if (newConnectionTimeout === null) {
            newConnectionTimeout = setTimeout(() => websocketConnect(), 10000);
        }
    });
    function heartbeat() {
        clearTimeout(this.pingTimeout);
        // Use `WebSocket#terminate()`, which immediately destroys the connection,
        // instead of `WebSocket#close()`, which waits for the close timer.
        // Delay should be equal to the interval at which your server
        // sends out pings plus a conservative assumption of the latency.
        this.pingTimeout = setTimeout(() => {
            console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] terminate connection with the server [conn ${connectionId}]`);
            this.terminate();
            if (newConnectionTimeout === null) {
                newConnectionTimeout = setTimeout(() => websocketConnect(), 5000);
            }
        }, serverConnTimeout + 1000);
    }
    function hello() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            sendStatusTimeout = null;
            if (rigStatus) {
                if (ws.readyState === ws_1.default.OPEN) {
                    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] sending rigStatus to server (hello) [conn ${connectionId}]`);
                    ws.send(`rigStatus ${JSON.stringify(rigStatus)}`);
                    var debugSentData = JSON.stringify(rigStatus);
                    var debugme = 1;
                }
                else {
                    console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] cannot send rigStatus to server (hello. ws closed) [conn ${connectionId}]`);
                    ws.close();
                    return;
                }
            }
            else {
                console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] cannot send rigStatus to server (hello. no status available) [conn ${connectionId}]`);
                ws.close();
                return;
            }
            sendStatusTimeout = setTimeout(hello, 10000);
        });
    }
    return ws;
}
function startRigService(serviceName, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // TODO: prevoir une version full nodejs (et compatible windows)
        const cmd = `${cmdService} start ${serviceName} -algo "${params.algo}" -url "${params.poolUrl}" -user "${params.poolAccount}" ${params.optionalParams ? ("-- " + params.optionalParams) : ""}`;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        const ret = yield (0, utils_1.cmdExec)(cmd);
        if (ret) {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ${ret}`);
        }
        else {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ERROR`);
        }
        return !!ret;
    });
}
function stopRigService(serviceName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // TODO: prevoir une version full nodejs (et compatible windows)
        const cmd = `${cmdService} stop ${serviceName}`;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        const ret = yield (0, utils_1.cmdExec)(cmd);
        if (ret) {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ${ret}`);
        }
        else {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ERROR`);
        }
        return !!ret;
    });
}
function getRigServiceStatus(serviceName, option = '') {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // TODO: prevoir une version full nodejs (et compatible windows)
        const cmd = `${cmdService} status${option} ${serviceName}`;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        let ret = (yield (0, utils_1.cmdExec)(cmd)) || '';
        if (ret) {
            ret = ret.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors
        }
        return ret || '';
    });
}
function getRigStatus() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = cmdRigMonitorJson;
        const statusJson = yield (0, utils_1.cmdExec)(cmd);
        if (statusJson) {
            try {
                const _rigStatus = JSON.parse(statusJson);
                return _rigStatus;
            }
            catch (err) {
                console.error(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}] cannot read rig status (invalid shell response)`);
                console.debug(statusJson);
            }
        }
        else {
            console.log(`${(0, utils_1.now)()} [${safe_1.default.red('WAWRNING')}] cannot read rig status (no response from shell)`);
        }
        return null;
    });
}
function checkStatus() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] refreshing rigStatus`);
        checkStatusTimeout = null;
        rigStatus = yield getRigStatus();
        // poll services every x seconds
        checkStatusTimeout = setTimeout(checkStatus, checkStatusInterval);
    });
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
function getRigProcesses() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = rigManagerCmd;
        const result = yield (0, utils_1.cmdExec)(cmd);
        return result || '';
    });
}
