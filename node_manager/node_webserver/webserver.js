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
let installedFullnodes = (process.env.INSTALLED_FULLNODES || '').split(' ');
const configuredFullnodes = (process.env.CONFIGURED_FULLNODES || '').split(' ');
const toolsDir = `${__dirname}/../tools`;
const cmdFullnode = `${toolsDir}/run_fullnode.sh`;
const cmdInstallFullnode = `${toolsDir}/install_fullnode.sh`;
const cmdUninstallFullnode = `${toolsDir}/uninstall_fullnode.sh`;
// LOG HTTP REQUEST
app.use(function (req, res, next) {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] ${req.method.toLocaleUpperCase()} ${req.url}`);
    next();
});
app.use(express_1.default.urlencoded({ extended: true })); // parse POST body
// STATIC DIR
if (staticDir) {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Using static folder ${staticDir}`);
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Using templates folder ${templatesDir}`);
    app.use(express_1.default.static(staticDir));
}
// HOMEPAGE
app.get('/', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const installablesFullnodes = (process.env.INSTALLABLE_FULLNODES || '').split(' ');
    const installedFullnodes = getInstalledFullnodes();
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
// GET FULLNODE
app.get('/fullnodes/fullnode', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const fullnodeName = req.query.chain || '';
    if (!fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }
    const fullnodeStatus = yield getFullnodeStatus(fullnodeName);
    const installStatus = yield getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = yield getFullnodeUninstallStatus(fullnodeName);
    const installedFullnodes = getInstalledFullnodes();
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
// GET FULLNODE-STATUS
app.get('/fullnodes/fullnode-status', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const fullnodeName = req.query.chain || '';
    const asJson = req.query.json === "1";
    const rawOutput = req.query.raw === "1";
    if (!fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }
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
// GET FULLNODE-RUN
app.get('/fullnodes/fullnode-run', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const fullnodeName = req.query.chain || '';
    const action = req.query.action || '';
    if (!fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }
    const fullnodeStatus = yield getFullnodeStatus(fullnodeName);
    if (action === 'log') {
        const logs = yield getFullnodeLogs(fullnodeName);
        res.header({ 'Content-Type': 'text/plain' });
        res.send(logs);
        res.end();
        return;
    }
    const installStatus = yield getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = yield getFullnodeUninstallStatus(fullnodeName);
    const installedFullnodes = getInstalledFullnodes();
    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installStatus,
        uninstallStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
    };
    const pageContent = loadTemplate('fullnode_run.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
// POST FULLNODE-RUN
app.post('/fullnodes/fullnode-run', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const fullnodeName = req.query.chain || '';
    const action = req.body.action || '';
    if (!fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }
    const fullnodeStatus = yield getFullnodeStatus(fullnodeName);
    const installStatus = yield getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = yield getFullnodeUninstallStatus(fullnodeName);
    if (action === 'start') {
        if (fullnodeStatus) {
            res.send("Error: cannot start a running fullnode");
            res.end();
            return;
        }
        if (installStatus) {
            res.send("Error: cannot start a fullnode while an install is running");
            res.end();
            return;
        }
        if (uninstallStatus) {
            res.send("Error: cannot start a fullnode while an uninstall is running");
            res.end();
            return;
        }
        const ok = yield startFullnode(fullnodeName);
        if (ok) {
            res.send(`OK: fullnode started`);
        }
        else {
            res.send(`ERROR: cannot start fullnode`);
        }
        res.end();
        return;
    }
    else if (action === 'stop') {
        if (!fullnodeStatus) {
            res.send("Error: cannot stop a non-running fullnode");
            res.end();
            return;
        }
        const ok = yield stopFullnode(fullnodeName);
        if (ok) {
            res.send(`OK: fullnode stopped`);
        }
        else {
            res.send(`ERROR: cannot stop fullnode`);
        }
        res.end();
        return;
    }
    else {
        res.send(`Error: unknown action`);
        res.end();
        return;
    }
}));
// GET FULLNODE-INSTALL
app.get('/fullnodes/fullnode-install', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const fullnodeName = req.query.chain || '';
    const action = req.query.action || '';
    if (!fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }
    const fullnodeStatus = yield getFullnodeStatus(fullnodeName);
    if (action === 'log') {
        const logs = yield getFullnodeInstallLogs(fullnodeName);
        res.header({ 'Content-Type': 'text/plain' });
        res.send(logs);
        res.end();
        return;
    }
    const installStatus = yield getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = yield getFullnodeUninstallStatus(fullnodeName);
    const installedFullnodes = getInstalledFullnodes();
    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installStatus,
        uninstallStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
    };
    const pageContent = loadTemplate('fullnode_install.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
// POST FULLNODE-INSTALL
app.post('/fullnodes/fullnode-install', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const fullnodeName = req.query.chain || '';
    const action = req.body.action || '';
    if (!fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }
    const fullnodeStatus = yield getFullnodeStatus(fullnodeName);
    const installStatus = yield getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = yield getFullnodeUninstallStatus(fullnodeName);
    if (action === 'start') {
        if (fullnodeStatus) {
            res.send("Error: cannot install a running fullnode");
            res.end();
            return;
        }
        if (installStatus) {
            res.send("Error: cannot install a fullnode while another install is running");
            res.end();
            return;
        }
        if (uninstallStatus) {
            res.send("Error: cannot install a fullnode while an uninstall is running");
            res.end();
            return;
        }
        const ok = yield startFullnodeInstall(fullnodeName);
        // TODO: voir pour raffraichir la liste installedFullnodes (mettre à null pour provoquer un rechargement au prochain getInstalledFullnodes)
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
        if (!installStatus) {
            res.send("Error: cannot stop a non-running install");
            res.end();
            return;
        }
        const ok = yield stopFullnodeInstall(fullnodeName);
        if (ok) {
            res.send(`OK: install stopped`);
        }
        else {
            res.send(`ERROR: cannot stop install`);
        }
        res.end();
        return;
    }
    else {
        res.send(`Error: unknown action`);
        res.end();
        return;
    }
}));
// GET FULLNODE-UNINSTALL
app.get('/fullnodes/fullnode-uninstall', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const fullnodeName = req.query.chain || '';
    const action = req.query.action || '';
    if (!fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }
    const fullnodeStatus = yield getFullnodeStatus(fullnodeName);
    if (action === 'log') {
        const logs = yield getFullnodeUninstallLogs(fullnodeName);
        res.header({ 'Content-Type': 'text/plain' });
        res.send(logs);
        res.end();
        return;
    }
    const installStatus = yield getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = yield getFullnodeUninstallStatus(fullnodeName);
    const installedFullnodes = getInstalledFullnodes();
    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installStatus,
        uninstallStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
    };
    const pageContent = loadTemplate('fullnode_uninstall.html', opts, req.url);
    res.send(pageContent);
    res.end();
}));
// POST FULLNODE-UNINSTALL
app.post('/fullnodes/fullnode-uninstall', (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const fullnodeName = req.query.chain || '';
    const action = req.body.action || '';
    if (!fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }
    const fullnodeStatus = yield getFullnodeStatus(fullnodeName);
    const installStatus = yield getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = yield getFullnodeUninstallStatus(fullnodeName);
    if (action === 'start') {
        if (fullnodeStatus) {
            res.send("Error: cannot uninstall a running fullnode");
            res.end();
            return;
        }
        if (installStatus) {
            res.send("Error: cannot uninstall a fullnode while an install is running");
            res.end();
            return;
        }
        if (uninstallStatus) {
            res.send("Error: cannot uninstall a fullnode while another uninstall is running");
            res.end();
            return;
        }
        const ok = yield startFullnodeUninstall(fullnodeName);
        // TODO: voir pour raffraichir la liste installedFullnodes (mettre à null pour provoquer un rechargement au prochain getInstalledFullnodes)
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
        if (!uninstallStatus) {
            res.send("Error: cannot stop a non-running uninstall");
            res.end();
            return;
        }
        const ok = yield stopFullnodeUninstall(fullnodeName);
        if (ok) {
            res.send(`OK: uninstall stopped`);
        }
        else {
            res.send(`ERROR: cannot stop uninstall`);
        }
        res.end();
        return;
    }
    else {
        res.send(`Error: unknown action`);
        res.end();
        return;
    }
}));
// ERROR 404
app.use(function (req, res, next) {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);
    next();
});
// LISTEN
server.listen(httpServerPort, httpServerHost, () => {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Server started on ${httpServerHost}:${httpServerPort}`);
});
/* ############################ FUNCTIONS ################################### */
// FULLNODE RUN
function startFullnode(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = `${cmdFullnode} ${fullnodeName} start`;
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
function stopFullnode(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = `${cmdFullnode} ${fullnodeName} stop`;
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
function getFullnodeLogs(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = `${cmdFullnode} ${fullnodeName} log -n 50`;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        const ret = yield (0, utils_1.cmdExec)(cmd, 10000);
        if (ret) {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ${ret}`);
        }
        else {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ERROR`);
        }
        return ret || '';
    });
}
// FULLNODE INSTALL
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
function getFullnodeInstallLogs(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = `${cmdInstallFullnode} ${fullnodeName} --daemon log -n 50`;
        console.log(`${(0, utils_1.now)()} [DEBUG] executing command: ${cmd}`);
        const ret = yield (0, utils_1.cmdExec)(cmd, 10000);
        if (ret) {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ${ret}`);
        }
        else {
            console.log(`${(0, utils_1.now)()} [DEBUG] command result: ERROR`);
        }
        return ret || '';
    });
}
// FULLNODE UNINSTALL
function startFullnodeUninstall(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const cmd = `${cmdUninstallFullnode} ${fullnodeName} -y`;
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
        //const cmd = `${cmdUninstallFullnode} ${fullnodeName} --daemon stop`;
        return false;
    });
}
function getFullnodeUninstallStatus(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        //const cmd = `${cmdUninstallFullnode} ${fullnodeName} --daemon status`;
        return false;
    });
}
function getFullnodeUninstallLogs(fullnodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        //const cmd = `${cmdUninstallFullnode} ${fullnodeName} log -n 50`;
        return '';
    });
}
// MISC
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
function getInstalledFullnodes() {
    // TODO: prevoir de rafraichir la liste en live (cf en cas d'install/desinstall de fullnodes)
    if (installedFullnodes === null) {
        installedFullnodes = (process.env.INSTALLED_FULLNODES || '').split(' ');
    }
    return installedFullnodes;
}
