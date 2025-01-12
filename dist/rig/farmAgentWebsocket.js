"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stop = exports.start = void 0;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const ws_1 = tslib_1.__importDefault(require("ws"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const utils_1 = require("../common/utils");
const Rig = tslib_1.__importStar(require("./Rig"));
const Daemon = tslib_1.__importStar(require("../core/Daemon"));
let websocket;
const wsServerHost = '127.0.0.1.'; // TODO: lire config
const wsServerPort = 1234; // TODO: lire config
const serverConnTimeout = 10000; // si pas de réponse d'un client au bout de x millisecondes on le déconnecte
const serverNewConnDelay = 10000; // attend x millisecondes avant de se reconnecter (en cas de déconnexion)
const sendStatusInterval = 10000; // envoie le (dernier) statut du rig au farmServer toutes les x millisecondes
let connectionCount = 0;
let sendStatusTimeout = null;
//let checkStatusTimeout: any = null;
const rigName = 'test-ws' || os_1.default.hostname();
const websocketPassword = 'xxx'; // password to access farm websocket server
let active = false;
function start(config) {
    if (websocket)
        return;
    if (active)
        return;
    active = true;
    websocketConnect();
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
function sendStatusAuto(ws) {
    if (sendStatusTimeout) {
        clearTimeout(sendStatusTimeout);
        sendStatusTimeout = null;
    }
    const rigInfos = Rig.getRigInfos();
    sendStatus(ws, rigInfos);
    sendStatusTimeout = setTimeout(sendStatusAuto, sendStatusInterval, ws);
}
function sendStatus(ws, rigInfos) {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] sending rigInfos to server`);
    //ws.send( `rigStatus ${JSON.stringify(rigInfos)}`);
    const req = {
        method: "farmRigStatus",
        params: rigInfos,
    };
    ws.send(JSON.stringify(req));
}
// WEBSOCKET
function websocketConnect() {
    let newConnectionTimeout = null;
    if (!active)
        return;
    if (websocket) {
        throw new Error(`websocket already up`);
    }
    const connectionId = connectionCount++;
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] connecting to websocket server ${wsServerHost}:${wsServerPort} ... [conn ${connectionId}]`);
    try {
        websocket = new ws_1.default(`ws://${wsServerHost}:${wsServerPort}/`);
    }
    catch (err) {
        console.log(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}] cannot connect to websocket server [conn ${connectionId}]`);
        if (newConnectionTimeout === null && active) {
            newConnectionTimeout = setTimeout(() => websocketConnect(), serverNewConnDelay);
        }
        return;
    }
    websocket.on('error', function (err) {
        console.log(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}] connection error with websocket server => ${err.message} [conn ${connectionId}]`);
        this.terminate();
    });
    websocket.on('open', function open() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const rigInfos = Rig.getRigInfos();
            // Send auth
            this.send(`{ "method": "farmAuth", "params": {\"rig\": \"${rigName}\", \"pass\": \"${websocketPassword}\"} }`);
            // Send rig config
            //console.log(`${now()} [${colors.blue('INFO')}] sending rigConfig to server (open) [conn ${connectionId}]`)
            //this.send( `rigConfig ${JSON.stringify(configRig)}`);
            if (!rigInfos) {
                console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] cannot send rigInfos to server (open) [conn ${connectionId}]`);
                this.close();
                websocket = null;
                return;
            }
            // Send rig status
            sendStatus(this, rigInfos);
            // TODO: envoyer la liste des miners installés ( process.env.INSTALLED_MINERS )
            // send rig status every 10 seconds
            if (sendStatusTimeout === null) {
                sendStatusTimeout = setTimeout(sendStatusAuto, sendStatusInterval, this);
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
                    //const minerAlias = args.shift() || '';
                    const minerAlias = ''; // TODO: get from params
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
        console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] disconnected from server [conn ${connectionId}]`);
        if (sendStatusTimeout) {
            clearTimeout(sendStatusTimeout);
            sendStatusTimeout = null;
        }
        //process.exit();
        // handle reconnection
        if (newConnectionTimeout === null && active) {
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
            if (!active)
                return;
            console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] terminate connection with the server [conn ${connectionId}]`);
            this.terminate();
            websocket = null;
            if (newConnectionTimeout === null && active) {
                newConnectionTimeout = setTimeout(() => websocketConnect(), 5000);
            }
        }, serverConnTimeout + 1000);
    }
    return websocket;
}
