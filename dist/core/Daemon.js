"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSysInfos = exports.getConfig = exports.run = void 0;
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const path_1 = tslib_1.__importDefault(require("path"));
const http = tslib_1.__importStar(require("http"));
const WebSocket = tslib_1.__importStar(require("ws"));
const ejs = require('ejs');
const Config_1 = require("./Config");
const utils_1 = require("../common/utils");
const sysinfos_1 = require("../common/sysinfos");
const routesCore_1 = require("./http/routesCore");
const routesRig_1 = require("./http/routesRig");
const routesFarm_1 = require("./http/routesFarm");
const routesNode_1 = require("./http/routesNode");
const routesPool_1 = require("./http/routesPool");
const Rig = tslib_1.__importStar(require("../rig/Rig"));
const Node = tslib_1.__importStar(require("../node/Node"));
/* ########## USAGE #########

# Start daemon
./frmd


*/
/* ########## MAIN ######### */
let config;
let quitRunning = false;
const SEP = path_1.default.sep;
let sysInfos = null;
/* ########## FUNCTIONS ######### */
function usage(exitCode = null) {
    const _usage = `======================
| ⛏️   FreeMining  ⛏️  | => frmd
======================

Usage:

frmd <params>
     --help                                  # display this this message
     --user-dir                              # default %HOME%/.freemining-beta OR %HOME%/AppData/Local/freemining-beta
     --listen-address                        # default 127.0.0.1
     --listen-port                           # default 1234
     --wss-conn-timeout                      # default 10 seconds

     -r | --rig-monitor-start                # start rig monitor at freemining start
     -n | --node-monitor-start               # start node monitor at freemining start

     --rig-monitor-poll-delay                # delay between 2 checks of the rig status
     --node-monitor-poll-delay               # delay between 2 checks of the node status

`;
    console.log(_usage);
    if (exitCode !== null) {
        process.exit(exitCode);
    }
}
function run(args = []) {
    if ((0, utils_1.hasOpt)('--help', args)) {
        usage(0);
    }
    catchSignals();
    config = (0, Config_1.loadConfig)(args);
    console.log('daemon start');
    const app = (0, express_1.default)(); // express app
    const server = http.createServer(app); // express server
    const wss = new WebSocket.Server({ server }); // websocket server
    app.engine('html', ejs.renderFile);
    app.set('view engine', 'ejs');
    app.set('views', config.httpTemplatesDir);
    registerHttpRoutes(config, app);
    registerWssRoutes(config, wss);
    server.listen(config.listenPort, config.listenAddress, () => {
        console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [DAEMON] Server started on ${config.listenAddress}:${config.listenPort}`);
    });
    getSysInfos();
}
exports.run = run;
function registerHttpRoutes(config, app) {
    // Log http request
    app.use(function (req, res, next) {
        console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [DAEMON] ${req.method.toLocaleUpperCase()} ${req.url}`);
        next();
    });
    // Parse Body (POST only)
    app.use(express_1.default.urlencoded({ extended: true }));
    // Static files
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [DAEMON] Using static folder ${config.httpStaticDir}`);
    app.use(express_1.default.static(config.httpStaticDir));
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [DAEMON] Using templates folder ${config.httpTemplatesDir}`);
    (0, routesCore_1.registerCoreRoutes)(app);
    (0, routesRig_1.registerRigRoutes)(app, '/rig');
    (0, routesFarm_1.registerFarmRoutes)(app, '/farm');
    (0, routesNode_1.registerNodeRoutes)(app, '/node');
    (0, routesPool_1.registerPoolRoutes)(app, '/pool');
    // Log Error 404
    app.use(function (req, res, next) {
        console.warn(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] [DAEMON] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);
        next();
    });
}
function registerWssRoutes(config, wss) {
    wss.on('connection', function connection(ws, req) {
        // Prepare connection heartbeat
        ws.pongOk = true;
        // Prepare connection auth
        ws.auth = null;
        // Get client informations
        let clientIP = getWsClientIp(req);
        /*
        if (allowedIps.length > 0 && ! allowedIps.includes(clientIP)) {
            //ws.send('ERROR: not authorized');
            console.warn(`${now()} [${colors.yellow('WARNING')}] [DAEMON] rejecting client ${clientIP} for non allowed IP`);
            ws.close();
            return;
        }
        */
        ws.on('pong', function pong() {
            // Received pong from client
            this.pongOk = true;
        });
        // Handle incoming message from client
        ws.on('message', function message(data) {
            var _a;
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const clientName = ((_a = ws.auth) === null || _a === void 0 ? void 0 : _a.clientName) || 'anonymous';
                const messageJson = data.toString();
                //console.log(`${now()} [${colors.blue('INFO')}] [DAEMON] request from client ${colors.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                // try
                const message = JSON.parse(messageJson);
                if ('error' in message) {
                    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [DAEMON] received error from client ${safe_1.default.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                    const err = JSON.parse(messageJson);
                }
                else if ('result' in message) {
                    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [DAEMON] received response from client ${safe_1.default.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                    const res = JSON.parse(messageJson);
                }
                else if ('method' in message && 'params' in message) {
                    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [DAEMON] received request from client ${safe_1.default.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                    const req = JSON.parse(messageJson);
                    switch (req.method) {
                        /* CORE */
                        case 'sysInfos':
                            const sysInfos = yield (0, sysinfos_1.getSystemInfos)();
                            rpcSendResponse(ws, req.id, sysInfos);
                            break;
                        /* RIG */
                        case 'rigStatus':
                            const rigInfos = Rig.getRigInfos();
                            rpcSendResponse(ws, req.id, rigInfos);
                            break;
                        case 'rigMonitorStart':
                            Rig.monitorStart(config, req.params);
                            rpcSendResponse(ws, req.id, 'OK');
                            break;
                        case 'rigMonitorStop':
                            Rig.monitorStop(config, req.params);
                            rpcSendResponse(ws, req.id, 'OK');
                            break;
                        case 'rigMonitorStatus':
                            const rigMonitorStatus = Rig.monitorStatus(config, req.params);
                            rpcSendResponse(ws, req.id, rigMonitorStatus);
                            break;
                        case 'rigMinerInstallStart':
                            try {
                                yield Rig.minerInstallStart(config, req.params);
                                rpcSendResponse(ws, req.id, 'OK');
                            }
                            catch (err) {
                                console.warn(`${(0, utils_1.now)()} [${safe_1.default.blue('WARN')}] [DAEMON] cannot start miner install. ${err.message}`);
                                rpcSendError(ws, req.id, { code: -1, message: err.message });
                            }
                            break;
                        case 'rigMinerRunStart':
                            try {
                                yield Rig.minerRunStart(config, req.params);
                                rpcSendResponse(ws, req.id, 'OK');
                            }
                            catch (err) {
                                console.warn(`${(0, utils_1.now)()} [${safe_1.default.blue('WARN')}] [DAEMON] cannot start miner run. ${err.message}`);
                                rpcSendError(ws, req.id, { code: -1, message: err.message });
                            }
                            break;
                        case 'rigMinerRunStop':
                            try {
                                Rig.minerRunStop(config, req.params);
                                rpcSendResponse(ws, req.id, 'OK');
                            }
                            catch (err) {
                                console.warn(`${(0, utils_1.now)()} [${safe_1.default.blue('WARN')}] [DAEMON] cannot stop miner run. ${err.message}`);
                                rpcSendError(ws, req.id, { code: -1, message: err.message });
                            }
                            break;
                        case 'rigMinerRunStatus':
                            try {
                                const minerStatus = Rig.minerRunStatus(config, req.params);
                                rpcSendResponse(ws, req.id, minerStatus);
                            }
                            catch (err) {
                                console.warn(`${(0, utils_1.now)()} [${safe_1.default.blue('WARN')}] [DAEMON] cannot get miner run status. ${err.message}`);
                                rpcSendError(ws, req.id, { code: -1, message: err.message });
                            }
                            break;
                        case 'rigMinerRunLog':
                            try {
                                const minerLog = Rig.minerRunLog(config, req.params);
                                rpcSendResponse(ws, req.id, minerLog);
                            }
                            catch (err) {
                                console.warn(`${(0, utils_1.now)()} [${safe_1.default.blue('WARN')}] [DAEMON] cannot get miner run log. ${err.message}`);
                                rpcSendError(ws, req.id, { code: -1, message: err.message });
                            }
                            break;
                        case 'rigMinerRunInfos':
                            try {
                                const minerInfos = yield Rig.minerRunInfos(config, req.params);
                                rpcSendResponse(ws, req.id, minerInfos);
                            }
                            catch (err) {
                                console.warn(`${(0, utils_1.now)()} [${safe_1.default.blue('WARN')}] [DAEMON] cannot get miner run infos. ${err.message}`);
                                rpcSendError(ws, req.id, { code: -1, message: err.message });
                            }
                            break;
                        /* NODE */
                        case 'nodeStatus':
                            const nodeInfos = Node.getNodeInfos();
                            rpcSendResponse(ws, req.id, nodeInfos);
                            break;
                        case 'nodeMonitorStart':
                            Node.monitorStart(config, req.params);
                            rpcSendResponse(ws, req.id, 'OK');
                            break;
                        case 'nodeMonitorStop':
                            Node.monitorStop(config, req.params);
                            rpcSendResponse(ws, req.id, 'OK');
                            break;
                        case 'nodeMonitorStatus':
                            const nodeMonitorStatus = Node.monitorStatus(config, req.params);
                            rpcSendResponse(ws, req.id, nodeMonitorStatus);
                            break;
                        case 'nodeFullnodeInstallStart':
                            try {
                                yield Node.fullnodeInstallStart(config, req.params);
                                rpcSendResponse(ws, req.id, 'OK');
                            }
                            catch (err) {
                                console.warn(`${(0, utils_1.now)()} [${safe_1.default.blue('WARN')}] [DAEMON] cannot start fullnode install. ${err.message}`);
                                rpcSendError(ws, req.id, { code: -1, message: err.message });
                            }
                            break;
                        case 'nodeFullnodeRunStart':
                            try {
                                yield Node.fullnodeRunStart(config, req.params);
                                rpcSendResponse(ws, req.id, 'OK');
                            }
                            catch (err) {
                                console.warn(`${(0, utils_1.now)()} [${safe_1.default.blue('WARN')}] [DAEMON] cannot start fullnode run. ${err.message}`);
                                rpcSendError(ws, req.id, { code: -1, message: err.message });
                            }
                            break;
                        case 'nodeFullnodeRunStop':
                            try {
                                Node.fullnodeRunStop(config, req.params);
                                rpcSendResponse(ws, req.id, 'OK');
                            }
                            catch (err) {
                                console.warn(`${(0, utils_1.now)()} [${safe_1.default.blue('WARN')}] [DAEMON] cannot stop fullnode run. ${err.message}`);
                                rpcSendError(ws, req.id, { code: -1, message: err.message });
                            }
                            break;
                        case 'nodeFullnodeRunStatus':
                            try {
                                const fullnodeStatus = Node.fullnodeRunStatus(config, req.params);
                                rpcSendResponse(ws, req.id, fullnodeStatus);
                            }
                            catch (err) {
                                console.warn(`${(0, utils_1.now)()} [${safe_1.default.blue('WARN')}] [DAEMON] cannot get fullnode run status. ${err.message}`);
                                rpcSendError(ws, req.id, { code: -1, message: err.message });
                            }
                            break;
                        case 'nodeFullnodeRunInfos':
                            try {
                                const fullnodeInfos = yield Node.fullnodeRunInfos(config, req.params);
                                rpcSendResponse(ws, req.id, fullnodeInfos);
                            }
                            catch (err) {
                                console.warn(`${(0, utils_1.now)()} [${safe_1.default.blue('WARN')}] [DAEMON] cannot get fullnode run infos. ${err.message}`);
                                rpcSendError(ws, req.id, { code: -1, message: err.message });
                            }
                            break;
                        /* DEFAULT */
                        default:
                            rpcSendError(ws, req.id, { code: -32601, message: `the method ${req.method} does not exist/is not available` });
                            break;
                    }
                }
                else {
                    console.warn(`${(0, utils_1.now)()} [${safe_1.default.blue('WARNING')}] [DAEMON] received invalid message from client ${safe_1.default.cyan(clientName)} (${clientIP}) : \n${messageJson}`);
                    ws.close();
                }
            });
        });
        // Handle connection close
        ws.on('close', function message(data) {
            var _a;
            const clientName = ((_a = ws.auth) === null || _a === void 0 ? void 0 : _a.clientName) || 'anonymous';
            console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [DAEMON] client ${clientName} (${clientIP}) disconnected`);
        });
        // Send a welcome message
        //ws.send('Welcome on OpenMine websocket');
    });
    // Handle connections heartbeat
    const interval = setInterval(function pings() {
        // ping each client...
        wss.clients.forEach(function ping(ws) {
            let clientIP = ws._socket.remoteAddress;
            if (ws.pongOk === false) {
                console.warn(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] [DAEMON] ejecting client ${clientIP} for inactivity`);
                return ws.terminate();
            }
            ws.pongOk = false;
            ws.ping();
        });
    }, config.wssConnTimeout);
}
function getWsClientIp(req) {
    var _a;
    let clientIP = (req.headers['x-forwarded-for'] || '').split(',')[0].trim(); // reverse-proxified IP address
    if (!clientIP) {
        clientIP = ((_a = req.socket) === null || _a === void 0 ? void 0 : _a.remoteAddress) || ''; // direct IP address
    }
    return clientIP;
}
function rpcSendRequest(ws, id, method, params) {
    const req = (0, utils_1.buildRpcRequest)(id, method, params);
    const reqStr = JSON.stringify(req);
    console.debug(`${(0, utils_1.now)()} [DEBUG] [DAEMON] sending request: ${reqStr}`);
    ws.send(reqStr);
}
function rpcSendResponse(ws, id, result) {
    const res = (0, utils_1.buildRpcResponse)(id, result);
    const resStr = JSON.stringify(res);
    console.debug(`${(0, utils_1.now)()} [DEBUG] [DAEMON] sending response: ${resStr}`);
    ws.send(resStr);
}
function rpcSendError(ws, id, error) {
    const err = (0, utils_1.buildRpcError)(id, error);
    const errStr = JSON.stringify(err);
    console.debug(`${(0, utils_1.now)()} [DEBUG] [DAEMON] sending error: ${errStr}`);
    ws.send(errStr);
}
function safeQuit(returnCode = 1) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (quitRunning) {
            process.exit();
        }
        quitRunning = true;
        // gracefully kill Rig active processes
        let procName;
        let rigProcesses = Rig.getProcesses();
        for (procName in rigProcesses) {
            const proc = rigProcesses[procName];
            if (!proc.process) {
                throw { message: `The processus ${(proc.process || {}).pid} is not killable` };
            }
            console.log(`Sending SIGINT signal to rig process PID ${proc.process.pid}`);
            proc.process.kill('SIGINT');
        }
        // waiting for kills are done...
        let rigProcessesCount = Object.keys(rigProcesses).length;
        let lastRigProcessesCount = -1;
        let waits = 0;
        const waitDelayBetweenPools = 100; // ms
        const WaitsCountBeforeSigKill = 10; // => 10 * 100 ms = 1 second
        while (true) {
            rigProcesses = Rig.getProcesses();
            rigProcessesCount = Object.keys(rigProcesses).length;
            if (rigProcessesCount === 0) {
                break;
            }
            if (rigProcessesCount !== lastRigProcessesCount) {
                console.log(`Remaining rig processes: ${rigProcessesCount}`);
                lastRigProcessesCount = rigProcessesCount;
            }
            yield (0, utils_1.sleep)(waitDelayBetweenPools);
            waits++;
            if (waits === WaitsCountBeforeSigKill) {
                // if SIGINT has no effect after x seconds, send SIGKILL signal...
                for (procName in rigProcesses) {
                    const proc = rigProcesses[procName];
                    if (!proc.process)
                        continue;
                    console.log(`Sending SIGKILL signal to rig process PID ${proc.process.pid}`);
                    proc.process.kill('SIGKILL');
                }
            }
        }
        setTimeout(process.exit, 500, returnCode);
    });
}
function catchSignals() {
    process.on('SIGINT', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log(`${(0, utils_1.now)()} [INFO] [DAEMON] CTRL+C detected`);
        safeQuit(2);
    }));
    process.on('SIGQUIT', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log(`${(0, utils_1.now)()} [INFO] [DAEMON] Keyboard quit detected`);
        safeQuit(3);
    }));
    process.on('SIGTERM', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log(`${(0, utils_1.now)()} [INFO] [DAEMON] Kill detected`);
        safeQuit(15);
    }));
    process.on('SIGTERM', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log(`${(0, utils_1.now)()} [INFO] [DAEMON] Kill -9 detected`);
        safeQuit(9);
    }));
    process.on('unhandledRejection', (err, p) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        // Handle unhandled promises directly
        console.error(`${(0, utils_1.now)()} [ERROR] [DAEMON] Error 'unhandledRejection' detected in promise : ${err.message}`);
        if (err.message.startsWith("Timeout error: ping")) {
            return;
        }
        console.log(p);
        //debugger;
        safeQuit(5);
    }));
}
function getConfig() {
    return config;
}
exports.getConfig = getConfig;
function getSysInfos(refresh = false) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (sysInfos === null || refresh) {
            sysInfos = yield (0, sysinfos_1.getSystemInfos)();
        }
        return sysInfos;
    });
}
exports.getSysInfos = getSysInfos;
