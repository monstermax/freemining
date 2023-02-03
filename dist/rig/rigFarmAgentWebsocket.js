"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRigStatusToFarm = exports.status = exports.stop = exports.start = void 0;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const ws_1 = tslib_1.__importDefault(require("ws"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const utils_1 = require("../common/utils");
const Rig = tslib_1.__importStar(require("./Rig"));
const Daemon = tslib_1.__importStar(require("../core/Daemon"));
let websocket;
let wsServerHost = '';
let wsServerPort = 0;
const serverConnTimeout = 10000; // si pas de réponse d'un client au bout de x millisecondes on le déconnecte
const serverNewConnDelay = 10000; // attend x millisecondes avant de se reconnecter (en cas de déconnexion)
const sendStatusInterval = 10000; // envoie le (dernier) statut du rig au farmServer toutes les x millisecondes
let connectionCount = 0;
let requestsCount = 0;
let sendStatusTimeout = null;
//let checkStatusTimeout: any = null;
let active = false;
function start(config) {
    if (websocket)
        return;
    if (active)
        return;
    active = true;
    websocketConnect(config);
    //console.log(`${now()} [INFO] [RIG] Farm agent started`);
}
exports.start = start;
function stop() {
    //if (! websocket) return;
    //if (! active) return;
    active = false;
    if (sendStatusTimeout) {
        clearTimeout(sendStatusTimeout);
        sendStatusTimeout = null;
    }
    if (websocket) {
        websocket.close();
        websocket = null;
    }
    //console.log(`${now()} [INFO] [RIG] Farm agent stopped`);
}
exports.stop = stop;
function status() {
    return active;
}
exports.status = status;
function sendRigStatusToFarm(config) {
    if (websocket && websocket.readyState === websocket.OPEN) {
        sendRigStatusAuto(websocket, config);
    }
}
exports.sendRigStatusToFarm = sendRigStatusToFarm;
function sendRigStatusAuto(ws, config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (sendStatusTimeout) {
            clearTimeout(sendStatusTimeout);
            sendStatusTimeout = null;
        }
        const rigInfos = yield Rig.getRigInfos(config);
        try {
            if (!ws || ws.readyState !== ws.OPEN)
                throw new Error(`Websocket not opened`);
            sendRigStatus(ws, rigInfos);
        }
        catch (err) {
            console.warn(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] [RIG] cannot send status to farm : ${err.message} [connId: ${ws._connId}]`);
        }
        //sendStatusTimeout = setTimeout(sendRigStatusAuto, sendStatusInterval, ws, config);
    });
}
function sendRigStatus(ws, rigInfos) {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [RIG] Sending rigInfos to farm agent... [connId: ${websocket._connId}]`);
    //ws.send( `rigStatus ${JSON.stringify(rigInfos)}`);
    const req = {
        method: "farmRigUpdateStatus",
        params: rigInfos,
    };
    ws.send(JSON.stringify(req));
}
// WEBSOCKET
function websocketConnect(config) {
    var _a, _b;
    let newConnectionTimeout = null;
    const rigName = config.rig.name || os_1.default.hostname();
    const websocketPassword = 'xxx'; // password to access farm websocket server
    wsServerHost = ((_a = config.rig.farmAgent) === null || _a === void 0 ? void 0 : _a.host) || '';
    wsServerPort = Number((_b = config.rig.farmAgent) === null || _b === void 0 ? void 0 : _b.port) || 0;
    if (!wsServerHost || !wsServerPort) {
        return;
    }
    if (!active)
        return;
    if (websocket) {
        throw new Error(`websocket already up`);
    }
    const connectionId = ++connectionCount;
    requestsCount = 0;
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [RIG] connecting to websocket server ${wsServerHost}:${wsServerPort} ... [connId ${connectionId}]`);
    try {
        websocket = new ws_1.default(`ws://${wsServerHost}:${wsServerPort}/`);
    }
    catch (err) {
        console.warn(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}] [RIG] cannot connect to websocket server [conn ${connectionId}]`);
        if (newConnectionTimeout === null && active) {
            websocket = null;
            newConnectionTimeout = setTimeout(websocketConnect, serverNewConnDelay, config);
        }
        return;
    }
    websocket._connId = connectionId;
    websocket.on('error', function (err) {
        console.warn(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}] [RIG] connection error with websocket server => ${err.message} [connId ${connectionId}]`);
        this.terminate();
    });
    websocket.on('open', function open() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Send auth
            let reqId = ++requestsCount;
            let req = (0, utils_1.buildRpcRequest)(reqId, "farmAuth", {
                user: rigName,
                pass: websocketPassword,
            });
            console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [RIG] sending auth to server (open) [connId ${connectionId}]`);
            this.send(JSON.stringify(req));
            /*
            // Send rig config
            reqId = ++requestsCount;
            req = buildRpcRequest(reqId, "farmRigUpdateConfig", {
                config,
            });
            console.log(`${now()} [${colors.blue('INFO')}] [RIG] sending rigConfig to server (open) [conn ${connectionId}]`)
            this.send( JSON.stringify(req) );
    
            // Send installed miners
            const installedMiners = await Rig.getInstalledMiners(config);
            const installedMinersAliases: any = {}; // TODO
            reqId = ++requestsCount;
            req = buildRpcRequest(reqId, "farmRigUpdateInstalledMiners", {
                installedMiners,
            });
            console.log(`${now()} [${colors.blue('INFO')}] [RIG] sending installedMiners to server (open) [conn ${connectionId}]`)
            this.send( JSON.stringify(req) );
    
    
            // Send running miners
            const runningMinersAliases = Rig.getRunningMinersAliases(config);
            reqId = ++requestsCount;
            req = buildRpcRequest(reqId, "farmRigUpdateRunningMinersAliases", {
                runningMinersAliases,
            });
            console.log(`${now()} [${colors.blue('INFO')}] [RIG] sending runningMinersAliases to server (open) [conn ${connectionId}]`)
            this.send( JSON.stringify(req) );
            */
            // Send rig status
            const rigInfos = yield Rig.getRigInfos(config);
            if (!rigInfos) {
                console.warn(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] [RIG] cannot send rigInfos to server (open) [connId ${connectionId}]`);
                this.close();
                websocket = null;
                return;
            }
            sendRigStatus(this, rigInfos);
            // send rig status every 10 seconds
            if (sendStatusTimeout === null) {
                sendStatusTimeout = setTimeout(sendRigStatusAuto, sendStatusInterval, this, config);
            }
            // Prepare connection heartbeat
            heartbeat.call(this);
        });
    });
    // Handle connections heartbeat
    websocket.on('ping', function ping() {
        // received a ping from the server
        heartbeat.call(this);
    });
    // Handle incoming message from server
    websocket.on('message', function message(data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const message = data.toString();
            console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [RIG] received: ${message} [connId ${connectionId}]`);
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
                    //const minerAlias = args.shift() || '';
                    const minerAlias = ''; // TODO: get from params
                    if (minerName && args.length > 0) {
                        const paramsJson = args.join(' ');
                        let params;
                        try {
                            params = JSON.parse(paramsJson);
                        }
                        catch (err) {
                            console.error(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}] [RIG] cannot start service : ${err.message} [connId: ${connectionId}]`);
                            return;
                        }
                        params.miner = minerName;
                        params.alias = minerAlias;
                        const config = Daemon.getConfig();
                        const ok = yield Rig.minerRunStart(config, params);
                        var debugme = 1;
                    }
                    else {
                        // error
                    }
                }
                if (args[1] === 'stop') {
                    args.shift();
                    args.shift();
                    const minerName = args.shift();
                    //const minerAlias = args.shift() || '';
                    const minerAlias = ''; // TODO: get from params
                    if (minerName) {
                        const config = Daemon.getConfig();
                        const params = {
                            miner: minerName,
                            alias: minerAlias,
                        };
                        const ok = yield Rig.minerRunStop(config, params);
                        var debugme = 1;
                    }
                    else {
                        // error
                    }
                }
            }
        });
    });
    // Handle connection close
    websocket.on('close', function close() {
        console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [RIG] disconnected from server [connId ${connectionId}]`);
        if (sendStatusTimeout) {
            clearTimeout(sendStatusTimeout);
            sendStatusTimeout = null;
        }
        //process.exit();
        // handle reconnection
        if (newConnectionTimeout === null && active) {
            websocket = null;
            newConnectionTimeout = setTimeout(websocketConnect, 10000, config);
        }
    });
    function heartbeat() {
        clearTimeout(this.pingTimeout);
        // Use `WebSocket#terminate()`, which immediately destroys the connection,
        // instead of `WebSocket#close()`, which waits for the close timer.
        // Delay should be equal to the interval at which your server
        // sends out pings plus a conservative assumption of the latency.
        this.pingTimeout = setTimeout(() => {
            if (!active)
                return;
            if (!websocket || websocket !== this)
                return;
            console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [RIG] terminate connection with the server [conn ${connectionId}]`);
            this.terminate();
            websocket = null;
            if (newConnectionTimeout === null && active) {
                websocket = null;
                newConnectionTimeout = setTimeout(websocketConnect, 5000, config);
            }
        }, serverConnTimeout + 1000);
    }
    return websocket;
}
