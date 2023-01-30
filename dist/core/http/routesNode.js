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
};
/* ########## FUNCTIONS ######### */
function registerNodeRoutes(app, urlPrefix = '') {
    // NODE homepage => /node/
    app.get(`${urlPrefix}/`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const installedFullnodes = yield Node.getInstalledFullnodes(config);
        const runningFullnodes = yield Node.getRunningFullnodes(config);
        const installableFullnodes = yield Node.getInstallableFullnodes(config);
        const runnableFullnodes = yield Node.getRunnableFullnodes(config);
        const managedFullnodes = yield Node.getManagedFullnodes(config);
        const monitorStatus = yield Node.monitorStatus(config);
        const nodeInfos = Node.getNodeInfos();
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Node Manager`,
                noIndex: false,
            }, contentTemplate: `..${SEP}node${SEP}node.html`, nodeInfos,
            monitorStatus,
            installedFullnodes,
            runningFullnodes,
            installableFullnodes,
            runnableFullnodes,
            managedFullnodes });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // NODE status => /node/status
    app.get(`${urlPrefix}/status`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const nodeInfos = Node.getNodeInfos();
        let html = `Node status: <pre>${JSON.stringify(nodeInfos, null, 4)}</pre>`;
        res.send(html);
    }));
    // NODE status JSON => /node/status.json
    app.get(`${urlPrefix}/status.json`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const nodeInfos = Node.getNodeInfos();
        let content = JSON.stringify(nodeInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    }));
    // NODE monitor start => /node/monitor-start
    app.get(`${urlPrefix}/monitor-start`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        Node.monitorStart(config);
        res.send('Node monitor started');
    }));
    // NODE monitor stop => /node/monitor-stop
    app.get(`${urlPrefix}/monitor-stop`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        Node.monitorStop(config);
        res.send('Node monitor stopped');
    }));
    // Fullnode run page => /node/fullnodes-run
    app.get(`${urlPrefix}/fullnodes-run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const action = ((_a = req.query.action) === null || _a === void 0 ? void 0 : _a.toString()) || '';
        const fullnodeName = ((_b = req.query.fullnode) === null || _b === void 0 ? void 0 : _b.toString()) || '';
        const config = Daemon.getConfig();
        const nodeInfos = Node.getNodeInfos();
        const fullnodeInfos = nodeInfos.fullnodesInfos[fullnodeName];
        if (action === 'start') {
            if (!fullnodeName) {
                res.send(`Error: missing parameters`);
                return;
            }
            const params = {
                fullnode: fullnodeName,
            };
            yield Node.fullnodeRunStart(config, params);
            res.send(`OK`);
            return;
        }
        else if (action === 'stop') {
            if (!fullnodeName) {
                res.send(`Error: missing parameters`);
                return;
            }
            const params = {
                fullnode: fullnodeName,
            };
            yield Node.fullnodeRunStop(config, params);
            res.send(`OK`);
            return;
        }
        else if (action !== '') {
            res.send(`Error: invalid action`);
        }
        if (!fullnodeInfos) {
            res.send(`Error: fullnode is not running or is not managed or node monitor is not started or fullnode API is not loaded`);
            return;
        }
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Node Manager - Fullnode run`,
                noIndex: false,
            }, contentTemplate: `..${SEP}node${SEP}fullnode_run.html`, nodeInfos,
            fullnodeInfos });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
}
exports.registerNodeRoutes = registerNodeRoutes;
