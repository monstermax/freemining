"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRigRoutes = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = require("../../common/utils");
const Rig = tslib_1.__importStar(require("../../rig/Rig"));
const Daemon = tslib_1.__importStar(require("../../core/Daemon"));
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
const utilFuncs = {
    now: utils_1.now,
};
/* ########## FUNCTIONS ######### */
function registerRigRoutes(app, urlPrefix = '') {
    // RIG homepage => /rig/
    app.get(`${urlPrefix}/`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const installedMiners = yield Rig.getInstalledMiners(config);
        const runningMiners = yield Rig.getRunningMiners(config);
        const installableMiners = yield Rig.getInstallableMiners(config);
        const runnableMiners = yield Rig.getRunnableMiners(config);
        const managedMiners = yield Rig.getManagedMiners(config);
        const monitorStatus = yield Rig.monitorStatus(config);
        const rigInfos = Rig.getRigInfos();
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Rig Manager`,
                noIndex: false,
            }, contentTemplate: `..${SEP}rig${SEP}rig.html`, rigInfos,
            monitorStatus,
            installedMiners,
            runningMiners,
            installableMiners,
            runnableMiners,
            managedMiners });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // RIG status => /rig/status
    app.get(`${urlPrefix}/status`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rigInfos = Rig.getRigInfos();
        let html = `Rig status: <pre>${JSON.stringify(rigInfos, null, 4)}</pre>`;
        res.send(html);
    }));
    // RIG status JSON => /rig/status.json
    app.get(`${urlPrefix}/status.json`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rigInfos = Rig.getRigInfos();
        let content = JSON.stringify(rigInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    }));
    // RIG monitor start => /rig/monitor-start
    app.get(`${urlPrefix}/monitor-start`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        Rig.monitorStart(config);
        res.send('Rig monitor started');
    }));
    // RIG monitor stop => /rig/monitor-stop
    app.get(`${urlPrefix}/monitor-stop`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        Rig.monitorStop(config);
        res.send('Rig monitor stopped');
    }));
    // Miner run page => /rig/miners-run
    app.get(`${urlPrefix}/miners-run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const action = ((_a = req.query.action) === null || _a === void 0 ? void 0 : _a.toString()) || '';
        const minerName = ((_b = req.query.miner) === null || _b === void 0 ? void 0 : _b.toString()) || '';
        const algo = ((_c = req.query.algo) === null || _c === void 0 ? void 0 : _c.toString()) || '';
        const poolUrl = ((_d = req.query.poolUrl) === null || _d === void 0 ? void 0 : _d.toString()) || '';
        const poolUser = ((_e = req.query.poolUser) === null || _e === void 0 ? void 0 : _e.toString()) || '';
        const config = Daemon.getConfig();
        const rigInfos = Rig.getRigInfos();
        const minerInfos = rigInfos.minersInfos[minerName];
        if (action === 'start') {
            if (!minerName || !algo || !poolUrl || !poolUser) {
                res.send(`Error: missing parameters`);
                return;
            }
            const params = {
                fullnode: minerName,
                algo,
                poolUrl,
                poolUser,
            };
            yield Rig.minerRunStart(config, params);
            res.send(`OK`);
            return;
        }
        else if (action === 'stop') {
            if (!minerName) {
                res.send(`Error: missing parameters`);
                return;
            }
            const params = {
                fullnode: minerName,
            };
            yield Rig.minerRunStop(config, params);
            res.send(`OK`);
            return;
        }
        else if (action !== '') {
            res.send(`Error: invalid action`);
        }
        if (!minerInfos) {
            res.send(`Error: miner is not running or is not managed or rig monitor is not started or miner API is not loaded`);
            return;
        }
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Rig Manager - Miner run`,
                noIndex: false,
            }, contentTemplate: `..${SEP}rig${SEP}miner_run.html`, rigInfos,
            minerInfos });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
}
exports.registerRigRoutes = registerRigRoutes;
