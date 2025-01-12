"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNodeRoutes = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = require("../../common/utils");
const Node = tslib_1.__importStar(require("../../node/Node"));
const Daemon = tslib_1.__importStar(require("../../core/Daemon"));
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
const utilFuncs = {
    now: utils_1.now,
    formatNumber: utils_1.formatNumber,
};
/* ########## FUNCTIONS ######### */
function registerNodeRoutes(app, urlPrefix = '') {
    // NODE homepage => /node/
    app.get(`${urlPrefix}/`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const monitorStatus = Node.monitorGetStatus();
        const allFullnodes = yield Node.getAllFullnodes(config);
        const nodeInfos = yield Node.getNodeInfos(config);
        // variables à ne plus utiliser... (utiliser allFullnodes à la place)
        const runningFullnodes = Object.entries(allFullnodes).filter((entry) => entry[1].running).map(entry => entry[0]);
        const installedFullnodes = Object.entries(allFullnodes).filter((entry) => entry[1].installed).map(entry => entry[0]);
        const installableFullnodes = Object.entries(allFullnodes).filter((entry) => entry[1].installable).map(entry => entry[0]);
        const runnableFullnodes = Object.entries(allFullnodes).filter((entry) => entry[1].runnable).map(entry => entry[0]);
        const managedFullnodes = Object.entries(allFullnodes).filter((entry) => entry[1].managed).map(entry => entry[0]);
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Node Manager`,
                noIndex: false,
            }, contentTemplate: `..${SEP}node${SEP}node.html`, nodeInfos,
            monitorStatus,
            allFullnodes,
            installedFullnodes,
            runningFullnodes,
            installableFullnodes,
            runnableFullnodes,
            managedFullnodes });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // NODE status => /node/status
    app.get(`${urlPrefix}/status`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const monitorStatus = Node.monitorGetStatus();
        const nodeInfos = yield Node.getNodeInfos(config);
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Node Manager - Node Status`,
                noIndex: false,
            }, contentTemplate: `..${SEP}node${SEP}node_status.html`, monitorStatus,
            nodeInfos });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // NODE status JSON => /node/status.json
    app.get(`${urlPrefix}/status.json`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const nodeInfos = yield Node.getNodeInfos(config);
        let content = JSON.stringify(nodeInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    }));
    // GET Node monitor run => /node/monitor-run
    app.get(`${urlPrefix}/monitor-run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        //const config = Daemon.getConfig();
        const monitorStatus = Node.monitorGetStatus();
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Node Manager - Monitor run`,
                noIndex: false,
            }, contentTemplate: `..${SEP}node${SEP}monitor_run.html`, monitorStatus });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // POST Node monitor run => /node/monitor-run
    app.post(`${urlPrefix}/monitor-run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _a;
        const config = Daemon.getConfig();
        const action = ((_a = req.body.action) === null || _a === void 0 ? void 0 : _a.toString()) || '';
        const monitorStatus = Node.monitorGetStatus();
        if (action === 'start') {
            if (monitorStatus) {
                res.send('OK: Node monitor is running');
            }
            else {
                Node.monitorStart(config);
                res.send('OK: Node monitor started');
            }
            return;
        }
        else if (action === 'stop') {
            if (monitorStatus) {
                Node.monitorStop();
                res.send('OK: Node monitor stopped');
            }
            else {
                res.send('OK: Node monitor is not running');
            }
            return;
        }
        res.send(`Error: invalid action`);
    }));
    // GET Fullnode install page => /node/fullnodes/{fullnodeName}/install
    app.get(`${urlPrefix}/fullnodes/:fullnodeName/install`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _b, _c;
        const fullnodeName = req.params.fullnodeName;
        //const action = req.query.action?.toString() || '';
        const config = Daemon.getConfig();
        const fullnodeConfig = Node.getInstalledFullnodeConfiguration(config, fullnodeName);
        const fullnodeAlias = ((_b = req.query.alias) === null || _b === void 0 ? void 0 : _b.toString()) || fullnodeConfig.defaultAlias;
        const fullnodeFullName = `${fullnodeName}-${fullnodeAlias}`;
        const nodeInfos = yield Node.getNodeInfos(config);
        const fullnodeInfos = (_c = nodeInfos.status) === null || _c === void 0 ? void 0 : _c.fullnodesStats[fullnodeFullName];
        const fullnodeStatus = Node.fullnodeRunGetStatus(config, { fullnode: fullnodeName });
        const allFullnodes = yield Node.getAllFullnodes(config);
        const installStatus = false;
        const uninstallStatus = false;
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Node Manager - Fullnode install`,
                noIndex: false,
            }, contentTemplate: `..${SEP}node${SEP}fullnode_install.html`, nodeInfos, fullnode: fullnodeName, fullnodeStatus,
            fullnodeInfos,
            allFullnodes,
            installStatus,
            uninstallStatus });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // POST Fullnode install page => /node/fullnodes/{fullnodeName}/install
    app.post(`${urlPrefix}/fullnodes/:fullnodeName/install`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _d, _e;
        const fullnodeName = req.params.fullnodeName;
        const action = ((_d = req.body.action) === null || _d === void 0 ? void 0 : _d.toString()) || '';
        const config = Daemon.getConfig();
        const fullnodeConfig = Node.getInstalledFullnodeConfiguration(config, fullnodeName);
        const fullnodeAlias = ((_e = req.query.alias) === null || _e === void 0 ? void 0 : _e.toString()) || fullnodeConfig.defaultAlias;
        const fullnodeFullName = `${fullnodeName}-${fullnodeAlias}`;
        //const nodeInfos = await Node.getNodeInfos(config);
        //const fullnodeInfos = nodeInfos.status?.fullnodesStats[fullnodeFullName];
        const fullnodeStatus = Node.fullnodeRunGetStatus(config, { fullnode: fullnodeName });
        if (action === 'start') {
            if (!fullnodeName) {
                res.send(`Error: missing 'fullnode' parameter`);
                return;
            }
            if (fullnodeStatus) {
                res.send(`Error: cannot start fullnode install while it is running`);
                return;
            }
            const params = {
                fullnode: fullnodeName,
            };
            try {
                yield Node.fullnodeInstallStart(config, params);
                res.send(`OK: fullnode install started`);
            }
            catch (err) {
                res.send(`Error: cannot start fullnode install => ${err.message}`);
            }
            return;
        }
        res.send(`Error: invalid action`);
    }));
    // GET Fullnode run page => /node/fullnodes/{fullnodeName}/run
    app.get(`${urlPrefix}/fullnodes/:fullnodeName/run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _f, _g, _h;
        const fullnodeName = req.params.fullnodeName;
        const action = ((_f = req.query.action) === null || _f === void 0 ? void 0 : _f.toString()) || '';
        const config = Daemon.getConfig();
        const fullnodeConfig = Node.getInstalledFullnodeConfiguration(config, fullnodeName);
        const fullnodeAlias = ((_g = req.query.alias) === null || _g === void 0 ? void 0 : _g.toString()) || fullnodeConfig.defaultAlias;
        const fullnodeFullName = `${fullnodeName}-${fullnodeAlias}`;
        const monitorStatus = Node.monitorGetStatus();
        const nodeInfos = yield Node.getNodeInfos(config);
        const fullnodeInfos = (_h = nodeInfos.status) === null || _h === void 0 ? void 0 : _h.fullnodesStats[fullnodeFullName];
        const fullnodeStatus = Node.fullnodeRunGetStatus(config, { fullnode: fullnodeName });
        const allFullnodes = yield Node.getAllFullnodes(config);
        if (action === 'log') {
            //res.send( `not yet available` );
            res.header('Content-Type', 'text/plain');
            const log = yield Node.fullnodeRunGetLog(config, { fullnode: fullnodeName, lines: 50 });
            res.send(log);
            return;
        }
        else if (action === 'status') {
            if (!monitorStatus) {
                res.send(`Warning: JSON status requires node monitor to be started. Click here to <a href="/node/monitor-start">start monitor</a>`);
                return;
            }
            if (!allFullnodes[fullnodeName]) {
                res.send(`Warning: invalid fullnode`);
                return;
            }
            if (!fullnodeStatus) {
                res.send(`Warning: this fullnode is not running`);
                return;
            }
            if (!allFullnodes[fullnodeName].managed) {
                res.send(`Warning: this fullnode is not managed`);
                return;
            }
            if (!fullnodeInfos) {
                res.send(`Warning: data not yet available`);
                return;
            }
            res.header('Content-Type', 'application/json');
            res.send(JSON.stringify(fullnodeInfos));
            return;
        }
        //if (! fullnodeName) {
        //    res.send(`Error: missing 'fullnode' parameter`);
        //    return;
        //}
        //if (! fullnodeInfos) {
        //    res.send(`Error: fullnode is not running or is not managed or node monitor is not started or fullnode API is not loaded`);
        //    return;
        //}
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Node Manager - Fullnode run`,
                noIndex: false,
            }, contentTemplate: `..${SEP}node${SEP}fullnode_run.html`, monitorStatus,
            nodeInfos, fullnode: fullnodeName, fullnodeAlias,
            fullnodeStatus,
            fullnodeInfos,
            allFullnodes });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // POST Fullnode run page => /node/fullnodes/{fullnodeName}/run
    app.post(`${urlPrefix}/fullnodes/:fullnodeName/run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _j, _k;
        const fullnodeName = req.params.fullnodeName;
        const action = ((_j = req.body.action) === null || _j === void 0 ? void 0 : _j.toString()) || '';
        const config = Daemon.getConfig();
        const fullnodeConfig = Node.getInstalledFullnodeConfiguration(config, fullnodeName);
        const fullnodeAlias = ((_k = req.query.alias) === null || _k === void 0 ? void 0 : _k.toString()) || fullnodeConfig.defaultAlias;
        const fullnodeFullName = `${fullnodeName}-${fullnodeAlias}`;
        const fullnodeStatus = Node.fullnodeRunGetStatus(config, { fullnode: fullnodeName });
        if (action === 'start') {
            if (!fullnodeName) {
                res.send(`Error: missing parameters`);
                return;
            }
            if (fullnodeStatus) {
                res.send(`Error: cannot start fullnode run while it is already running`);
                return;
            }
            const params = {
                fullnode: fullnodeName,
            };
            try {
                Node.fullnodeRunStart(config, params);
                res.send(`OK: fullnode run started`);
            }
            catch (err) {
                res.send(`Error: cannot start fullnode run => ${err.message}`);
            }
            return;
        }
        else if (action === 'stop') {
            if (!fullnodeName) {
                res.send(`Error: missing parameters`);
                return;
            }
            if (!fullnodeStatus) {
                res.send(`Error: cannot stop fullnode run while it is not running`);
                return;
            }
            const params = {
                fullnode: fullnodeName,
            };
            try {
                Node.fullnodeRunStop(config, params);
                res.send(`OK: fullnode run stopped`);
            }
            catch (err) {
                res.send(`Error: cannot stop fullnode run => ${err.message}`);
            }
            return;
        }
        res.send(`Error: invalid action`);
    }));
}
exports.registerNodeRoutes = registerNodeRoutes;
