"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRigStatusToFarm = exports.status = exports.stop = exports.start = void 0;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const ws_1 = tslib_1.__importDefault(require("ws"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const utils_1 = require("../common/utils");
const Rig = tslib_1.__importStar(require("./Rig"));
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
            console.warn(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] [RIG] cannot send status to farm : ${err.message} [connId: ${ws === null || ws === void 0 ? void 0 : ws._connId}]`);
        }
        //sendStatusTimeout = setTimeout(sendRigStatusAuto, sendStatusInterval, ws, config);
    });
}
function sendRigStatus(ws, rigInfos) {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [RIG] Sending rigInfos to farm agent... [connId: ${websocket === null || websocket === void 0 ? void 0 : websocket._connId}]`);
    //ws.send( `rigStatus ${JSON.stringify(rigInfos)}`);
    //const req: any = {
    //    method: "farmRigUpdateStatus",
    //    params: rigInfos,
    //};
    let reqId = ++requestsCount;
    const req = (0, utils_1.buildRpcRequest)(reqId, "farmRigUpdateStatus", rigInfos);
    ws.send(JSON.stringify(req));
}
// WEBSOCKET
function websocketConnect(config) {
    var _a, _b, _c;
    let newConnectionTimeout = null;
    const rigName = config.rig.name || os_1.default.hostname();
    const websocketPassword = ((_a = config.rig.farmAgent) === null || _a === void 0 ? void 0 : _a.pass) || '';
    wsServerHost = ((_b = config.rig.farmAgent) === null || _b === void 0 ? void 0 : _b.host) || '';
    wsServerPort = Number((_c = config.rig.farmAgent) === null || _c === void 0 ? void 0 : _c.port) || 0;
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
            // Send rig config
            reqId = ++requestsCount;
            req = (0, utils_1.buildRpcRequest)(reqId, "farmRigUpdateConfig", config);
            console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [RIG] sending rigConfig to server (open) [conn ${connectionId}]`);
            this.send(JSON.stringify(req));
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
        // received a ping from the farm
        heartbeat.call(this);
    });
    // Handle incoming message from farm
    websocket.on('message', function message(data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const messageJson = data.toString();
            //console.log(`${now()} [${colors.blue('INFO')}] [RIG] received: ${message} [connId ${connectionId}]`);
            let message;
            try {
                message = JSON.parse(messageJson);
            }
            catch (err) {
                console.warn(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] [RIG] received invalid json from farm : \n${messageJson}`);
                return;
            }
            if ('error' in message) {
                console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [RIG] received error from farm : \n${messageJson}`);
                const err = JSON.parse(messageJson);
            }
            else if ('result' in message) {
                //console.log(`${now()} [${colors.blue('INFO')}] [RIG] received response from farm : \n${messageJson}`);
                //const res: t.RpcResponse = JSON.parse(messageJson);
            }
            else if ('method' in message && 'params' in message) {
                //console.log(`${now()} [${colors.blue('INFO')}] [RIG] received request from farm : \n${messageJson}`);
                //console.log(`${now()} [${colors.blue('INFO')}] [RIG] received request from farm (${messageJson.length} chars.)`);
                const req = JSON.parse(messageJson);
                console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] [RIG] received request from farm (${req.method})`);
                switch (req.method) {
                    case 'farmMinerInstallStart':
                        {
                            const ok = Rig.minerInstallStart(config, message.params);
                            rpcSendResponse(this, req.id, 'OK');
                        }
                        break;
                    case 'farmMinerInstallStop':
                        {
                            const ok = Rig.minerInstallStop(config, message.params);
                            rpcSendResponse(this, req.id, 'OK');
                        }
                        break;
                    case 'farmMinerRunStart':
                        {
                            const ok = yield Rig.minerRunStart(config, message.params);
                            rpcSendResponse(this, req.id, 'OK');
                        }
                        break;
                    case 'farmMinerRunStop':
                        {
                            const ok = Rig.minerRunStop(config, message.params);
                            rpcSendResponse(this, req.id, 'OK');
                        }
                        break;
                    case 'farmMinerRunStatus':
                        {
                            const status = Rig.minerRunGetStatus(config, message.params);
                            rpcSendResponse(this, req.id, status);
                        }
                        break;
                    case 'farmMinerRunLog':
                        {
                            const log = Rig.minerRunGetLog(config, message.params);
                            rpcSendResponse(this, req.id, log);
                        }
                        break;
                    default:
                        rpcSendError(this, req.id, { code: -32601, message: `the method ${req.method} does not exist/is not available on RIG` });
                        break;
                }
            }
            else {
                console.warn(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] [RIG] received invalid message from farm : \n${messageJson}`);
                //ws.close();
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
function rpcSendResponse(ws, id, result) {
    const res = (0, utils_1.buildRpcResponse)(id, result);
    const resStr = JSON.stringify(res);
    //console.debug(`${now()} [DEBUG] [CLI] sending response: ${resStr}`);
    ws.send(resStr);
}
function rpcSendError(ws, id, result) {
    const err = (0, utils_1.buildRpcError)(id, result);
    const errStr = JSON.stringify(err);
    //console.debug(`${now()} [DEBUG] [CLI] sending error: ${errStr}`);
    ws.send(errStr);
}
