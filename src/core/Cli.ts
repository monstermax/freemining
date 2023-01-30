
import colors from 'colors/safe';
//import * as WebSocket from 'ws';
import WebSocket from 'ws';

import { loadConfig } from './Config';
import { now, hasOpt, getOpt, getOpts, buildRpcRequest, buildRpcResponse, buildRpcError } from '../common/utils';

import type *  as t from '../common/types';


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


function usage(exitCode: number | null=null) {
    const _usage = 
`======================
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


export function run(args: (t.CliParams & t.CommonParams & string)[] = []): void {
    if (hasOpt('--help', args)) {
        usage(0);
    }

    if (args.length === 0) {
        usage(0);
    }

    catchSignals();

    let config = loadConfig(args);

    let func: any = null;

    /* RIG */
    if (hasOpt('--rig-status')) {
        func = function (this: WebSocket) {
            return rigStatus(this, args, config);
        }

    } else if (hasOpt('--rig-monitor-start')) {
        func = function (this: WebSocket) {
            return rigMonitorStart(this, args, config);
        }

    } else if (hasOpt('--rig-monitor-stop')) {
        func = function (this: WebSocket) {
            return rigMonitorStop(this, args, config);
        }

    } else if (hasOpt('--rig-monitor-status')) {
        func = function (this: WebSocket) {
            return rigMonitorStatus(this, args, config);
        }

    } else if (hasOpt('--miner-stop')) {
        func = function (this: WebSocket) {
            return rigMinerRunStop(this, args, config);
        }

    } else if (hasOpt('--miner-start')) {
        func = function (this: WebSocket) {
            return rigMinerRunStart(this, args, config);
        }

    } else if (hasOpt('--miner-infos')) {
        func = function (this: WebSocket) {
            return rigMinerRunInfos(this, args, config);
        }

    } else if (hasOpt('--miner-install')) {
        func = function (this: WebSocket) {
            return rigMinerInstallStart(this, args, config);
        }
    }


    /* NODE */
    if (hasOpt('--node-status')) {
        func = function (this: WebSocket) {
            return nodeStatus(this, args, config);
        }

    } else if (hasOpt('--node-monitor-start')) {
        func = function (this: WebSocket) {
            return nodeMonitorStart(this, args, config);
        }

    } else if (hasOpt('--node-monitor-stop')) {
        func = function (this: WebSocket) {
            return nodeMonitorStop(this, args, config);
        }

    } else if (hasOpt('--node-monitor-status')) {
        func = function (this: WebSocket) {
            return nodeMonitorStatus(this, args, config);
        }

    } else if (hasOpt('--fullnode-stop')) {
        func = function (this: WebSocket) {
            return nodeFullnodeRunStop(this, args, config);
        }

    } else if (hasOpt('--fullnode-start')) {
        func = function (this: WebSocket) {
            return nodeFullnodeRunStart(this, args, config);
        }

    } else if (hasOpt('--fullnode-infos')) {
        func = function (this: WebSocket) {
            return nodeFullnodeRunInfos(this, args, config);
        }

    } else if (hasOpt('--fullnode-install')) {
        func = function (this: WebSocket) {
            return nodeFullnodeInstallStart(this, args, config);
        }
    }


    if (func === null ) {
        usage(0);
        return;
    }


    let ws: WebSocket;

    try {
        ws = new WebSocket(`ws://${config.cliWssServerAddress}:${config.listenPort}/`);

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
            console.warn(`${now()} [${colors.blue('WARNING')}] [CLI] received invalid message from server`);
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
    }, config.cliWssConnTimeout);
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




/* #### RIG #### */

function rigStatus(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const method = 'rigStatus';
    rpcSendRequest(ws, 1, method, {});
}

function rigMonitorStart(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const method = 'rigMonitorStart';
    rpcSendRequest(ws, 1, method, {});
}

function rigMonitorStop(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const method = 'rigMonitorStop';
    rpcSendRequest(ws, 1, method, {});
}

function rigMonitorStatus(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const method = 'rigMonitorStatus';
    rpcSendRequest(ws, 1, method, {});
}


function rigMinerInstallStart(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const minerNameS = getOpts('--miner-install', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';

    const method = 'rigMinerInstallStart';
    const params: any = {
        miner: minerName,
        alias: getOpt('-alias', args) || minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}


function rigMinerRunStart(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const minerNameS = getOpts('--miner-start', 1, args);
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


function rigMinerRunStop(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const minerNameS = getOpts('--miner-stop', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';

    const method = 'rigMinerRunStop';
    const params: any = {
        miner: minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}


function rigMinerRunInfos(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const minerNameS = getOpts('--miner-infos', 1, args);
    const minerName = Array.isArray(minerNameS) ? minerNameS[0] : '';

    const method = 'rigMinerRunInfos';
    const params: any = {
        miner: minerName,
    };
    rpcSendRequest(ws, 1, method, params);
}


/* #### NODE #### */

function nodeStatus(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const method = 'nodeStatus';
    rpcSendRequest(ws, 1, method, {});
}

function nodeMonitorStart(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const method = 'nodeMonitorStart';
    rpcSendRequest(ws, 1, method, {});
}

function nodeMonitorStop(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const method = 'nodeMonitorStop';
    rpcSendRequest(ws, 1, method, {});
}

function nodeMonitorStatus(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const method = 'nodeMonitorStatus';
    rpcSendRequest(ws, 1, method, {});
}


function nodeFullnodeInstallStart(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const fullnodeNameS = getOpts('--fullnode-install', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';

    const method = 'nodeFullnodeInstallStart';
    const params: any = {
        fullnode: fullnodeName,
        alias: getOpt('-alias', args) || fullnodeName,
    };
    rpcSendRequest(ws, 1, method, params);
}


function nodeFullnodeRunStart(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
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


function nodeFullnodeRunStop(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const fullnodeNameS = getOpts('--fullnode-stop', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';

    const method = 'nodeFullnodeRunStop';
    const params: any = {
        fullnode: fullnodeName,
    };
    rpcSendRequest(ws, 1, method, params);
}


function nodeFullnodeRunInfos(ws: WebSocket, args: (t.CliParams & t.CommonParams & string)[] = [], config: any = {}) {
    const fullnodeNameS = getOpts('--fullnode-infos', 1, args);
    const fullnodeName = Array.isArray(fullnodeNameS) ? fullnodeNameS[0] : '';

    const method = 'nodeFullnodeRunInfos';
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

