"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDaemonPoolConfig = exports.loadDaemonNodeConfig = exports.loadDaemonFarmConfig = exports.loadDaemonRigConfig = exports.loadDaemonConfig = exports.loadCliConfig = void 0;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const fs_1 = tslib_1.__importStar(require("fs"));
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
const userHomeDir = os_1.default.userInfo().homedir; //.replace( new RegExp(path.sep, 'g') , SEP);
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
    let httpAllowedIps = [];
    let httpStaticDir = defaultHttpStaticDir;
    let httpTemplatesDir = defaultHttpTemplatesDir;
    let userFrmDir = defaultUserFrmDir;
    console.log(`${(0, utils_1.now)()} [INFO] [DAEMON] Loading config...`);
    let freeminingVersion = require(`${__dirname}${SEP}..${SEP}..${SEP}package.json`).version;
    // set userFrmDir
    if ((0, utils_1.hasOpt)('--user-dir', args)) {
        userFrmDir = (0, utils_1.getOpt)('--user-dir', args) || '';
    }
    if (userFrmDir === '') {
        console.error(`${(0, utils_1.now)()} [ERROR] [CONFIG] missing user-dir`);
        process.exit(1);
    }
    //userFrmDir = stringTemplate(userFrmDir, {}, false, false, true) || ''; // OK on Linux
    userFrmDir = (0, utils_1.stringTemplate)(userFrmDir.replace(new RegExp('\\\\', 'g'), '\\\\'), {}, false, false, true) || ''; // OK on Linux & Windows
    if (!fs_1.default.existsSync(userFrmDir)) {
        try {
            fs_1.default.mkdirSync(userFrmDir);
            console.error(`${(0, utils_1.now)()} [INFO] [CONFIG] user-dir created : ${userFrmDir}`);
        }
        catch (err) {
            console.error(`${(0, utils_1.now)()} [ERROR] [CONFIG] cannot create user-dir ${userFrmDir}`);
            process.exit(1);
        }
    }
    let appDir = `${userFrmDir}${SEP}app`;
    let confDir = `${userFrmDir}${SEP}config`;
    if (!fs_1.default.existsSync(confDir)) {
        try {
            fs_1.default.mkdirSync(confDir);
            console.error(`${(0, utils_1.now)()} [INFO] [CONFIG] conf-dir created : ${confDir}`);
        }
        catch (err) {
            console.error(`${(0, utils_1.now)()} [ERROR] [CONFIG] cannot create conf-dir ${confDir}`);
            process.exit(1);
        }
    }
    let dataDir = `${userFrmDir}${SEP}data`;
    if (!fs_1.default.existsSync(dataDir)) {
        try {
            fs_1.default.mkdirSync(dataDir);
            console.error(`${(0, utils_1.now)()} [INFO] [CONFIG] data-dir created : ${dataDir}`);
        }
        catch (err) {
            console.error(`${(0, utils_1.now)()} [ERROR] [CONFIG] cannot create data-dir ${dataDir}`);
            process.exit(1);
        }
    }
    let logDir = `${userFrmDir}${SEP}log`;
    if (!fs_1.default.existsSync(logDir)) {
        try {
            fs_1.default.mkdirSync(logDir);
            console.error(`${(0, utils_1.now)()} [INFO] [CONFIG] log-dir created : ${logDir}`);
        }
        catch (err) {
            console.error(`${(0, utils_1.now)()} [ERROR] [CONFIG] cannot create log-dir ${logDir}`);
            process.exit(1);
        }
    }
    let pidDir = `${userFrmDir}${SEP}run`;
    if (!fs_1.default.existsSync(pidDir)) {
        try {
            fs_1.default.mkdirSync(pidDir);
            console.error(`${(0, utils_1.now)()} [INFO] [CONFIG] pid-dir created : ${pidDir}`);
        }
        catch (err) {
            console.error(`${(0, utils_1.now)()} [ERROR] [CONFIG] cannot create pid-dir ${pidDir}`);
            process.exit(1);
        }
    }
    // Read core config
    const coreConfigFile = `${confDir}${SEP}freemining.json`;
    if (fs_1.default.existsSync(coreConfigFile)) {
        const coreConfigJson = fs_1.default.readFileSync(coreConfigFile).toString();
        try {
            const coreConfig = JSON.parse(coreConfigJson);
            listenAddress = coreConfig.listenAddress || listenAddress;
            listenPort = coreConfig.listenPort || listenPort;
            wssConnTimeout = coreConfig.wssConnTimeout || wssConnTimeout;
            httpAllowedIps = coreConfig.httpAllowedIps || httpAllowedIps;
        }
        catch (err) {
            console.warn(`${(0, utils_1.now)()} [WARNING] [CONFIG] cannot read core config: ${err.message}`);
        }
    }
    else {
        console.log(`${(0, utils_1.now)()} [INFO] [CONFIG] creating core config file ${coreConfigFile}`);
    }
    // Rewrite core config file
    const coreConfig = {
        listenAddress,
        listenPort,
        wssConnTimeout,
        version: freeminingVersion,
        httpAllowedIps,
    };
    fs_1.default.writeFileSync(coreConfigFile, JSON.stringify(coreConfig, null, 4));
    // set listenAddress
    if ((0, utils_1.hasOpt)('--listen-address', args)) {
        listenAddress = (0, utils_1.getOpt)('--listen-address', args) || '';
    }
    if (listenAddress === '') {
        console.error(`${(0, utils_1.now)()} [ERROR] [CONFIG] missing listen-address`);
        process.exit(1);
    }
    if (listenAddress !== '0.0.0.0') {
        const localIpAddresses = (0, utils_1.getLocalIpAddresses)();
        if (!localIpAddresses.includes(listenAddress)) {
            console.error(`${(0, utils_1.now)()} [ERROR] [CONFIG] invalid listen-address`);
            process.exit(1);
        }
    }
    // set listenPort
    if ((0, utils_1.hasOpt)('--listen-port', args)) {
        listenPort = Number((0, utils_1.getOpt)('--listen-port', args) || '');
    }
    if (listenPort === 0 || Number.isNaN(listenPort)) {
        console.error(`${(0, utils_1.now)()} [ERROR] [CONFIG] invalid listen-port`);
        process.exit(1);
    }
    // set wssConnTimeout
    if ((0, utils_1.hasOpt)('--wss-conn-timeout', args)) {
        wssConnTimeout = Number((0, utils_1.getOpt)('--wss-conn-timeout', args) || '');
    }
    if (wssConnTimeout === 0 || Number.isNaN(wssConnTimeout)) {
        console.error(`${(0, utils_1.now)()} [ERROR] [CONFIG] invalid wss-conn-timeout`);
        process.exit(1);
    }
    const rigConfig = loadDaemonRigConfig(confDir);
    const farmConfig = loadDaemonFarmConfig(confDir);
    const nodeConfig = loadDaemonNodeConfig(confDir);
    const poolConfig = loadDaemonPoolConfig(confDir);
    return Object.assign(Object.assign({}, coreConfig), { appDir,
        confDir,
        dataDir,
        logDir,
        pidDir,
        httpTemplatesDir,
        httpStaticDir, rig: rigConfig, farm: farmConfig, node: nodeConfig, pool: poolConfig, _args: args });
}
exports.loadDaemonConfig = loadDaemonConfig;
function loadDaemonRigConfig(confDir) {
    var _a, _b, _c;
    // Read rig config
    let rigName = defaultRigName;
    let farmAgentHost = '';
    let farmAgentPort = 0;
    let farmAgentPass = '';
    const rigConfigFile = `${confDir}${SEP}rig${SEP}rig.json`;
    if (fs_1.default.existsSync(rigConfigFile)) {
        const rigConfigJson = fs_1.default.readFileSync(rigConfigFile).toString();
        try {
            const rigConfig = JSON.parse(rigConfigJson);
            rigName = rigConfig.name || defaultRigName;
            farmAgentHost = ((_a = rigConfig.farmAgent) === null || _a === void 0 ? void 0 : _a.host) || farmAgentHost;
            farmAgentPort = ((_b = rigConfig.farmAgent) === null || _b === void 0 ? void 0 : _b.port) || farmAgentPort;
            farmAgentPass = ((_c = rigConfig.farmAgent) === null || _c === void 0 ? void 0 : _c.pass) || farmAgentPass;
        }
        catch (err) {
            console.warn(`${(0, utils_1.now)()} [WARNING] [CONFIG] cannot read rig config: ${err.message}`);
        }
    }
    else {
        console.log(`${(0, utils_1.now)()} [INFO] [CONFIG] creating rig config file ${rigConfigFile}`);
    }
    // Rewrite rig config file
    const rigConfig = {
        name: rigName,
        farmAgent: {
            host: farmAgentHost,
            port: farmAgentPort,
            pass: farmAgentPass,
        },
    };
    (0, fs_1.mkdirSync)(`${confDir}${SEP}rig${SEP}`, { recursive: true });
    fs_1.default.writeFileSync(rigConfigFile, JSON.stringify(rigConfig, null, 4));
    const coinsUserconf = loadDaemonRigCoinsUserconfConfig(confDir);
    const coinsMiners = loadDaemonRigCoinsMinersConfig(confDir);
    const miners = loadDaemonRigMinersConfig(confDir);
    return Object.assign(Object.assign({}, rigConfig), { coinsMiners,
        coinsUserconf,
        miners });
}
exports.loadDaemonRigConfig = loadDaemonRigConfig;
function loadDaemonRigCoinsUserconfConfig(confDir) {
    const userconfConfigFile = `${confDir}${SEP}rig${SEP}coins_userconf.json`;
    const userconfConfigDemoFile = `${__dirname}${SEP}..${SEP}..${SEP}config${SEP}rig${SEP}coins_userconf.sample.json`;
    let userconfConfig = {};
    let _configFile = userconfConfigFile;
    if (!fs_1.default.existsSync(userconfConfigFile)) {
        _configFile = userconfConfigDemoFile;
    }
    if (fs_1.default.existsSync(_configFile)) {
        const userconfConfigJson = fs_1.default.readFileSync(_configFile).toString();
        try {
            userconfConfig = JSON.parse(userconfConfigJson);
        }
        catch (err) {
            console.warn(`${(0, utils_1.now)()} [WARNING] [CONFIG] cannot read rig config: ${err.message}`);
        }
    }
    const coinsUserconf = Object.assign({}, userconfConfig);
    (0, fs_1.mkdirSync)(`${confDir}${SEP}rig${SEP}`, { recursive: true });
    fs_1.default.writeFileSync(userconfConfigFile, JSON.stringify(coinsUserconf, null, 4));
    return coinsUserconf;
}
function loadDaemonRigCoinsMinersConfig(confDir) {
    const minersConfigFile = `${confDir}${SEP}rig${SEP}coins_miners.json`;
    const minersConfigDemoFile = `${__dirname}${SEP}..${SEP}..${SEP}config${SEP}rig${SEP}coins_miners.sample.json`;
    let minersConfig = {};
    let _configFile = minersConfigFile;
    if (!fs_1.default.existsSync(minersConfigFile)) {
        _configFile = minersConfigDemoFile;
    }
    if (fs_1.default.existsSync(_configFile)) {
        const minersConfigJson = fs_1.default.readFileSync(_configFile).toString();
        try {
            minersConfig = JSON.parse(minersConfigJson);
        }
        catch (err) {
            console.warn(`${(0, utils_1.now)()} [WARNING] [CONFIG] cannot read rig config: ${err.message}`);
        }
    }
    const coinsMiners = Object.assign({}, minersConfig);
    (0, fs_1.mkdirSync)(`${confDir}${SEP}rig${SEP}`, { recursive: true });
    fs_1.default.writeFileSync(minersConfigFile, JSON.stringify(coinsMiners, null, 4));
    return coinsMiners;
}
function loadDaemonRigMinersConfig(confDir) {
    const minersConfigFile = `${confDir}${SEP}rig${SEP}miners.json`;
    const minersConfigDemoFile = `${__dirname}${SEP}..${SEP}..${SEP}config${SEP}rig${SEP}miners.sample.json`;
    let minersConfig = {};
    let _configFile = minersConfigFile;
    if (!fs_1.default.existsSync(minersConfigFile)) {
        _configFile = minersConfigDemoFile;
    }
    if (fs_1.default.existsSync(_configFile)) {
        const minersConfigJson = fs_1.default.readFileSync(_configFile).toString();
        try {
            minersConfig = JSON.parse(minersConfigJson);
        }
        catch (err) {
            console.warn(`${(0, utils_1.now)()} [WARNING] [CONFIG] cannot read rig config: ${err.message}`);
        }
    }
    const miners = Object.assign({}, minersConfig);
    (0, fs_1.mkdirSync)(`${confDir}${SEP}rig${SEP}`, { recursive: true });
    fs_1.default.writeFileSync(minersConfigFile, JSON.stringify(miners, null, 4));
    return miners;
}
function loadDaemonFarmConfig(confDir) {
    // Read farm config
    let farmName = defaultFarmName;
    let farmWssPassword = '';
    let wssAllowedIps = [];
    const farmConfigFile = `${confDir}${SEP}farm${SEP}farm.json`;
    if (fs_1.default.existsSync(farmConfigFile)) {
        const farmConfigJson = fs_1.default.readFileSync(farmConfigFile).toString();
        try {
            const farmConfig = JSON.parse(farmConfigJson);
            farmName = farmConfig.name || farmName;
            farmWssPassword = farmConfig.wssPass || farmWssPassword;
            wssAllowedIps = farmConfig.wssAllowedIps || wssAllowedIps;
        }
        catch (err) {
            console.warn(`${(0, utils_1.now)()} [WARNING] [CONFIG] cannot read farm config: ${err.message}`);
        }
    }
    else {
        console.log(`${(0, utils_1.now)()} [INFO] [CONFIG] creating farm config file ${farmConfigFile}`);
    }
    // Rewrite farm config file
    const farmConfig = {
        name: farmName,
        wssPass: farmWssPassword,
        wssAllowedIps: [],
    };
    (0, fs_1.mkdirSync)(`${confDir}${SEP}farm${SEP}`, { recursive: true });
    fs_1.default.writeFileSync(farmConfigFile, JSON.stringify(farmConfig, null, 4));
    return farmConfig;
}
exports.loadDaemonFarmConfig = loadDaemonFarmConfig;
function loadDaemonNodeConfig(confDir) {
    // Read node config
    let nodeName = defaultNodeName;
    const nodeConfigFile = `${confDir}${SEP}node${SEP}node.json`;
    if (fs_1.default.existsSync(nodeConfigFile)) {
        const nodeConfigJson = fs_1.default.readFileSync(nodeConfigFile).toString();
        try {
            const nodeConfig = JSON.parse(nodeConfigJson);
            nodeName = nodeConfig.name || defaultNodeName;
        }
        catch (err) {
            console.warn(`${(0, utils_1.now)()} [WARNING] [CONFIG] cannot read node config: ${err.message}`);
        }
    }
    else {
        console.log(`${(0, utils_1.now)()} [INFO] [CONFIG] creating node config file ${nodeConfigFile}`);
    }
    // Rewrite node config file
    const nodeConfig = {
        name: nodeName,
    };
    (0, fs_1.mkdirSync)(`${confDir}${SEP}node${SEP}`, { recursive: true });
    fs_1.default.writeFileSync(nodeConfigFile, JSON.stringify(nodeConfig, null, 4));
    return nodeConfig;
}
exports.loadDaemonNodeConfig = loadDaemonNodeConfig;
function loadDaemonPoolConfig(confDir) {
    // Read pool config
    let poolName = defaultPoolName;
    const poolConfigFile = `${confDir}${SEP}pool${SEP}pool.json`;
    if (fs_1.default.existsSync(poolConfigFile)) {
        const poolConfigJson = fs_1.default.readFileSync(poolConfigFile).toString();
        try {
            const poolConfig = JSON.parse(poolConfigJson);
            poolName = poolConfig.name || defaultPoolName;
        }
        catch (err) {
            console.warn(`${(0, utils_1.now)()} [WARNING] [CONFIG] cannot read pool config: ${err.message}`);
        }
    }
    else {
        console.log(`${(0, utils_1.now)()} [INFO] [CONFIG] creating pool config file ${poolConfigFile}`);
    }
    // Rewrite pool config file
    const poolConfig = {
        name: poolName,
    };
    (0, fs_1.mkdirSync)(`${confDir}${SEP}pool${SEP}`, { recursive: true });
    fs_1.default.writeFileSync(poolConfigFile, JSON.stringify(poolConfig, null, 4));
    return poolConfig;
}
exports.loadDaemonPoolConfig = loadDaemonPoolConfig;
