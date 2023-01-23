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
let ws;
let sendStatusTimeout = null;
const installablesMiners = (process.env.INSTALLABLE_MINERS || '').split(' ');
const installedMiners = (process.env.INSTALLED_MINERS || '').split(' ');
const configuredMiners = (process.env.CONFIGURED_MINERS || '').split(' ');
const wsServerHost = ((_e = configRig.farmServer) === null || _e === void 0 ? void 0 : _e.host) || null;
const wsServerPort = ((_f = configRig.farmServer) === null || _f === void 0 ? void 0 : _f.port) || 4200;
const serverConnTimeout = 10000; // si pas de réponse d'un client au bout de x millisecondes on le déconnecte
const serverNewConnDelay = 10000; // attend x millisecondes avant de se reconnecter (en cas de déconnexion)
const checkStatusInterval = 10000; // verifie le statut du rig toutes les x millisecondes
const checkStatusIntervalIdle = 30000; // when no service running
const sendStatusInterval = 10000; // envoie le (dernier) statut du rig au farmServer toutes les x millisecondes
//const sendStatusIntervalIdle = 60_000; // when no service running
let checkStatusTimeout = null;
let connectionCount = 0;
const toolsDir = `${__dirname}/../tools`;
const cmdService = `${toolsDir}/run_miner.sh`;
const cmdRigMonitorJson = `${toolsDir}/rig_monitor_json.sh`;
const cmdRigMonitorTxt = `${toolsDir}/rig_monitor_txt.sh`;
let rigStatusJson = null;
let rigStatusTxt = null;
console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Starting Rig ${rigName}`);
app.use(function (req, res, next) {
    // Log http request
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] ${req.method.toLocaleUpperCase()} ${req.url}`);
    next();
});
app.use(express_1.default.urlencoded({ extended: true }));
console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Using static folder ${staticDir}`);
app.use(express_1.default.static(staticDir));
app.get('/', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const activeProcesses = yield getRigProcesses();
    const opts = {
        rigName,
        rig: getLastRigJsonStatus(),
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
    if (!rigStatusJson) {
        res.send(`Rig not initialized`);
        res.end();
        return;
    }
    const presets = configRig.pools || {};
    const opts = {
        rigName,
        rig: getLastRigJsonStatus(),
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
    res.send(JSON.stringify(getLastRigJsonStatus()));
    res.end();
});
app.get('/status.txt', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    res.header({ 'Content-Type': 'text/plain' });
    rigStatusTxt = yield getRigTxtStatus();
    res.send(getLastRigTxtStatus());
    res.end();
}));
app.get('/miners/miner-install', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const minerName = req.query.miner || '';
    const minerStatus = rigStatusJson === null || rigStatusJson === void 0 ? void 0 : rigStatusJson.services[minerName];
    const opts = {
        configRig,
        miner: minerName,
        minerStatus,
        installablesMiners,
        installedMiners,
        configuredMiners,
    };
    const pageContent = loadTemplate('miner_install.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
app.get('/miners/miner-uninstall', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const minerName = req.query.miner || '';
    const minerStatus = rigStatusJson === null || rigStatusJson === void 0 ? void 0 : rigStatusJson.services[minerName];
    const opts = {
        configRig,
        miner: minerName,
        minerStatus,
        installablesMiners,
        installedMiners,
        configuredMiners,
    };
    const pageContent = loadTemplate('miner_uninstall.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
app.get('/miners/miner', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const minerName = req.query.miner || '';
    const minerStatus = rigStatusJson === null || rigStatusJson === void 0 ? void 0 : rigStatusJson.services[minerName];
    const opts = {
        configRig,
        miner: minerName,
        minerStatus,
        installablesMiners,
        installedMiners,
        configuredMiners,
    };
    const pageContent = loadTemplate('miner.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
app.get('/miners/miner-status', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
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
    const pageContent = loadTemplate('miner_status.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
app.post('/api/rig/service/start', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
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
    const ok = yield startRigService(minerName, params);
}));
app.post('/api/rig/service/stop', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const minerName = req.body.service;
    const ok = yield stopRigService(minerName);
}));
app.use(function (req, res, next) {
    // Error 404
    console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);
    next();
});
server.listen(httpServerPort, httpServerHost, () => {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Webserver started on ${httpServerHost}:${httpServerPort}`);
});
main();
/* ############################ FUNCTIONS ################################### */
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield checkStatus(false);
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
        return '';
    }
    let content = '';
    try {
        const layoutTemplate = fs_1.default.readFileSync(tplPath).toString();
        content = (0, utils_1.stringTemplate)(layoutTemplate, data) || '';
    }
    catch (err) {
        content = `Error: ${err.message}`;
    }
    const pageContent = (0, utils_1.applyHtmlLayout)(content, data, layoutPath, currentUrl) || '';
    return pageContent;
}
function websocketConnect() {
    let newConnectionTimeout = null;
    const connectionId = connectionCount++;
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] connecting to websocket server ${wsServerHost}:${wsServerPort} ... [conn ${connectionId}]`);
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
            // Send auth
            ws.send(`auth ${rigName} ${websocketPassword}`);
            // Send rig config
            console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] sending rigConfig to server (open) [conn ${connectionId}]`);
            ws.send(`rigConfig ${JSON.stringify(configRig)}`);
            if (!rigStatusJson) {
                console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] cannot send rigStatusJson to server (open) [conn ${connectionId}]`);
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
            if (args[0] === 'miner-install') {
                // TODO
            }
            else if (args[0] === 'miner-uninstall') {
                // TODO
                //} else if (args[0] === 'get-installed-miners') {
                //    // TODO
            }
            else if (args[0] === 'service') {
                if (args[1] === 'start') {
                    args.shift();
                    args.shift();
                    const minerName = args.shift();
                    if (minerName && args.length > 0) {
                        const paramsJson = args.join(' ');
                        let params;
                        try {
                            params = JSON.parse(paramsJson);
                        }
                        catch (err) {
                            console.error(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}] cannot start service : ${err.message}`);
                            return;
                        }
                        const ok = yield startRigService(minerName, params);
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
    return ws;
}
function startRigService(minerName, params) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // TODO: prevoir une version full nodejs (et compatible windows)
        const cmd = `${cmdService} ${minerName} start -algo "${params.algo}" -url "${params.poolUrl}" -user "${params.poolAccount}" ${params.optionalParams ? ("-- " + params.optionalParams) : ""}`;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        const ret = yield (0, utils_1.cmdExec)(cmd, 10000);
        if (ret) {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ${ret}`);
        }
        else {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ERROR`);
        }
        yield checkStatus();
        return !!ret;
    });
}
function stopRigService(minerName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // TODO: prevoir une version full nodejs (et compatible windows)
        const cmd = `${cmdService} ${minerName} stop`;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        const ret = yield (0, utils_1.cmdExec)(cmd, 10000);
        if (ret) {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ${ret}`);
        }
        else {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ERROR`);
        }
        yield checkStatus();
        return !!ret;
    });
}
function getRigServiceStatus(minerName, option = '') {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // TODO: prevoir une version full nodejs (et compatible windows)
        const cmd = `${cmdService} ${minerName} status${option}`;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        let ret = (yield (0, utils_1.cmdExec)(cmd, 5000)) || '';
        if (ret) {
            ret = ret.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors
        }
        return ret || '';
    });
}
function getLastRigTxtStatus() {
    if (!rigStatusTxt) {
        return null;
    }
    let _rigStatusTxt = rigStatusTxt;
    if (_rigStatusTxt) {
        _rigStatusTxt = _rigStatusTxt.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, ''); // remove shell colors
    }
    return _rigStatusTxt;
}
function getRigTxtStatus() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = cmdRigMonitorTxt;
        // poll services status...
        console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] polling TXT rig status...`);
        const statusTxt = yield (0, utils_1.cmdExec)(cmd, 5000);
        if (statusTxt) {
            console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}]  => rig TXT status OK`);
        }
        else {
            console.error(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}]  => rig TXT status KO. cannot read rig status (no response from shell)`);
        }
        return statusTxt;
    });
}
function getLastRigJsonStatus() {
    if (!rigStatusJson) {
        return null;
    }
    const _rigStatusJson = Object.assign({}, rigStatusJson);
    _rigStatusJson.dataAge = !(rigStatusJson === null || rigStatusJson === void 0 ? void 0 : rigStatusJson.dataDate) ? undefined : Math.round(Date.now() / 1000 - rigStatusJson.dataDate);
    return _rigStatusJson;
}
function getRigJsonStatus() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = cmdRigMonitorJson;
        // poll services status...
        console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] polling JSON rig status...`);
        const statusJson = yield (0, utils_1.cmdExec)(cmd, 5000);
        if (statusJson) {
            try {
                const _rigStatusJson = JSON.parse(statusJson);
                // status is OK
                console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}]  => rig JSON status OK`);
                return _rigStatusJson;
            }
            catch (err) {
                // status ERROR: empty or malformed JSON
                console.error(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}]  => rig JSON status KO. cannot read rig status (invalid shell response)`);
                console.debug(statusJson);
            }
        }
        else {
            // status ERROR: shell command error
            console.log(`${(0, utils_1.now)()} [${safe_1.default.red('WARNING')}]  => rig JSON status KO. cannot read rig status (no response from shell)`);
        }
        return null;
    });
}
function checkStatus(sendStatusToFarm = true) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (checkStatusTimeout) {
            clearTimeout(checkStatusTimeout);
            checkStatusTimeout = null;
        }
        // retrieve current rig status
        rigStatusJson = yield getRigJsonStatus();
        if (sendStatusToFarm) {
            sendStatusSafe();
        }
        // re-check status in {delay} seconds...
        const delay = (!rigStatusJson || Object.keys(rigStatusJson.services).length == 0) ? checkStatusIntervalIdle : checkStatusInterval;
        checkStatusTimeout = setTimeout(checkStatus, delay);
    });
}
function sendStatusSafe() {
    //if (sendStatusTimeout) {
    //    clearTimeout(sendStatusTimeout);
    //    sendStatusTimeout = null;
    //}
    if (rigStatusJson) {
        if (ws.readyState === ws_1.default.OPEN) {
            sendStatus(`(sendStatusSafe)`);
            //var debugSentData = JSON.stringify(rigStatusJson);
            //var debugme = 1;
        }
        else {
            console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] cannot send rigStatusJson to server (sendStatusSafe. ws closed)`);
            ws.close();
            return;
        }
    }
    else {
        console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] cannot send rigStatusJson to server (sendStatusSafe. no status available)`);
        ws.close();
        return;
    }
    //sendStatusTimeout = setTimeout(sendStatusSafe, sendStatusInterval);
}
function sendStatus(debugInfos = '') {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] sending rigStatusJson to server ${debugInfos}`);
    ws.send(`rigStatus ${JSON.stringify(getLastRigJsonStatus())}`);
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
        const result = yield (0, utils_1.cmdExec)(cmd, 2000);
        return result || '';
    });
}
