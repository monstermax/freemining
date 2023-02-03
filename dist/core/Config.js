"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDaemonConfig = exports.loadCliConfig = void 0;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = require("../common/utils");
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
// daemon options
const defaultListenAddress = '0.0.0.0';
const defaultListenPort = 1234;
const defaultWssConnTimeout = 10000; // disconnect clients who dont pong after x seconds
const defaultHttpStaticDir = `${__dirname}${SEP}..${SEP}..${SEP}web${SEP}public`;
const defaultHttpTemplatesDir = `${__dirname}${SEP}..${SEP}..${SEP}web${SEP}templates`;
const userHomeDir = os_1.default.userInfo().homedir.replaceAll(path_1.default.sep, SEP);
const defaultUserFrmDirUnix = `${userHomeDir}${SEP}.freemining-beta`;
const defaultUserFrmDirWin = `${userHomeDir}${SEP}AppData${SEP}Local${SEP}freemining-beta`;
const defaultUserFrmDir = (os_1.default.platform() === 'win32') ? defaultUserFrmDirWin : defaultUserFrmDirUnix;
// cli options
const defaultCliWsServerHost = '127.0.0.1';
const defaultCliWsServerPort = defaultListenPort;
const defaultCliWsConnTimeout = 2000; // maximum delay to wait for server response
const hostname = os_1.default.hostname();
const defaultRigName = `${hostname}-rig-01`;
const defaultFarmName = `${hostname}-farm-01`;
const defaultNodeName = `${hostname}-node-01`;
const defaultPoolName = `${hostname}-pool-01`;
/* ########## FUNCTIONS ######### */
function loadCliConfig(args) {
    let wsServerHost = defaultCliWsServerHost;
    let wsServerPort = defaultCliWsServerPort;
    let wsConnTimeout = defaultCliWsConnTimeout;
    // set wsServerHost
    if ((0, utils_1.hasOpt)('--ws-server-host', args)) {
        wsServerHost = (0, utils_1.getOpt)('--ws-server-host', args) || '';
    }
    if (wsServerHost === '') {
        console.error(`${(0, utils_1.now)()} [ERROR] invalid ws-server-host`);
        process.exit(1);
    }
    // set wsServerPort
    if ((0, utils_1.hasOpt)('--ws-server-port', args)) {
        wsServerPort = Number((0, utils_1.getOpt)('--ws-server-port', args)) || 0;
    }
    if (wsServerPort === 0) {
        console.error(`${(0, utils_1.now)()} [ERROR] invalid ws-server-port`);
        process.exit(1);
    }
    // set wsConnTimeout
    if ((0, utils_1.hasOpt)('--ws-conn-timeout', args)) {
        wsConnTimeout = Number((0, utils_1.getOpt)('--ws-conn-timeout', args) || '');
    }
    if (wsConnTimeout === 0 || Number.isNaN(wsConnTimeout)) {
        console.error(`${(0, utils_1.now)()} [ERROR] invalid ws-conn-timeout`);
        process.exit(1);
    }
    return {
        wsServerHost,
        wsServerPort,
        wsConnTimeout,
        _args: args,
    };
}
exports.loadCliConfig = loadCliConfig;
function loadDaemonConfig(args) {
    let listenAddress = defaultListenAddress;
    let listenPort = defaultListenPort;
    let wssConnTimeout = defaultWssConnTimeout;
    let httpStaticDir = defaultHttpStaticDir;
    let httpTemplatesDir = defaultHttpTemplatesDir;
    let userFrmDir = defaultUserFrmDir;
    // set userFrmDir
    if ((0, utils_1.hasOpt)('--user-dir', args)) {
        userFrmDir = (0, utils_1.getOpt)('--user-dir', args) || '';
    }
    if (userFrmDir === '') {
        console.error(`${(0, utils_1.now)()} [ERROR] missing user-dir`);
        process.exit(1);
    }
    //userFrmDir = stringTemplate(userFrmDir, {}, false, false, true) || ''; // OK on Linux
    userFrmDir = (0, utils_1.stringTemplate)(userFrmDir.replaceAll('\\', '\\\\'), {}, false, false, true) || ''; // OK on Linux & Windows
    if (!fs_1.default.existsSync(userFrmDir)) {
        try {
            fs_1.default.mkdirSync(userFrmDir);
            console.error(`${(0, utils_1.now)()} [INFO] user-dir created : ${userFrmDir}`);
        }
        catch (err) {
            console.error(`${(0, utils_1.now)()} [ERROR] cannot create user-dir ${userFrmDir}`);
            process.exit(1);
        }
    }
    // set appDir
    let appDir = `${userFrmDir}${SEP}app`;
    // set confDir
    let confDir = `${userFrmDir}${SEP}config`;
    /*
    if (hasOpt('--conf-dir', args)) {
        confDir = getOpt('--conf-dir', args) || '';
    }
    if (confDir === '') {
        console.error(`${now()} [ERROR] missing conf-dir`);
        process.exit(1);
    }
    */
    if (!fs_1.default.existsSync(confDir)) {
        try {
            fs_1.default.mkdirSync(confDir);
            console.error(`${(0, utils_1.now)()} [INFO] conf-dir created : ${confDir}`);
        }
        catch (err) {
            console.error(`${(0, utils_1.now)()} [ERROR] cannot create conf-dir ${confDir}`);
            process.exit(1);
        }
    }
    // set dataDir
    let dataDir = `${userFrmDir}${SEP}data`;
    /*
    if (hasOpt('--data-dir', args)) {
        dataDir = getOpt('--data-dir', args) || '';
    }
    if (dataDir === '') {
        console.error(`${now()} [ERROR] missing data-dir`);
        process.exit(1);
    }
    */
    if (!fs_1.default.existsSync(dataDir)) {
        try {
            fs_1.default.mkdirSync(dataDir);
            console.error(`${(0, utils_1.now)()} [INFO] data-dir created : ${dataDir}`);
        }
        catch (err) {
            console.error(`${(0, utils_1.now)()} [ERROR] cannot create data-dir ${dataDir}`);
            process.exit(1);
        }
    }
    // set logDir
    let logDir = `${userFrmDir}${SEP}log`;
    /*
    if (hasOpt('--log-dir', args)) {
        logDir = getOpt('--log-dir', args) || '';
    }
    if (logDir === '') {
        console.error(`${now()} [ERROR] missing log-dir`);
        process.exit(1);
    }
    */
    if (!fs_1.default.existsSync(logDir)) {
        try {
            fs_1.default.mkdirSync(logDir);
            console.error(`${(0, utils_1.now)()} [INFO] log-dir created : ${logDir}`);
        }
        catch (err) {
            console.error(`${(0, utils_1.now)()} [ERROR] cannot create log-dir ${logDir}`);
            process.exit(1);
        }
    }
    // set pidDir
    let pidDir = `${userFrmDir}${SEP}run`;
    /*
    if (hasOpt('--pid-dir', args)) {
        pidDir = getOpt('--pid-dir', args) || '';
    }
    if (pidDir === '') {
        console.error(`${now()} [ERROR] missing pid-dir`);
        process.exit(1);
    }
    */
    if (!fs_1.default.existsSync(pidDir)) {
        try {
            fs_1.default.mkdirSync(pidDir);
            console.error(`${(0, utils_1.now)()} [INFO] pid-dir created : ${pidDir}`);
        }
        catch (err) {
            console.error(`${(0, utils_1.now)()} [ERROR] cannot create pid-dir ${pidDir}`);
            process.exit(1);
        }
    }
    // set listenAddress
    if ((0, utils_1.hasOpt)('--listen-address', args)) {
        listenAddress = (0, utils_1.getOpt)('--listen-address', args) || '';
    }
    if (listenAddress === '') {
        console.error(`${(0, utils_1.now)()} [ERROR] missing listen-address`);
        process.exit(1);
    }
    if (listenAddress !== '0.0.0.0') {
        const localIpAddresses = (0, utils_1.getLocalIpAddresses)();
        if (!localIpAddresses.includes(listenAddress)) {
            console.error(`${(0, utils_1.now)()} [ERROR] invalid listen-address`);
            process.exit(1);
        }
    }
    // set listenPort
    if ((0, utils_1.hasOpt)('--listen-port', args)) {
        listenPort = Number((0, utils_1.getOpt)('--listen-port', args) || '');
    }
    if (listenPort === 0 || Number.isNaN(listenPort)) {
        console.error(`${(0, utils_1.now)()} [ERROR] invalid listen-port`);
        process.exit(1);
    }
    // set wssConnTimeout
    if ((0, utils_1.hasOpt)('--wss-conn-timeout', args)) {
        wssConnTimeout = Number((0, utils_1.getOpt)('--wss-conn-timeout', args) || '');
    }
    if (wssConnTimeout === 0 || Number.isNaN(wssConnTimeout)) {
        console.error(`${(0, utils_1.now)()} [ERROR] invalid wss-conn-timeout`);
        process.exit(1);
    }
    // set rigName
    let rigName = defaultRigName;
    let farmName = defaultFarmName;
    let nodeName = defaultNodeName;
    let poolName = defaultPoolName;
    // TODO: load json config file (cli & daemon. separated cases ?)
    return {
        listenAddress,
        listenPort,
        appDir,
        confDir,
        dataDir,
        logDir,
        pidDir,
        httpTemplatesDir,
        httpStaticDir,
        wssConnTimeout,
        rigName,
        farmName,
        nodeName,
        poolName,
        _args: args,
    };
}
exports.loadDaemonConfig = loadDaemonConfig;
