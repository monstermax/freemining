
import colors from 'colors/safe';
//import * as WebSocket from 'ws';
import WebSocket from 'ws';

import { loadCliConfig } from './Config';
import { now, hasOpt, getOpt, getOpts, buildRpcRequest, buildRpcResponse, buildRpcError } from '../common/utils';
import { getSystemInfos } from '../common/sysinfos';

import type *  as t from '../common/types';


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


function usage(exitCode: number | null=null) {
    const _usage = 
`======================
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


export function run(args: (t.CliParamsAll)[] = []): void {
    if (hasOpt('--help', args)) {
        usage(0);
    }

    if (args.length === 0) {
        usage(0);
    }

    catchSignals();

    let config = loadCliConfig(args);

    let func: any = null;

    if (hasOpt('--sysinfos')) {
        if (hasOpt('--local')) {
            showSysInfos();
            return;
        }

        func = function (this: WebSocket) {
            return sysInfos(this, args);
        }
    }

    /* RIG */
    if (func) {
        // func already set

    } else if (hasOpt('--rig-infos')) {
        func = function (this: WebSocket) {
            return rigGetInfos(this, args);
        }

    } else if (hasOpt('--rig-monitor-start')) {
        func = function (this: WebSocket) {
            return rigMonitorStart(this, args);
        }

    } else if (hasOpt('--rig-monitor-stop')) {
        func = function (this: WebSocket) {
            return rigMonitorStop(this, args);
        }

    } else if (hasOpt('--rig-monitor-status')) {
        func = function (this: WebSocket) {
            return rigMonitorGetStatus(this, args);
        }

    } else if (hasOpt('--rig-farm-agent-start')) {
        func = function (this: WebSocket) {
            return rigFarmAgentStart(this, args);
        }

    } else if (hasOpt('--rig-farm-agent-stop')) {
        func = function (this: WebSocket) {
            return rigFarmAgentStop(this, args);
        }

    } else if (hasOpt('--rig-farm-agent-status')) {
        func = function (this: WebSocket) {
            return rigFarmAgentGetStatus(this, args);
        }

    } else if (hasOpt('--rig-miner-stop')) {
        func = function (this: WebSocket) {
            return rigMinerRunStop(this, args);
        }

    } else if (hasOpt('--rig-miner-start')) {
        func = function (this: WebSocket) {
            return rigMinerRunStart(this, args);
        }

    } else if (hasOpt('--rig-miner-status')) {
        func = function (this: WebSocket) {
            return rigMinerRunGetStatus(this, args);
        }

    } else if (hasOpt('--rig-miner-log')) {
        func = function (this: WebSocket) {
            return rigMinerRunGetLog(this, args);
        }

    } else if (hasOpt('--rig-miner-infos')) {
        func = function (this: WebSocket) {
            return rigMinerRunInfos(this, args);
        }

    } else if (hasOpt('--rig-miner-install')) {
        func = function (this: WebSocket) {
            return rigMinerInstallStart(this, args);
        }
    }


    /* FARM */
    if (func) {
        // func already set

    } else if (hasOpt('--farm-infos')) {
        // TODO

    } else if (hasOpt('--farm-server-start')) {
        // TODO

    } else if (hasOpt('--farm-server-stop')) {
        // TODO

    }


    /* NODE */
    if (func) {
        // func already set

    } else if (hasOpt('--node-infos')) {
        func = function (this: WebSocket) {
            return nodeGetStatus(this, args);
        }

    } else if (hasOpt('--node-monitor-start')) {
        func = function (this: WebSocket) {
            return nodeMonitorStart(this, args);
        }

    } else if (hasOpt('--node-monitor-stop')) {
        func = function (this: WebSocket) {
            return nodeMonitorStop(this, args);
        }

    } else if (hasOpt('--node-monitor-status')) {
        func = function (this: WebSocket) {
            return nodeMonitorGetStatus(this, args);
        }

    } else if (hasOpt('--node-fullnode-stop')) {
        func = function (this: WebSocket) {
            return nodeFullnodeRunStop(this, args);
        }

    } else if (hasOpt('--node-fullnode-start')) {
        func = function (this: WebSocket) {
            return nodeFullnodeRunStart(this, args);
        }

    } else if (hasOpt('--node-fullnode-status')) {
        func = function (this: WebSocket) {
            return nodeFullnodeRunGetStatus(this, args);
        }

    } else if (hasOpt('--node-fullnode-log')) {
        func = function (this: WebSocket) {
            return nodeFullnodeRunLog(this, args);
        }

    } else if (hasOpt('--node-fullnode-infos')) {
        func = function (this: WebSocket) {
            return nodeFullnodeRunInfos(this, args);
        }

    } else if (hasOpt('--node-fullnode-install')) {
        func = function (this: WebSocket) {
            return nodeFullnodeInstallStart(this, args);
        }
    }


    /* POOL */
    if (func) {
        // func already set

    } else if (hasOpt('--pool-infos')) {
        // TODO

    } else if (hasOpt('--pool-monitor-start')) {
        // TODO

    } else if (hasOpt('--pool-monitor-stop')) {
        // TODO

    }


    if (func === null ) {
        usage(0);
        return;
    }


    let ws: WebSocket;

    try {
        ws = new WebSocket(`ws://${config.wsServerHost}:${config.wsServerPort}/`);

    } catch (err: any) {
        console.log(`${now()} [${colors.red('ERROR')}] [CLI] cannot connect to websocket server`);
        return;
    }


    ws.on('error', function (err: any) {
        console.log(`${now()} [${colors.red('ERROR')}] [CLI] connection error with websocket server => ${err.message}`);
        ws.terminate();
    });


    ws.on('open', async function open() {
        if (typeof func === 'function') {
            func.call(this); // send request
            // ...then wait for server response...

        } else {
            ws.close();
        }
    });


    // Handle incoming message from server
    ws.on('message', async function message(data: Buffer) {
        const messageJson = data.toString();

        // try
        const message: t.RpcResponse | t.RpcRequest = JSON.parse(messageJson);

        if ('error' in message) {
            //console.warn(`${now()} [${colors.blue('WARNING')}] [CLI] received error from server : \n${messageJson}`);
            const err: t.RpcError = JSON.parse(messageJson);
            console.warn(`Error: ${err.error.message}`);
            ws.close();

        } else if ('result' in message) {
            //console.debug(`${now()} [${colors.blue('DEBUG')}] [CLI] received response from server : \n${messageJson}`);
            const res: t.RpcResponse = JSON.parse(messageJson);
            console.log( JSON.stringify(res.result) );
            ws.close();

        } else if ('method' in message && 'params' in message) {
            //console.log(`${now()} [${colors.blue('INFO')}] [CLI] received request from server : \n${messageJson}`);
            //const req: t.RpcRequest = JSON.parse(messageJson);

        } else {
            //console.warn(`${now()} [${colors.blue('WARNING')}] [CLI] received invalid message from server : \n${messageJson}`);
            //console.warn(`${now()} [${colors.blue('WARNING')}] [CLI] received invalid message from server`);
            console.warn(`Error: received invalid message from server`);
            console.log(messageJson);
            ws.close();
        }

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




function rpcSendRequest(ws: WebSocket, id: number, method: string, params: any) {
    const req: t.RpcRequest = buildRpcRequest(id, method, params);
    const reqStr = JSON.stringify(req);
    //console.debug(`${now()} [DEBUG] [CLI] sending request: ${reqStr}`);
    ws.send(reqStr);
}


function rpcSendResponse(ws: WebSocket, id: number, result: any) {
    const res: t.RpcResponse = buildRpcResponse(id, result);
    const resStr = JSON.stringify(res);
    //console.debug(`${now()} [DEBUG] [CLI] sending response: ${resStr}`);
    ws.send(resStr);
}


function rpcSendError(ws: WebSocket, id: number, result: any) {
    const err: t.RpcError = buildRpcError(id, result);
    const errStr = JSON.stringify(err);
    //console.debug(`${now()} [DEBUG] [CLI] sending error: ${errStr}`);
    ws.send(errStr);
}




/* #### CORE #### */

function sysInfos(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const method = 'sysInfos';
    rpcSendRequest(ws, 1, method, {});
}


/* #### RIG #### */

function rigGetInfos(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const method = 'rigGetInfos';
    rpcSendRequest(ws, 1, method, {});
}

function rigMonitorStart(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const method = 'rigMonitorStart';
    rpcSendRequest(ws, 1, method, {});
}

function rigMonitorStop(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const method = 'rigMonitorStop';
    rpcSendRequest(ws, 1, method, {});
}

function rigMonitorGetStatus(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const method = 'rigMonitorGetStatus';
    rpcSendRequest(ws, 1, method, {});
}

function rigFarmAgentStart(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const method = 'rigFarmAgentStart';
    rpcSendRequest(ws, 1, method, {});
}

function rigFarmAgentStop(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const method = 'rigFarmAgentStop';
    rpcSendRequest(ws, 1, method, {});
}

function rigFarmAgentGetStatus(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const method = 'rigFarmAgentGetStatus';
    rpcSendRequest(ws, 1, method, {});
}


function rigMinerInstallStart(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const minerNameS = getOpts('--rig-miner-install', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';

    const method = 'rigMinerInstallStart';
    const params: any = {
        miner: minerName,
        version: getOpt('--version', args),
        alias: getOpt('--alias', args), // default is ${miner}-${version}
        default: hasOpt('--default', args), // install as default version of the miner
    };
    rpcSendRequest(ws, 1, method, params);
}


function rigMinerRunStart(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const minerNameS = getOpts('--rig-miner-start', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';
    const extraArgs = getOpts('--', -1, args);

    const method = 'rigMinerRunStart';
    const params: any = {
        miner: minerName,
        algo: getOpt('-algo', args),
        poolUrl: getOpt('-url', args),
        poolUser: getOpt('-user', args),
        extraArgs,
    };
    rpcSendRequest(ws, 1, method, params);
}


function rigMinerRunStop(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const minerNameS = getOpts('--rig-miner-stop', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';

    const method = 'rigMinerRunStop';
    const params: any = {
        miner: minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}


function rigMinerRunGetStatus(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const minerNameS = getOpts('--rig-miner-status', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';

    const method = 'rigMinerRunGetStatus';
    const params: any = {
        miner: minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}

function rigMinerRunGetLog(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const minerNameS = getOpts('--rig-miner-log', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';

    const method = 'rigMinerRunGetLog';
    const params: any = {
        miner: minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}


function rigMinerRunInfos(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const minerNameS = getOpts('--rig-miner-infos', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';

    const method = 'rigMinerRunGetInfos';
    const params: any = {
        miner: minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}


/* #### NODE #### */

function nodeGetStatus(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const method = 'nodeGetStatus';
    rpcSendRequest(ws, 1, method, {});
}

function nodeMonitorStart(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const method = 'nodeMonitorStart';
    rpcSendRequest(ws, 1, method, {});
}

function nodeMonitorStop(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const method = 'nodeMonitorStop';
    rpcSendRequest(ws, 1, method, {});
}

function nodeMonitorGetStatus(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const method = 'nodeMonitorGetStatus';
    rpcSendRequest(ws, 1, method, {});
}


function nodeFullnodeInstallStart(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const fullnodeNameS = getOpts('--fullnode-install', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';

    const method = 'nodeFullnodeInstallStart';
    const params: any = {
        fullnode: fullnodeName,
        version: getOpt('--version', args),
        alias: getOpt('--alias', args), // default is ${fullnode}-${version}
        default: hasOpt('--default', args), // install as default version of the fullnode
    };
    rpcSendRequest(ws, 1, method, params);
}


function nodeFullnodeRunStart(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const fullnodeNameS = getOpts('--fullnode-start', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';
    const extraArgs = getOpts('--', -1, args);

    const method = 'nodeFullnodeRunStart';
    const params: any = {
        fullnode: fullnodeName,
        extraArgs,
    };
    rpcSendRequest(ws, 1, method, params);
}


function nodeFullnodeRunStop(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const fullnodeNameS = getOpts('--fullnode-stop', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';

    const method = 'nodeFullnodeRunStop';
    const params: any = {
        fullnode: fullnodeName,
    };
    rpcSendRequest(ws, 1, method, params);
}


function nodeFullnodeRunGetStatus(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const fullnodeNameS = getOpts('--fullnode-status', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';

    const method = 'nodeFullnodeRunGetStatus';
    const params: any = {
        fullnode: fullnodeName,
    };
    rpcSendRequest(ws, 1, method, params);
}


function nodeFullnodeRunLog(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const fullnodeNameS = getOpts('--fullnode-log', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';

    const method = 'nodeFullnodeRunLog';
    const params: any = {
        fullnode: fullnodeName,
    };
    rpcSendRequest(ws, 1, method, params);
}


function nodeFullnodeRunInfos(ws: WebSocket, args: (t.CliParamsAll)[] = []) {
    const fullnodeNameS = getOpts('--fullnode-infos', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';

    const method = 'nodeFullnodeRunGetInfos';
    const params: any = {
        fullnode: fullnodeName,
    };
    rpcSendRequest(ws, 1, method, params);
}






/* #### MISC #### */

function safeQuit() {
	process.exit();
}


function catchSignals() {
    process.on('SIGINT', async () => {
        console.log(`${now()} [INFO] [CLI] CTRL+C detected`);
        safeQuit();
    });
    process.on('SIGQUIT', async () => {
        console.log(`${now()} [INFO] [CLI] Keyboard quit detected`);
        safeQuit();
    });
    process.on('SIGTERM', async () => {
        console.log(`${now()} [INFO] [CLI] Kill detected`);
        safeQuit();
    });

    process.on('unhandledRejection', async (err: any, p) => {
        // Handle unhandled promises directly
        console.error(`${now()} [ERROR] [CLI] Error 'unhandledRejection' detected in promise : ${err.message}`);

        if (err.message.startsWith("Timeout error: ping")) {
            return;
        }

        console.log(p);

        //debugger;
        safeQuit();
    });
}



async function showSysInfos() {
    const sysInfos = await getSystemInfos();

    if (hasOpt('--json')) {
        console.log( JSON.stringify(sysInfos) );

    } else {
        console.log(sysInfos);
    }
}

