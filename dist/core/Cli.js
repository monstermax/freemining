"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const tslib_1 = require("tslib");
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
//import * as WebSocket from 'ws';
const ws_1 = tslib_1.__importDefault(require("ws"));
const Config_1 = require("./Config");
const utils_1 = require("../common/utils");
const sysinfos_1 = require("../common/sysinfos");
/* ########## USAGE #########

# Install fullnode Dogecoin
./frm-cli-ts --fullnode-install dogecoin

# Install miner Trex
./frm-cli-ts --rig-miner-install trex

# Start rig monitor
./frm-cli-ts --rig-monitor-start

# Stop rig monitor
./frm-cli-ts --rig-monitor-stop

# Get rig infos
./frm-cli-ts --rig-infos


# Start trex on JJPool for ERGO coin
./frm-cli-ts --rig-miner-start trex -algo autolykos2 -url eu.jjpool.fr:3056 -user 9i5bBBR828EUs79bXUJJpNAo6X2fdfigA4XkZvg7nDfPeUdjsRb.test -- -d 0

# Stop trex
./frm-cli-ts --rig-miner-stop trex


# Start xmrig on XMRPool for MONERO coin
./frm-cli-ts --rig-miner-start xmrig -algo rx/0 -url xmrpool.eu:5555 -user 46jYYGCiFQbfyUNWkhMyyB2Jyg1n3yGGPjfYjbjsq6SBarcH66i3RodSiGjJfx2Ue74dUFi4bFwxKaUbt2aurBjJEySsMrH+test

# Start xmrig on JJPool for Raptoreum coin
./frm-cli-ts --rig-miner-start xmrig -algo ghostrider -url jjpool.eu:7070 -user RHKVBwdYEongNGwUj2oBk4yZHx9QEpMyAR.test

# Stop xmrig
./frm-cli-ts --rig-miner-stop xmrig

*/
/* ########## FUNCTIONS ######### */
function usage(exitCode = null) {
    const _usage = `======================
| ⛏️   FreeMining  ⛏️  | => frm-cli
======================

Usage:

frm-cli <params>

        --help                                                 # display this message
        --sysinfos                                             # display server system informations
        --sysinfos [--local]                                   # display cli system informations

        --ws-server-host                                       # daemon host. default 127.0.0.1
        --ws-server-port                                       # daemon port. default 1234
        --ws-conn-timeout                                      # daemon connection timeout. default 2 seconds

    + Rig Manager
        --rig-infos                                            # display rig infos
        --rig-monitor-start                                    # start rig monitor
        --rig-monitor-stop                                     # stop rig monitor
        --rig-monitor-status                                   # display rig monitor status

        --rig-farm-agent-start                                 # start rig farm agent
        --rig-farm-agent-stop                                  # stop rig farm agent
        --rig-farm-agent-status                                # display rig farm agent status

        --rig-miner-start                                      # start a miner
        --rig-miner-stop                                       # stop a miner
        --rig-miner-status                                     # display a miner status
        --rig-miner-log                                        # display a miner logs
        --rig-miner-infos                                      # display a miner infos
        --rig-miner-install [--alias xx] [--version vv]        # install a miner
        --rig-miner-uninstall                                  # uninstall a miner

    + Farm Manager
        --farm-infos                                           # display farm status
        --farm-server-start                                    # start farm server
        --farm-server-stop                                     # stop farm server
        --farm-server-status                                   # display farm server status

    + Node Manager
        --node-infos                                           # display node status
        --node-monitor-start                                   # start node monitor
        --node-monitor-stop                                    # stop node monitor
        --node-monitor-status                                  # display node monitor status

        --node-fullnode-start                                  # start a fullnode
        --node-fullnode-stop                                   # stop a fullnode
        --node-fullnode-status                                 # display a fullnode status
        --node-fullnode-log                                    # display a fullnode logs
        --node-fullnode-infos                                  # display a fullnode infos
        --node-fullnode-install [--alias xx] [--version vv]    # install a fullnode
        --node-fullnode-uninstall                              # uninstall a fullnode

    + Pool Manager
        --pool-infos                                           # display pool status
        --pool-monitor-start                                   # start pool monitor
        --pool-monitor-stop                                    # stop pool monitor
        --pool-monitor-status                                  # display pool monitor status

        --pool-engine-start                                    # start a pool engine
        --pool-engine-stop                                     # stop a pool engine
        --pool-engine-status                                   # display a pool engine status
        --pool-engine-log                                      # display an engine logs
        --pool-engine-infos                                    # display an engine infos
        --pool-engine-install [--alias xx] [--version vv]      # install an engine
        --pool-engine-uninstall                                # uninstall an engine
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
    let config = (0, Config_1.loadCliConfig)(args);
    let func = null;
    if ((0, utils_1.hasOpt)('--sysinfos')) {
        if ((0, utils_1.hasOpt)('--local')) {
            showSysInfos();
            return;
        }
        func = function () {
            return sysInfos(this, args);
        };
    }
    /* RIG */
    if (func) {
        // func already set
    }
    else if ((0, utils_1.hasOpt)('--rig-infos')) {
        func = function () {
            return rigGetInfos(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-monitor-start')) {
        func = function () {
            return rigMonitorStart(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-monitor-stop')) {
        func = function () {
            return rigMonitorStop(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-monitor-status')) {
        func = function () {
            return rigMonitorGetStatus(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-farm-agent-start')) {
        func = function () {
            return rigFarmAgentStart(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-farm-agent-stop')) {
        func = function () {
            return rigFarmAgentStop(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-farm-agent-status')) {
        func = function () {
            return rigFarmAgentGetStatus(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-miner-stop')) {
        func = function () {
            return rigMinerRunStop(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-miner-start')) {
        func = function () {
            return rigMinerRunStart(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-miner-status')) {
        func = function () {
            return rigMinerRunGetStatus(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-miner-log')) {
        func = function () {
            return rigMinerRunGetLog(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-miner-infos')) {
        func = function () {
            return rigMinerRunInfos(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--rig-miner-install')) {
        func = function () {
            return rigMinerInstallStart(this, args);
        };
    }
    /* FARM */
    if (func) {
        // func already set
    }
    else if ((0, utils_1.hasOpt)('--farm-infos')) {
        // TODO
    }
    else if ((0, utils_1.hasOpt)('--farm-server-start')) {
        // TODO
    }
    else if ((0, utils_1.hasOpt)('--farm-server-stop')) {
        // TODO
    }
    /* NODE */
    if (func) {
        // func already set
    }
    else if ((0, utils_1.hasOpt)('--node-infos')) {
        func = function () {
            return nodeGetStatus(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--node-monitor-start')) {
        func = function () {
            return nodeMonitorStart(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--node-monitor-stop')) {
        func = function () {
            return nodeMonitorStop(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--node-monitor-status')) {
        func = function () {
            return nodeMonitorGetStatus(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--node-fullnode-stop')) {
        func = function () {
            return nodeFullnodeRunStop(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--node-fullnode-start')) {
        func = function () {
            return nodeFullnodeRunStart(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--node-fullnode-status')) {
        func = function () {
            return nodeFullnodeRunGetStatus(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--node-fullnode-log')) {
        func = function () {
            return nodeFullnodeRunLog(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--node-fullnode-infos')) {
        func = function () {
            return nodeFullnodeRunInfos(this, args);
        };
    }
    else if ((0, utils_1.hasOpt)('--node-fullnode-install')) {
        func = function () {
            return nodeFullnodeInstallStart(this, args);
        };
    }
    /* POOL */
    if (func) {
        // func already set
    }
    else if ((0, utils_1.hasOpt)('--pool-infos')) {
        // TODO
    }
    else if ((0, utils_1.hasOpt)('--pool-monitor-start')) {
        // TODO
    }
    else if ((0, utils_1.hasOpt)('--pool-monitor-stop')) {
        // TODO
    }
    if (func === null) {
        usage(0);
        return;
    }
    let ws;
    try {
        ws = new ws_1.default(`ws://${config.wsServerHost}:${config.wsServerPort}/`);
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
                //console.warn(`${now()} [${colors.blue('WARNING')}] [CLI] received invalid message from server`);
                console.warn(`Error: received invalid message from server`);
                console.log(messageJson);
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
    }, config.wsConnTimeout);
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
/* #### CORE #### */
function sysInfos(ws, args = []) {
    const method = 'sysInfos';
    rpcSendRequest(ws, 1, method, {});
}
/* #### RIG #### */
function rigGetInfos(ws, args = []) {
    const method = 'rigGetInfos';
    rpcSendRequest(ws, 1, method, {});
}
function rigMonitorStart(ws, args = []) {
    const method = 'rigMonitorStart';
    rpcSendRequest(ws, 1, method, {});
}
function rigMonitorStop(ws, args = []) {
    const method = 'rigMonitorStop';
    rpcSendRequest(ws, 1, method, {});
}
function rigMonitorGetStatus(ws, args = []) {
    const method = 'rigMonitorGetStatus';
    rpcSendRequest(ws, 1, method, {});
}
function rigFarmAgentStart(ws, args = []) {
    const method = 'rigFarmAgentStart';
    rpcSendRequest(ws, 1, method, {});
}
function rigFarmAgentStop(ws, args = []) {
    const method = 'rigFarmAgentStop';
    rpcSendRequest(ws, 1, method, {});
}
function rigFarmAgentGetStatus(ws, args = []) {
    const method = 'rigFarmAgentGetStatus';
    rpcSendRequest(ws, 1, method, {});
}
function rigMinerInstallStart(ws, args = []) {
    const minerNameS = (0, utils_1.getOpts)('--rig-miner-install', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';
    const method = 'rigMinerInstallStart';
    const params = {
        miner: minerName,
        version: (0, utils_1.getOpt)('--version', args),
        alias: (0, utils_1.getOpt)('--alias', args),
        default: (0, utils_1.hasOpt)('--default', args), // install as default version of the miner
    };
    rpcSendRequest(ws, 1, method, params);
}
function rigMinerRunStart(ws, args = []) {
    const minerNameS = (0, utils_1.getOpts)('--rig-miner-start', 1, args);
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
function rigMinerRunStop(ws, args = []) {
    const minerNameS = (0, utils_1.getOpts)('--rig-miner-stop', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';
    const method = 'rigMinerRunStop';
    const params = {
        miner: minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}
function rigMinerRunGetStatus(ws, args = []) {
    const minerNameS = (0, utils_1.getOpts)('--rig-miner-status', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';
    const method = 'rigMinerRunGetStatus';
    const params = {
        miner: minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}
function rigMinerRunGetLog(ws, args = []) {
    const minerNameS = (0, utils_1.getOpts)('--rig-miner-log', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';
    const method = 'rigMinerRunGetLog';
    const params = {
        miner: minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}
function rigMinerRunInfos(ws, args = []) {
    const minerNameS = (0, utils_1.getOpts)('--rig-miner-infos', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';
    const method = 'rigMinerRunGetInfos';
    const params = {
        miner: minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}
/* #### NODE #### */
function nodeGetStatus(ws, args = []) {
    const method = 'nodeGetStatus';
    rpcSendRequest(ws, 1, method, {});
}
function nodeMonitorStart(ws, args = []) {
    const method = 'nodeMonitorStart';
    rpcSendRequest(ws, 1, method, {});
}
function nodeMonitorStop(ws, args = []) {
    const method = 'nodeMonitorStop';
    rpcSendRequest(ws, 1, method, {});
}
function nodeMonitorGetStatus(ws, args = []) {
    const method = 'nodeMonitorGetStatus';
    rpcSendRequest(ws, 1, method, {});
}
function nodeFullnodeInstallStart(ws, args = []) {
    const fullnodeNameS = (0, utils_1.getOpts)('--fullnode-install', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';
    const method = 'nodeFullnodeInstallStart';
    const params = {
        fullnode: fullnodeName,
        version: (0, utils_1.getOpt)('--version', args),
        alias: (0, utils_1.getOpt)('--alias', args),
        default: (0, utils_1.hasOpt)('--default', args), // install as default version of the fullnode
    };
    rpcSendRequest(ws, 1, method, params);
}
function nodeFullnodeRunStart(ws, args = []) {
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
function nodeFullnodeRunStop(ws, args = []) {
    const fullnodeNameS = (0, utils_1.getOpts)('--fullnode-stop', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';
    const method = 'nodeFullnodeRunStop';
    const params = {
        fullnode: fullnodeName,
    };
    rpcSendRequest(ws, 1, method, params);
}
function nodeFullnodeRunGetStatus(ws, args = []) {
    const fullnodeNameS = (0, utils_1.getOpts)('--fullnode-status', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';
    const method = 'nodeFullnodeRunGetStatus';
    const params = {
        fullnode: fullnodeName,
    };
    rpcSendRequest(ws, 1, method, params);
}
function nodeFullnodeRunLog(ws, args = []) {
    const fullnodeNameS = (0, utils_1.getOpts)('--fullnode-log', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';
    const method = 'nodeFullnodeRunLog';
    const params = {
        fullnode: fullnodeName,
    };
    rpcSendRequest(ws, 1, method, params);
}
function nodeFullnodeRunInfos(ws, args = []) {
    const fullnodeNameS = (0, utils_1.getOpts)('--fullnode-infos', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';
    const method = 'nodeFullnodeRunGetInfos';
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
function showSysInfos() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const sysInfos = yield (0, sysinfos_1.getSystemInfos)();
        if ((0, utils_1.hasOpt)('--json')) {
            console.log(JSON.stringify(sysInfos));
        }
        else {
            console.log(sysInfos);
        }
    });
}
