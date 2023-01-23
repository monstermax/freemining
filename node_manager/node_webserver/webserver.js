"use strict";
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const express_1 = tslib_1.__importDefault(require("express"));
const http = tslib_1.__importStar(require("http"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const utils_1 = require("./common/utils");
/* ############################## MAIN ###################################### */
const app = (0, express_1.default)();
const server = http.createServer(app);
const configNode = require('../node_manager.json');
const configFrm = require('../../freemining.json');
const httpServerHost = ((_a = configNode.nodeServer) === null || _a === void 0 ? void 0 : _a.host) || '0.0.0.0';
const httpServerPort = Number(((_b = configNode.nodeServer) === null || _b === void 0 ? void 0 : _b.port) || 4400);
let staticDir = ((_c = configNode.nodeServer) === null || _c === void 0 ? void 0 : _c.root) || `${__dirname}/web/public`;
let templatesDir = ((_d = configNode.nodeServer) === null || _d === void 0 ? void 0 : _d.templates) || `${__dirname}/web/templates`;
const nodeAppDir = __dirname + '/..'; // configFrm.frmDataDir + '/node';
const ctx = Object.assign(Object.assign(Object.assign({}, configFrm), configNode), { nodeAppDir });
templatesDir = (0, utils_1.stringTemplate)(templatesDir, ctx, false, true, true) || '';
staticDir = (0, utils_1.stringTemplate)(staticDir, ctx, false, true, true) || '';
const layoutPath = `${templatesDir}/layout_node_webserver.html`;
const nodeManagerCmd = `${__dirname}/../node_manager.sh ps`;
const installablesFullnodes = (process.env.INSTALLABLE_FULLNODES || '').split(' ');
const installedFullnodes = (process.env.INSTALLED_FULLNODES || '').split(' ');
const configuredFullnodes = (process.env.CONFIGURED_FULLNODES || '').split(' ');
const toolsDir = `${__dirname}/../tools`;
const cmdFullnode = `${toolsDir}/fullnode.sh`;
const cmdInstallFullnode = `${toolsDir}/install_fullnode.sh`;
const cmdUninstallFullnode = `${toolsDir}/uninstall_fullnode.sh`; // not available
app.use(function (req, res, next) {
    // Log http request
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] ${req.method.toLocaleUpperCase()} ${req.url}`);
    next();
});
app.use(express_1.default.urlencoded({ extended: true }));
if (staticDir) {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Using static folder ${staticDir}`);
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Using templates folder ${templatesDir}`);
    app.use(express_1.default.static(staticDir));
}
app.get('/', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const installablesFullnodes = (process.env.INSTALLABLE_FULLNODES || '').split(' ');
    const installedFullnodes = (process.env.INSTALLED_FULLNODES || '').split(' ');
    const activeProcesses = yield getNodeProcesses();
    const opts = {
        configNode,
        activeProcesses,
        installablesFullnodes,
        installedFullnodes,
    };
    const pageContent = loadTemplate('index.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
app.get('/fullnodes/fullnode-install', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const fullnodeName = req.query.chain || '';
    const action = req.query.action || '';
    const fullnodeStatus = yield getFullnodeStatus(fullnodeName);
    if (action === 'start') {
        if (fullnodeStatus) {
            res.send("Error: cannot re-intall a running fullnode");
            res.end();
            return;
        }
        const ok = yield startFullnodeInstall(fullnodeName);
        if (ok) {
            res.send(`OK: install started`);
        }
        else {
            res.send(`ERROR: cannot start install`);
        }
        res.end();
        return;
    }
    else if (action === 'stop') {
        // TODO: stop install
        res.send(`Error: stop is not available`);
        res.end();
        return;
    }
    else if (action === 'log') {
        // TODO: show install log
        res.send(`Error: log is not available`);
        res.end();
        return;
    }
    const installStatus = yield getFullnodeInstallStatus(fullnodeName);
    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
        installStatus,
    };
    const pageContent = loadTemplate('fullnode_install.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
app.get('/fullnodes/fullnode-uninstall', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const fullnodeName = req.query.chain || '';
    const action = req.query.action || '';
    const fullnodeStatus = yield getFullnodeStatus(fullnodeName);
    if (action === 'start') {
        if (fullnodeStatus) {
            res.send("Error: cannot uninstall a running fullnode");
            res.end();
            return;
        }
        const ok = yield startFullnodeUninstall(fullnodeName);
        if (ok) {
            res.send(`OK: uninstall started`);
        }
        else {
            res.send(`ERROR: cannot start uninstall`);
        }
        res.end();
        return;
    }
    else if (action === 'stop') {
        // TODO: stop uninstall
        res.send(`Error: stop is not available`);
        res.end();
        return;
    }
    else if (action === 'log') {
        // TODO: show uninstall log
        res.send(`Error: log is not available`);
        res.end();
        return;
    }
    const uninstallStatus = yield getFullnodeUninstallStatus(fullnodeName);
    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
        uninstallStatus,
    };
    const pageContent = loadTemplate('fullnode_uninstall.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
app.get('/fullnodes/fullnode', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const fullnodeName = req.query.chain || '';
    const fullnodeStatus = yield getFullnodeStatus(fullnodeName);
    const installStatus = yield getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = yield getFullnodeUninstallStatus(fullnodeName);
    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
        installStatus,
        uninstallStatus,
    };
    const pageContent = loadTemplate('fullnode.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
app.get('/fullnodes/fullnode-status', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const fullnodeName = req.query.chain || '';
    const asJson = req.query.json === "1";
    const rawOutput = req.query.raw === "1";
    const fullnodeStatus = yield getFullnodeStatus(fullnodeName);
    if (rawOutput) {
        if (asJson) {
            res.header({ "Content-Type": "application/json" });
        }
        else {
            res.header({ "Content-Type": "text/plain" });
        }
        res.send(fullnodeStatus);
        res.end();
        return;
    }
    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
    };
    const pageContent = loadTemplate('fullnode_status.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
app.use(function (req, res, next) {
    // Error 404
    console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);
    next();
});
server.listen(httpServerPort, httpServerHost, () => {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Server started on ${httpServerHost}:${httpServerPort}`);
});
/* ############################ FUNCTIONS ################################### */
function loadTemplate(tplFile, data = {}, currentUrl = '') {
    const tplPath = `${templatesDir}/${tplFile}`;
    if (!fs_1.default.existsSync(tplPath)) {
        return null;
    }
    let content = '';
    try {
        const layoutTemplate = fs_1.default.readFileSync(tplPath).toString();
        content = (0, utils_1.stringTemplate)(layoutTemplate, data) || '';
    }
    catch (err) {
        content = `Error: ${err.message}`;
    }
    const pageContent = (0, utils_1.applyHtmlLayout)(content, data, layoutPath, currentUrl);
    return pageContent;
}
function getNodeProcesses() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = nodeManagerCmd;
        const result = yield (0, utils_1.cmdExec)(cmd);
        return result || '';
    });
}
function getFullnodeStatus(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = `${cmdFullnode} ${fullnodeName} status`;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        const ret = yield (0, utils_1.cmdExec)(cmd, 10000);
        if (ret) {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ${ret}`);
        }
        else {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ERROR`);
        }
        return !!ret;
    });
}
function startFullnodeInstall(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = `${cmdInstallFullnode} ${fullnodeName} --daemon start`;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        const ret = yield (0, utils_1.cmdExec)(cmd, 10000);
        if (ret) {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ${ret}`);
        }
        else {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ERROR`);
        }
        return !!ret;
    });
}
function stopFullnodeInstall(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = `${cmdInstallFullnode} ${fullnodeName} --daemon stop`;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        const ret = yield (0, utils_1.cmdExec)(cmd, 10000);
        if (ret) {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ${ret}`);
        }
        else {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ERROR`);
        }
        return !!ret;
    });
}
function getFullnodeInstallStatus(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = `${cmdInstallFullnode} ${fullnodeName} --daemon status`;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        const ret = yield (0, utils_1.cmdExec)(cmd, 10000);
        if (ret) {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ${ret}`);
        }
        else {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ERROR`);
        }
        return !!ret;
    });
}
function startFullnodeUninstall(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = `${cmdUninstallFullnode} ${fullnodeName} --daemon start`;
        return false;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        const ret = yield (0, utils_1.cmdExec)(cmd, 10000);
        if (ret) {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ${ret}`);
        }
        else {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ERROR`);
        }
        return !!ret;
    });
}
function stopFullnodeUninstall(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = `${cmdUninstallFullnode} ${fullnodeName} --daemon stop`;
        return false;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        const ret = yield (0, utils_1.cmdExec)(cmd, 10000);
        if (ret) {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ${ret}`);
        }
        else {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ERROR`);
        }
        return !!ret;
    });
}
function getFullnodeUninstallStatus(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = `${cmdInstallFullnode} ${fullnodeName} --daemon status`;
        return false;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        const ret = yield (0, utils_1.cmdExec)(cmd, 10000);
        if (ret) {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ${ret}`);
        }
        else {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ERROR`);
        }
        return !!ret;
    });
}
