
import os from 'os';
import fs, { mkdirSync } from 'fs';
import path from 'path';

import { now, hasOpt, getOpt, stringTemplate, getLocalIpAddresses } from '../common/utils';

import type *  as t from '../common/types';


/* ########## MAIN ######### */

const SEP = path.sep;


// daemon options
const defaultListenAddress: string = '0.0.0.0';
const defaultListenPort: number = 1234;
const defaultWssConnTimeout: number = 10_000; // disconnect clients who dont pong after x seconds

const defaultHttpStaticDir: string = `${__dirname}${SEP}..${SEP}..${SEP}web${SEP}public`;
const defaultHttpTemplatesDir: string = `${__dirname}${SEP}..${SEP}..${SEP}web${SEP}templates`;

const userHomeDir: string = os.userInfo().homedir.replaceAll(path.sep, SEP);
const defaultUserFrmDirUnix: string = `${userHomeDir}${SEP}.freemining-beta`;
const defaultUserFrmDirWin: string = `${userHomeDir}${SEP}AppData${SEP}Local${SEP}freemining-beta`;
const defaultUserFrmDir = (os.platform() === 'win32') ? defaultUserFrmDirWin : defaultUserFrmDirUnix;

// cli options
const defaultCliWsServerHost: string = '127.0.0.1';
const defaultCliWsServerPort: number = defaultListenPort;
const defaultCliWsConnTimeout: number = 2_000; // maximum delay to wait for server response

const hostname = os.hostname();
const defaultRigName = `${hostname}-rig-01`;
const defaultFarmName = `${hostname}-farm-01`;
const defaultNodeName = `${hostname}-node-01`;
const defaultPoolName = `${hostname}-pool-01`;


/* ########## FUNCTIONS ######### */


export function loadCliConfig(args: t.CliParamsAll[]): t.CliConfigAll {
    let wsServerHost = defaultCliWsServerHost;
    let wsServerPort = defaultCliWsServerPort;
    let wsConnTimeout = defaultCliWsConnTimeout;

    // set wsServerHost
    if (hasOpt('--ws-server-host', args)) {
        wsServerHost = getOpt('--ws-server-host', args) || '';
    }
    if (wsServerHost === '') {
        console.error(`${now()} [ERROR] invalid ws-server-host`);
        process.exit(1);
    }

    // set wsServerPort
    if (hasOpt('--ws-server-port', args)) {
        wsServerPort = Number(getOpt('--ws-server-port', args)) || 0;
    }
    if (wsServerPort === 0) {
        console.error(`${now()} [ERROR] invalid ws-server-port`);
        process.exit(1);
    }

    // set wsConnTimeout
    if (hasOpt('--ws-conn-timeout', args)) {
        wsConnTimeout = Number(getOpt('--ws-conn-timeout', args) || '');
    }
    if (wsConnTimeout === 0 || Number.isNaN(wsConnTimeout)) {
        console.error(`${now()} [ERROR] invalid ws-conn-timeout`);
        process.exit(1);
    }

    return {
        wsServerHost,
        wsServerPort,
        wsConnTimeout,
        _args: args,
    } as t.CliConfigAll;
}


export function loadDaemonConfig(args: (t.DaemonParamsAll)[]): t.DaemonConfigAll {
    let listenAddress = defaultListenAddress;
    let listenPort = defaultListenPort;
    let wssConnTimeout = defaultWssConnTimeout;

    let httpStaticDir = defaultHttpStaticDir;
    let httpTemplatesDir = defaultHttpTemplatesDir;
    let userFrmDir =  defaultUserFrmDir;

    let freeminingVersion = require(`${__dirname}${SEP}..${SEP}..${SEP}package.json`).version;

    // set userFrmDir
    if (hasOpt('--user-dir', args)) {
        userFrmDir = getOpt('--user-dir', args) || '';
    }
    if (userFrmDir === '') {
        console.error(`${now()} [ERROR] [CONFIG] missing user-dir`);
        process.exit(1);
    }

    //userFrmDir = stringTemplate(userFrmDir, {}, false, false, true) || ''; // OK on Linux
    userFrmDir = stringTemplate(userFrmDir.replaceAll('\\', '\\\\'), {}, false, false, true) || ''; // OK on Linux & Windows

    if (! fs.existsSync(userFrmDir)) {
        try {
            fs.mkdirSync(userFrmDir);
            console.error(`${now()} [INFO] [CONFIG] user-dir created : ${userFrmDir}`);

        } catch (err: any) {
            console.error(`${now()} [ERROR] [CONFIG] cannot create user-dir ${userFrmDir}`);
            process.exit(1);
        }
    }


    let appDir = `${userFrmDir}${SEP}app`;
    let confDir = `${userFrmDir}${SEP}config`;

    if (! fs.existsSync(confDir)) {
        try {
            fs.mkdirSync(confDir);
            console.error(`${now()} [INFO] [CONFIG] conf-dir created : ${confDir}`);

        } catch (err: any) {
            console.error(`${now()} [ERROR] [CONFIG] cannot create conf-dir ${confDir}`);
            process.exit(1);
        }
    }


    let dataDir = `${userFrmDir}${SEP}data`;
    if (! fs.existsSync(dataDir)) {
        try {
            fs.mkdirSync(dataDir);
            console.error(`${now()} [INFO] [CONFIG] data-dir created : ${dataDir}`);

        } catch (err: any) {
            console.error(`${now()} [ERROR] [CONFIG] cannot create data-dir ${dataDir}`);
            process.exit(1);
        }
    }


    let logDir = `${userFrmDir}${SEP}log`;
    if (! fs.existsSync(logDir)) {
        try {
            fs.mkdirSync(logDir);
            console.error(`${now()} [INFO] [CONFIG] log-dir created : ${logDir}`);

        } catch (err: any) {
            console.error(`${now()} [ERROR] [CONFIG] cannot create log-dir ${logDir}`);
            process.exit(1);
        }
    }


    let pidDir = `${userFrmDir}${SEP}run`;
    if (! fs.existsSync(pidDir)) {
        try {
            fs.mkdirSync(pidDir);
            console.error(`${now()} [INFO] [CONFIG] pid-dir created : ${pidDir}`);

        } catch (err: any) {
            console.error(`${now()} [ERROR] [CONFIG] cannot create pid-dir ${pidDir}`);
            process.exit(1);
        }
    }


    // Read core config
    const coreConfigFile = `${confDir}${SEP}freemining.json`;
    if (fs.existsSync(coreConfigFile)) {
        const coreConfigJson = fs.readFileSync(coreConfigFile).toString();
        try {
            const coreConfig = JSON.parse(coreConfigJson);

            listenAddress = coreConfig.listenAddress || listenAddress;
            listenPort = coreConfig.listenPort || listenPort;
            wssConnTimeout = coreConfig.wssConnTimeout || wssConnTimeout;

        } catch (err: any) {
            console.warn(`${now()} [WARNING] [CONFIG] cannot read core config: ${err.message}`);
        }

    } else {
        console.log(`${now()} [INFO] [CONFIG] creating core config file ${coreConfigFile}`);
    }

    // Rewrite core config file
    const coreConfig = {
        listenAddress,
        listenPort,
        wssConnTimeout,
        version: freeminingVersion,
    };
    fs.writeFileSync(coreConfigFile, JSON.stringify(coreConfig, null, 4));


    // set listenAddress
    if (hasOpt('--listen-address', args)) {
        listenAddress = getOpt('--listen-address', args) || '';
    }
    if (listenAddress === '') {
        console.error(`${now()} [ERROR] [CONFIG] missing listen-address`);
        process.exit(1);
    }
    if (listenAddress !== '0.0.0.0') {
        const localIpAddresses = getLocalIpAddresses();
        if (! localIpAddresses.includes(listenAddress)) {
            console.error(`${now()} [ERROR] [CONFIG] invalid listen-address`);
            process.exit(1);
        }
    }

    // set listenPort
    if (hasOpt('--listen-port', args)) {
        listenPort = Number(getOpt('--listen-port', args) || '');
    }
    if (listenPort === 0 || Number.isNaN(listenPort)) {
        console.error(`${now()} [ERROR] [CONFIG] invalid listen-port`);
        process.exit(1);
    }

    // set wssConnTimeout
    if (hasOpt('--wss-conn-timeout', args)) {
        wssConnTimeout = Number(getOpt('--wss-conn-timeout', args) || '');
    }
    if (wssConnTimeout === 0 || Number.isNaN(wssConnTimeout)) {
        console.error(`${now()} [ERROR] [CONFIG] invalid wss-conn-timeout`);
        process.exit(1);
    }


    // Read rig config
    let rigName = defaultRigName;
    let farmAgentHost = '';
    let farmAgentPort = 0;
    let farmAgentPass = '';

    const rigConfigFile = `${confDir}${SEP}rig${SEP}rig.json`;
    mkdirSync(`${confDir}${SEP}rig${SEP}`, { recursive: true });
    if (fs.existsSync(rigConfigFile)) {
        const rigConfigJson = fs.readFileSync(rigConfigFile).toString();
        try {
            const rigConfig = JSON.parse(rigConfigJson);

            rigName = rigConfig.name || defaultRigName;
            farmAgentHost = rigConfig.farmAgent?.Host || farmAgentHost;
            farmAgentPort = rigConfig.farmAgent?.Port || farmAgentPort;
            farmAgentPass = rigConfig.farmAgent?.Pass || farmAgentPass;

        } catch (err: any) {
            console.warn(`${now()} [WARNING] [CONFIG] cannot read rig config: ${err.message}`);
        }

    } else {
        console.log(`${now()} [INFO] [CONFIG] creating rig config file ${rigConfigFile}`);
    }

    // Rewrite rig config file
    const rigConfig: t.rigConfig = {
        name: rigName,
        farmAgent: {
            host: farmAgentHost,
            port: farmAgentPort,
            pass: farmAgentPass,
        },
    };
    fs.writeFileSync(rigConfigFile, JSON.stringify(rigConfig, null, 4));


    // Read farm config
    let farmName = defaultFarmName;

    const farmConfigFile = `${confDir}${SEP}farm${SEP}farm.json`;
    mkdirSync(`${confDir}${SEP}farm${SEP}`, { recursive: true });
    if (fs.existsSync(farmConfigFile)) {
        const farmConfigJson = fs.readFileSync(farmConfigFile).toString();
        try {
            const farmConfig = JSON.parse(farmConfigJson);

            farmName = farmConfig.name || defaultFarmName;

        } catch (err: any) {
            console.warn(`${now()} [WARNING] [CONFIG] cannot read farm config: ${err.message}`);
        }

    } else {
        console.log(`${now()} [INFO] [CONFIG] creating farm config file ${farmConfigFile}`);
    }

    // Rewrite farm config file
    const farmConfig: t.farmConfig = {
        name: farmName,
    };
    fs.writeFileSync(farmConfigFile, JSON.stringify(farmConfig, null, 4));


    // Read node config
    let nodeName = defaultNodeName;

    const nodeConfigFile = `${confDir}${SEP}node${SEP}node.json`;
    mkdirSync(`${confDir}${SEP}node${SEP}`, { recursive: true });
    if (fs.existsSync(nodeConfigFile)) {
        const nodeConfigJson = fs.readFileSync(nodeConfigFile).toString();
        try {
            const nodeConfig = JSON.parse(nodeConfigJson);

            nodeName = nodeConfig.name || defaultNodeName;

        } catch (err: any) {
            console.warn(`${now()} [WARNING] [CONFIG] cannot read node config: ${err.message}`);
        }

    } else {
        console.log(`${now()} [INFO] [CONFIG] creating node config file ${nodeConfigFile}`);
    }

    // Rewrite node config file
    const nodeConfig: t.nodeConfig = {
        name: nodeName,
    };
    fs.writeFileSync(nodeConfigFile, JSON.stringify(nodeConfig, null, 4));


    // Read pool config
    let poolName = defaultPoolName;

    const poolConfigFile = `${confDir}${SEP}pool${SEP}pool.json`;
    mkdirSync(`${confDir}${SEP}pool${SEP}`, { recursive: true });
    if (fs.existsSync(poolConfigFile)) {
        const poolConfigJson = fs.readFileSync(poolConfigFile).toString();
        try {
            const poolConfig = JSON.parse(poolConfigJson);

            poolName = poolConfig.name || defaultPoolName;

        } catch (err: any) {
            console.warn(`${now()} [WARNING] [CONFIG] cannot read pool config: ${err.message}`);
        }

    } else {
        console.log(`${now()} [INFO] [CONFIG] creating pool config file ${poolConfigFile}`);
    }

    // Rewrite pool config file
    const poolConfig: t.poolConfig = {
        name: poolName,
    };
    fs.writeFileSync(poolConfigFile, JSON.stringify(poolConfig, null, 4));




    // TODO: load json config file (cli & daemon. separated cases ?)


    return {
        ...coreConfig,
        appDir,
        confDir,
        dataDir,
        logDir,
        pidDir,
        httpTemplatesDir,
        httpStaticDir,
        rig: rigConfig,
        farm: farmConfig,
        node: nodeConfig,
        pool: poolConfig,
        _args: args,
    } as t.DaemonConfigAll
}



export function loadDaemonRigConfig() {

}


export function loadDaemonFarmConfig() {

}


export function loadDaemonNodeConfig() {

}


export function loadDaemonPoolConfig() {

}
