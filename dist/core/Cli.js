"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const tslib_1 = require("tslib");
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
//import * as WebSocket from 'ws';
const ws_1 = tslib_1.__importDefault(require("ws"));
const Config_1 = require("./Config");
const utils_1 = require("../common/utils");
/* ########## USAGE #########

# Install fullnode Dogecoin
./frm-cli-ts --fullnode-install dogecoin

# Install miner Trex
./frm-cli-ts --miner-install trex

# Start rig monitor
./frm-cli-ts --rig-monitor-start

# Stop rig monitor
./frm-cli-ts --rig-monitor-stop

# Get rig status
./frm-cli-ts --rig-status


# Start trex on JJPool for ERGO coin
./frm-cli-ts --miner-start trex -algo autolykos2 -url eu.jjpool.fr:3056 -user 9i5bBBR828EUs79bXUJJpNAo6X2fdfigA4XkZvg7nDfPeUdjsRb.test -- -d 0

# Stop trex
./frm-cli-ts --miner-stop trex


# Start xmrig on XMRPool for MONERO coin
./frm-cli-ts --miner-start xmrig -algo rx/0 -url xmrpool.eu:5555 -user 46jYYGCiFQbfyUNWkhMyyB2Jyg1n3yGGPjfYjbjsq6SBarcH66i3RodSiGjJfx2Ue74dUFi4bFwxKaUbt2aurBjJEySsMrH+test

# Stop xmrig
./frm-cli-ts --miner-stop xmrig

*/
/* ########## FUNCTIONS ######### */
function usage(exitCode = null) {
    const _usage = `======================
| ⛏️   FreeMining  ⛏️  | => frm-cli
======================

Usage:

frm-cli <params>

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
    if (args.length === 0) {
        usage(0);
    }
    catchSignals();
    let config = (0, Config_1.loadConfig)(args);
    let func = null;
    /* RIG */
    if ((0, utils_1.hasOpt)('--rig-status')) {
        func = function () {
            return rigStatus(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-monitor-start')) {
        func = function () {
            return rigMonitorStart(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-monitor-stop')) {
        func = function () {
            return rigMonitorStop(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-monitor-status')) {
        func = function () {
            return rigMonitorStatus(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--miner-stop')) {
        func = function () {
            return rigMinerRunStop(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--miner-start')) {
        func = function () {
            return rigMinerRunStart(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--miner-infos')) {
        func = function () {
            return rigMinerRunInfos(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--miner-install')) {
        func = function () {
            return rigMinerInstallStart(this, args, config);
        };
    }
    /* NODE */
    if ((0, utils_1.hasOpt)('--node-status')) {
        func = function () {
            return nodeStatus(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--node-monitor-start')) {
        func = function () {
            return nodeMonitorStart(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--node-monitor-stop')) {
        func = function () {
            return nodeMonitorStop(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--node-monitor-status')) {
        func = function () {
            return nodeMonitorStatus(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--fullnode-stop')) {
        func = function () {
            return nodeFullnodeRunStop(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--fullnode-start')) {
        func = function () {
            return nodeFullnodeRunStart(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--fullnode-infos')) {
        func = function () {
            return nodeFullnodeRunInfos(this, args, config);
        };
    }
    else if ((0, utils_1.hasOpt)('--fullnode-install')) {
        func = function () {
            return nodeFullnodeInstallStart(this, args, config);
        };
    }
    if (func === null) {
        usage(0);
        return;
    }
    let ws;
    try {
        ws = new ws_1.default(`ws://${config.cliWssServerAddress}:${config.listenPort}/`);
    }
    catch (err) {
        console.log(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}] [CLI] cannot connect to websocket server`);
        return;
    }
    ws.on('error', function (err) {
        console.log(`${(0, utils_1.now)()} [${safe_1.default.red('ERROR')}] [CLI] connection error with websocket server => ${err.message}`);
        ws.terminate();
    });
    ws.on('open', function open() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (typeof func === 'function') {
                func.call(this); // send request
                // ...then wait for server response...
            }
            else {
                ws.close();
            }
        });
    });
    // Handle incoming message from server
    ws.on('message', function message(data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const messageJson = data.toString();
            // try
            const message = JSON.parse(messageJson);
            if ('error' in message) {
                //console.warn(`${now()} [${colors.blue('WARNING')}] [CLI] received error from server : \n${messageJson}`);
                const err = JSON.parse(messageJson);
                console.warn(`Error: ${err.error.message}`);
                ws.close();
            }
            else if ('result' in message) {
                //console.debug(`${now()} [${colors.blue('DEBUG')}] [CLI] received response from server : \n${messageJson}`);
                const res = JSON.parse(messageJson);
                console.log(JSON.stringify(res.result));
                ws.close();
            }
            else if ('method' in message && 'params' in message) {
                //console.log(`${now()} [${colors.blue('INFO')}] [CLI] received request from server : \n${messageJson}`);
                //const req: t.RpcRequest = JSON.parse(messageJson);
            }
            else {
                //console.warn(`${now()} [${colors.blue('WARNING')}] [CLI] received invalid message from server : \n${messageJson}`);
                console.warn(`${(0, utils_1.now)()} [${safe_1.default.blue('WARNING')}] [CLI] received invalid message from server`);
                ws.close();
            }
        });
    });
    // Handle connection close
    ws.on('close', function close() {
        //console.log(`${now()} [${colors.blue('INFO')}] [CLI] disconnected from server`);
        process.exit();
    });
    // Prepare connection timeout
    const readTimeout = setTimeout(() => {
        //console.log(`${now()} [${colors.blue('INFO')}] [CLI] terminate connection with the server`);
        ws.terminate();
    }, config.cliWssConnTimeout);
}
exports.run = run;
function rpcSendRequest(ws, id, method, params) {
    const req = (0, utils_1.buildRpcRequest)(id, method, params);
    const reqStr = JSON.stringify(req);
    //console.debug(`${now()} [DEBUG] [CLI] sending request: ${reqStr}`);
    ws.send(reqStr);
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
/* #### RIG #### */
function rigStatus(ws, args = [], config = {}) {
    const method = 'rigStatus';
    rpcSendRequest(ws, 1, method, {});
}
function rigMonitorStart(ws, args = [], config = {}) {
    const method = 'rigMonitorStart';
    rpcSendRequest(ws, 1, method, {});
}
function rigMonitorStop(ws, args = [], config = {}) {
    const method = 'rigMonitorStop';
    rpcSendRequest(ws, 1, method, {});
}
function rigMonitorStatus(ws, args = [], config = {}) {
    const method = 'rigMonitorStatus';
    rpcSendRequest(ws, 1, method, {});
}
function rigMinerInstallStart(ws, args = [], config = {}) {
    const minerNameS = (0, utils_1.getOpts)('--miner-install', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';
    const method = 'rigMinerInstallStart';
    const params = {
        miner: minerName,
        alias: (0, utils_1.getOpt)('-alias', args) || minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}
function rigMinerRunStart(ws, args = [], config = {}) {
    const minerNameS = (0, utils_1.getOpts)('--miner-start', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';
    const extraArgs = (0, utils_1.getOpts)('--', -1, args);
    const method = 'rigMinerRunStart';
    const params = {
        miner: minerName,
        algo: (0, utils_1.getOpt)('-algo', args),
        poolUrl: (0, utils_1.getOpt)('-url', args),
        poolUser: (0, utils_1.getOpt)('-user', args),
        extraArgs,
    };
    rpcSendRequest(ws, 1, method, params);
}
function rigMinerRunStop(ws, args = [], config = {}) {
    const minerNameS = (0, utils_1.getOpts)('--miner-stop', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';
    const method = 'rigMinerRunStop';
    const params = {
        miner: minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}
function rigMinerRunInfos(ws, args = [], config = {}) {
    const minerNameS = (0, utils_1.getOpts)('--miner-infos', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';
    const method = 'rigMinerRunInfos';
    const params = {
        miner: minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}
/* #### NODE #### */
function nodeStatus(ws, args = [], config = {}) {
    const method = 'nodeStatus';
    rpcSendRequest(ws, 1, method, {});
}
function nodeMonitorStart(ws, args = [], config = {}) {
    const method = 'nodeMonitorStart';
    rpcSendRequest(ws, 1, method, {});
}
function nodeMonitorStop(ws, args = [], config = {}) {
    const method = 'nodeMonitorStop';
    rpcSendRequest(ws, 1, method, {});
}
function nodeMonitorStatus(ws, args = [], config = {}) {
    const method = 'nodeMonitorStatus';
    rpcSendRequest(ws, 1, method, {});
}
function nodeFullnodeInstallStart(ws, args = [], config = {}) {
    const fullnodeNameS = (0, utils_1.getOpts)('--fullnode-install', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';
    const method = 'nodeFullnodeInstallStart';
    const params = {
        fullnode: fullnodeName,
        alias: (0, utils_1.getOpt)('-alias', args) || fullnodeName,
    };
    rpcSendRequest(ws, 1, method, params);
}
function nodeFullnodeRunStart(ws, args = [], config = {}) {
    const fullnodeNameS = (0, utils_1.getOpts)('--fullnode-start', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';
    const extraArgs = (0, utils_1.getOpts)('--', -1, args);
    const method = 'nodeFullnodeRunStart';
    const params = {
        fullnode: fullnodeName,
        extraArgs,
    };
    rpcSendRequest(ws, 1, method, params);
}
function nodeFullnodeRunStop(ws, args = [], config = {}) {
    const fullnodeNameS = (0, utils_1.getOpts)('--fullnode-stop', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';
    const method = 'nodeFullnodeRunStop';
    const params = {
        fullnode: fullnodeName,
    };
    rpcSendRequest(ws, 1, method, params);
}
function nodeFullnodeRunInfos(ws, args = [], config = {}) {
    const fullnodeNameS = (0, utils_1.getOpts)('--fullnode-infos', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';
    const method = 'nodeFullnodeRunInfos';
    const params = {
        fullnode: fullnodeName,
    };
    rpcSendRequest(ws, 1, method, params);
}
/* #### MISC #### */
function safeQuit() {
    process.exit();
}
function catchSignals() {
    process.on('SIGINT', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log(`${(0, utils_1.now)()} [INFO] [CLI] CTRL+C detected`);
        safeQuit();
    }));
    process.on('SIGQUIT', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log(`${(0, utils_1.now)()} [INFO] [CLI] Keyboard quit detected`);
        safeQuit();
    }));
    process.on('SIGTERM', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log(`${(0, utils_1.now)()} [INFO] [CLI] Kill detected`);
        safeQuit();
    }));
    process.on('unhandledRejection', (err, p) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        // Handle unhandled promises directly
        console.error(`${(0, utils_1.now)()} [ERROR] [CLI] Error 'unhandledRejection' detected in promise : ${err.message}`);
        if (err.message.startsWith("Timeout error: ping")) {
            return;
        }
        console.log(p);
        //debugger;
        safeQuit();
    }));
}
