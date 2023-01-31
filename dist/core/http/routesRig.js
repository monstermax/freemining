"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRigRoutes = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
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
    // GET Rig homepage => /rig/
    app.get(`${urlPrefix}/`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const monitorStatus = Rig.monitorStatus(config);
        const allMiners = yield Rig.getAllMiners(config);
        const rigInfos = Rig.getRigInfos();
        // variables à ne plus utiliser... (utiliser allMiners à la place)
        const runningMiners = Object.entries(allMiners).filter((entry) => entry[1].running).map(entry => entry[0]);
        const installedMiners = Object.entries(allMiners).filter((entry) => entry[1].installed).map(entry => entry[0]);
        const installableMiners = Object.entries(allMiners).filter((entry) => entry[1].installable).map(entry => entry[0]);
        const runnableMiners = Object.entries(allMiners).filter((entry) => entry[1].runnable).map(entry => entry[0]);
        const managedMiners = Object.entries(allMiners).filter((entry) => entry[1].managed).map(entry => entry[0]);
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Rig Manager`,
                noIndex: false,
            }, contentTemplate: `..${SEP}rig${SEP}rig.html`, rigInfos,
            monitorStatus,
            allMiners,
            installedMiners,
            runningMiners,
            installableMiners,
            runnableMiners,
            managedMiners });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // GET Rig status => /rig/status
    app.get(`${urlPrefix}/status`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rigInfos = Rig.getRigInfos();
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Rig Manager - Rig Status`,
                noIndex: false,
            }, contentTemplate: `..${SEP}rig${SEP}rig_status.html`, rigInfos });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // GET Rig status JSON => /rig/status.json
    app.get(`${urlPrefix}/status.json`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rigInfos = Rig.getRigInfos();
        let content = JSON.stringify(rigInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    }));
    // GET Rig monitor start => /rig/monitor-start
    app.get(`${urlPrefix}/monitor-start`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        Rig.monitorStart(config);
        res.send('Rig monitor started');
    }));
    // GET Rig monitor stop => /rig/monitor-stop
    app.get(`${urlPrefix}/monitor-stop`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        Rig.monitorStop(config);
        res.send('Rig monitor stopped');
    }));
    // GET Miner install page => /rig/miners/{minerName}/install
    app.get(`${urlPrefix}/miners/:minerName/install`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const minerName = req.params.minerName;
        //const action = req.query.action?.toString() || '';
        const config = Daemon.getConfig();
        const rigInfos = Rig.getRigInfos();
        const minerInfos = rigInfos.minersInfos[minerName];
        const minerStatus = Rig.minerRunStatus(config, { miner: minerName });
        const allMiners = yield Rig.getAllMiners(config);
        const installStatus = false;
        const uninstallStatus = false;
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Rig Manager - Miner install`,
                noIndex: false,
            }, contentTemplate: `..${SEP}rig${SEP}miner_install.html`, rigInfos, miner: minerName, minerStatus,
            minerInfos,
            allMiners,
            installStatus,
            uninstallStatus });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // POST Miner install page => /rig/miners/{minerName}/install
    app.post(`${urlPrefix}/miners/:minerName/install`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _a;
        const minerName = req.params.minerName;
        const action = ((_a = req.body.action) === null || _a === void 0 ? void 0 : _a.toString()) || '';
        const config = Daemon.getConfig();
        //const rigInfos = Rig.getRigInfos();
        //const minerInfos = rigInfos.minersInfos[minerName];
        const minerStatus = Rig.minerRunStatus(config, { miner: minerName });
        if (action === 'start') {
            if (!minerName) {
                res.send(`Error: missing 'miner' parameter`);
                return;
            }
            if (minerStatus) {
                res.send(`Error: cannot start miner install while it is running`);
                return;
            }
            const params = {
                miner: minerName,
            };
            try {
                yield Rig.minerInstallStart(config, params);
                res.send(`OK: miner install started`);
            }
            catch (err) {
                res.send(`Error: cannot start miner install => ${err.message}`);
            }
            return;
        }
        res.send(`Error: invalid action`);
    }));
    // GET Miner run page => /rig/miners/{minerName}/run
    app.get(`${urlPrefix}/miners/:minerName/run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _b;
        const minerName = req.params.minerName;
        const action = ((_b = req.query.action) === null || _b === void 0 ? void 0 : _b.toString()) || '';
        const config = Daemon.getConfig();
        const rigStatus = Rig.monitorStatus();
        const rigInfos = Rig.getRigInfos();
        const minerInfos = rigInfos.minersInfos[minerName];
        const minerStatus = Rig.minerRunStatus(config, { miner: minerName });
        const allMiners = yield Rig.getAllMiners(config);
        if (action === 'log') {
            // TODO
            res.send(`not yet available`);
            return;
        }
        else if (action === 'status') {
            if (!rigStatus) {
                res.send(`Warning: JSON status requires rig monitor to be started. Click here to <a href="/rig/monitor-start">start monitor</a>`);
                return;
            }
            res.header('Content-Type', 'application/json');
            res.send(JSON.stringify(minerInfos));
            return;
        }
        //if (! minerInfos) {
        //    res.send(`Error: miner is not running or is not managed or rig monitor is not started or miner API is not loaded`);
        //    return;
        //}
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Rig Manager - Miner run`,
                noIndex: false,
            }, contentTemplate: `..${SEP}rig${SEP}miner_run.html`, rigStatus,
            rigInfos, miner: minerName, minerStatus,
            minerInfos,
            allMiners });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // POST Miner run page => /rig/miners/{minerName}/run
    app.post(`${urlPrefix}/miners/:minerName/run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _c, _d, _e, _f, _g;
        const minerName = req.params.minerName;
        const action = ((_c = req.body.action) === null || _c === void 0 ? void 0 : _c.toString()) || '';
        const config = Daemon.getConfig();
        //const rigInfos = Rig.getRigInfos();
        //const minerInfos = rigInfos.minersInfos[minerName];
        const minerStatus = Rig.minerRunStatus(config, { miner: minerName });
        const algo = ((_d = req.body.algo) === null || _d === void 0 ? void 0 : _d.toString()) || '';
        const poolUrl = ((_e = req.body.poolUrl) === null || _e === void 0 ? void 0 : _e.toString()) || '';
        const poolUser = ((_f = req.body.poolUser) === null || _f === void 0 ? void 0 : _f.toString()) || '';
        const extraArgs = (((_g = req.body.extraArgs) === null || _g === void 0 ? void 0 : _g.toString()) || '').split(' ');
        if (action === 'start') {
            if (!minerName || !algo || !poolUrl || !poolUser) {
                res.send(`Error: missing parameters`);
                return;
            }
            const params = {
                miner: minerName,
                algo,
                poolUrl,
                poolUser,
                extraArgs,
            };
            try {
                yield Rig.minerRunStart(config, params);
                res.send(`OK: miner run started`);
            }
            catch (err) {
                res.send(`Error: cannot start miner run => ${err.message}`);
            }
            return;
        }
        else if (action === 'stop') {
            if (!minerName) {
                res.send(`Error: missing parameters`);
                return;
            }
            if (!minerStatus) {
                res.send(`Error: cannot stop miner run while it is not running`);
                return;
            }
            const params = {
                miner: minerName,
            };
            try {
                Rig.minerRunStop(config, params);
                res.send(`OK: miner run stopped`);
            }
            catch (err) {
                res.send(`Error: cannot stop miner run => ${err.message}`);
            }
            return;
        }
        res.send(`Error: invalid action`);
    }));
    app.get(`${urlPrefix}/miners-run-modal`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const minerName = req.query.miner || '';
        const config = Daemon.getConfig();
        const rigInfos = Rig.getRigInfos();
        const allMiners = yield Rig.getAllMiners(config);
        const runnableMiners = Object.entries(allMiners).filter((entry) => entry[1].runnable).map(entry => entry[0]);
        if (!rigInfos) {
            res.send(`Rig not initialized`);
            res.end();
            return;
        }
        let presets = {};
        const poolsFilePath = `${config.confDir}${SEP}rig${SEP}pools.json`;
        if (fs_1.default.existsSync(poolsFilePath)) {
            presets = require(poolsFilePath);
        }
        const data = Object.assign(Object.assign({}, utilFuncs), { rigName: rigInfos.infos.name, rigInfos, miners: allMiners, runnableMiners,
            presets, miner: minerName });
        res.render(`.${SEP}rig${SEP}run_miner_modal.html`, data);
    }));
}
exports.registerRigRoutes = registerRigRoutes;
