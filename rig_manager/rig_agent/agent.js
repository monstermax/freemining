"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const ws_1 = tslib_1.__importDefault(require("ws"));
const os_1 = tslib_1.__importDefault(require("os"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const { exec } = require('child_process');
const config = require('../rig_manager.json');
const wsServerHost = ((_a = config.farmServer) === null || _a === void 0 ? void 0 : _a.host) || 'localhost';
const wsServerPort = ((_b = config.farmServer) === null || _b === void 0 ? void 0 : _b.port) || 4200;
const serverConnTimeout = 10000; // si pas de réponse d'un client au bout de x millisecondes on le déconnecte
const serverNewConnDelay = 10000; // attend x millisecondes avant de se reconnecter (en cas de déconnexion)
const sendStatusInterval = 10000; // envoie le statut du rig au farmServer toutes les x millisecondes
let connectionCount = 0;
const toolsDir = `${__dirname}/../tools`;
const cmdService = `${toolsDir}/service.sh`;
const cmdRigMonitorJson = `${toolsDir}/rig_monitor_json.sh`;
function websocketConnect() {
    let sendStatusTimeout = null;
    let newConnectionTimeout = null;
    const connectionId = connectionCount++;
    console.log(`${now()} [${safe_1.default.blue('INFO')}] connecting to websocket server... [conn ${connectionId}]`);
    let ws;
    try {
        ws = new ws_1.default(`ws://${wsServerHost}:${wsServerPort}/`);
    }
    catch (err) {
        console.log(`${now()} [${safe_1.default.red('ERROR')}] cannot connect to websocket server [conn ${connectionId}]`);
        if (newConnectionTimeout === null) {
            newConnectionTimeout = setTimeout(() => websocketConnect(), serverNewConnDelay);
        }
        return;
    }
    ws.on('error', function (err) {
        console.log(`${now()} [${safe_1.default.red('ERROR')}] connection error with websocket server => ${err.message} [conn ${connectionId}]`);
        ws.terminate();
    });
    ws.on('open', function open() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Prepare connection heartbeat
            heartbeat.call(this);
            const rigName = os_1.default.hostname();
            // Send auth
            ws.send(`auth ${rigName} xxx`);
            // Send rig status
            const rigStatus = yield getRigStatus();
            if (rigStatus) {
                console.log(`${now()} [${safe_1.default.blue('INFO')}] sending rigStatus to server (open) [conn ${connectionId}]`);
                ws.send(`rigStatus ${JSON.stringify(rigStatus)}`);
            }
            else {
                console.log(`${now()} [${safe_1.default.yellow('WARNING')}] cannot send rigStatus to server (open) [conn ${connectionId}]`);
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
            console.log(`${now()} [${safe_1.default.blue('INFO')}] received: ${message} [conn ${connectionId}]`);
            const args = message.split(' ');
            if (args[0] === 'service') {
                if (args[1] === 'start') {
                    args.shift();
                    args.shift();
                    const serviceName = args.shift();
                    if (serviceName && args.length > 0) {
                        const paramsJson = args.join('');
                        let params;
                        try {
                            params = JSON.parse(paramsJson);
                        }
                        catch (err) {
                            console.error(`${now()} [${safe_1.default.red('ERROR')}] cannot start service : ${err.message}`);
                            return;
                        }
                        const cmd = `${cmdService} start ${serviceName} ${params.poolUrl} ${params.poolAccount} ${params.workerName} ${params.algo}`;
                        console.log(`${now()} [DEBUG] executing command: ${cmd}`);
                        const ret = yield cmdExec(cmd);
                        console.log(`${now()} [DEBUG] command result: ${ret}`);
                        var debugme = 1;
                    }
                }
                if (args[1] === 'stop') {
                    args.shift();
                    args.shift();
                    const serviceName = args.shift();
                    if (serviceName) {
                        const cmd = `${cmdService} stop ${serviceName}`;
                        console.log(`${now()} [DEBUG] executing command: ${cmd}`);
                        const ret = yield cmdExec(cmd);
                        console.log(`${now()} [DEBUG] command result: ${ret}`);
                        var debugme = 1;
                    }
                }
            }
        });
    });
    // Handle connection close
    ws.on('close', function close() {
        console.log(`${now()} [${safe_1.default.blue('INFO')}] disconnected from server [conn ${connectionId}]`);
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
            console.log(`${now()} [${safe_1.default.blue('INFO')}] terminate connection with the server [conn ${connectionId}]`);
            this.terminate();
            if (newConnectionTimeout === null) {
                newConnectionTimeout = setTimeout(() => websocketConnect(), 5000);
            }
        }, serverConnTimeout + 1000);
    }
    function hello() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            sendStatusTimeout = null;
            const rigStatus = yield getRigStatus();
            if (rigStatus) {
                if (ws.readyState === ws_1.default.OPEN) {
                    console.log(`${now()} [${safe_1.default.blue('INFO')}] sending rigStatus to server (hello) [conn ${connectionId}]`);
                    ws.send(`rigStatus ${JSON.stringify(rigStatus)}`);
                    var debugSentData = JSON.stringify(rigStatus);
                    var debugme = 1;
                }
                else {
                    console.log(`${now()} [${safe_1.default.yellow('WARNING')}] cannot send rigStatus to server (hello. ws closed) [conn ${connectionId}]`);
                    ws.close();
                    return;
                }
            }
            else {
                console.log(`${now()} [${safe_1.default.yellow('WARNING')}] cannot send rigStatus to server (hello. no status available) [conn ${connectionId}]`);
                ws.close();
                return;
            }
            sendStatusTimeout = setTimeout(hello, 10000);
        });
    }
    return ws;
}
function getRigStatus() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = cmdRigMonitorJson;
        const statusJson = yield cmdExec(cmd);
        if (statusJson) {
            try {
                const rigStatus = JSON.parse(statusJson);
                return rigStatus;
            }
            catch (err) {
                console.error(`${now()} [${safe_1.default.red('ERROR')}] cannot read rig status`);
            }
        }
        return null;
    });
}
function cmdExec(cmd) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let ret = null;
        yield new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    //console.error(`${now()} [${colors.red('ERROR')}] Error while running exec command : ${error.message.trim()}`);
                    reject(error);
                    return;
                }
                if (stderr) {
                    reject({ message: stderr, code: 500 });
                    return;
                }
                resolve(stdout);
            });
        }).then((result) => {
            ret = result;
        }).catch((err) => {
            console.error(`${now()} [${safe_1.default.red('ERROR')}] catched while running exec command => ${safe_1.default.red(err.message)}`);
        });
        return ret;
    });
}
function now() {
    const options = {
        /* year: "numeric", month: "2-digit", day: "2-digit", */
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    };
    return new Date().toLocaleTimeString("fr-FR", options);
}
function main() {
    websocketConnect();
}
main();
