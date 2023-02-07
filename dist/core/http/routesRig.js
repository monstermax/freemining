"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRigRoutes = exports.rigMinerRunPost = exports.rigMinerRun = exports.rigMinerInstallPost = exports.rigMinerInstall = exports.rigMinerRunModal = exports.rigStatus = exports.rigHomepage = void 0;
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
    formatNumber: utils_1.formatNumber,
};
/* ########## FUNCTIONS ######### */
function getRigData() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const rigData = {
            config,
            rigInfos: yield Rig.getRigInfos(config),
            monitorStatus: Rig.monitorGetStatus(),
            allMiners: yield Rig.getAllMiners(config),
            //farmAgentStatus: Rig.farmAgentGetStatus(),
            //farmAgentHostPort: `*hardcoded*`, // TODO: `${wsServerHost}:${wsServerPort}`
            //runningMinersAliases: Rig.getRunningMinersAliases(config),
            //rigConfig: { // TODO
            //    farmAgent: {
            //        host: '0.0.0.0',
            //        port: 0,
            //    },
            //},
        };
        return rigData;
    });
}
/* ############################# */
function rigHomepage(rigData, req, res, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { allMiners } = rigData;
        const runningMiners = Object.entries(allMiners).filter((entry) => entry[1].running).map(entry => entry[0]);
        const installedMiners = Object.entries(allMiners).filter((entry) => entry[1].installed).map(entry => entry[0]);
        const installableMiners = Object.entries(allMiners).filter((entry) => entry[1].installable).map(entry => entry[0]);
        const runnableMiners = Object.entries(allMiners).filter((entry) => entry[1].runnable).map(entry => entry[0]);
        const managedMiners = Object.entries(allMiners).filter((entry) => entry[1].managed).map(entry => entry[0]);
        const data = Object.assign(Object.assign(Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Rig Manager`,
                noIndex: false,
            }, contentTemplate: `..${SEP}rig${SEP}rig.html` }), rigData), { allMiners,
            installedMiners,
            runningMiners,
            installableMiners,
            runnableMiners,
            managedMiners });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });
}
exports.rigHomepage = rigHomepage;
function rigStatus(rigData, req, res, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const data = Object.assign(Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Rig Manager - Rig Status`,
                noIndex: false,
            }, contentTemplate: `..${SEP}rig${SEP}rig_status.html` }), rigData);
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });
}
exports.rigStatus = rigStatus;
;
function rigMinerRunModal(rigData, req, res, next) {
    var _a;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const minerName = req.query.miner || '';
        if (!rigData.config) {
            res.send(`Rig not configured`);
            res.end();
            return;
        }
        //const config = Daemon.getConfig();
        const config = rigData.config;
        const minerConfig = Rig.getInstalledMinerConfiguration(config, minerName); // TODO farm
        const minerAlias = ((_a = req.query.alias) === null || _a === void 0 ? void 0 : _a.toString()) || minerConfig.defaultAlias;
        const rigInfos = rigData.rigInfos; // await Rig.getRigInfos(config);
        const allMiners = rigData.allMiners; // await Rig.getAllMiners(config);
        const runningMiners = Object.entries(allMiners).filter((entry) => entry[1].running).map(entry => entry[0]);
        const runnableMiners = Object.entries(allMiners).filter((entry) => entry[1].runnable).map(entry => entry[0]);
        const installedMiners = Object.entries(allMiners).filter((entry) => entry[1].installed).map(entry => entry[0]);
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
        const data = Object.assign(Object.assign({}, utilFuncs), { rigName: config.rig.name || rigInfos.rig.name || 'anonymous-rig', rigInfos, miners: allMiners, runnableMiners,
            runningMiners,
            installedMiners,
            presets, miner: minerName, minerAlias });
        res.render(`.${SEP}rig${SEP}run_miner_modal.html`, data);
    });
}
exports.rigMinerRunModal = rigMinerRunModal;
;
function rigMinerInstall(rigData, req, res, next) {
    var _a, _b;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const minerName = req.params.minerName;
        //const action = req.query.action?.toString() || '';
        const config = rigData.config;
        const rigInfos = rigData.rigInfos;
        const minerConfig = !config ? { defaultAlias: '' } : Rig.getInstalledMinerConfiguration(config, minerName); // TODO farm / a revoir
        const minerAlias = ((_a = req.query.alias) === null || _a === void 0 ? void 0 : _a.toString()) || minerConfig.defaultAlias;
        const minerFullName = `${minerName}-${minerAlias}`;
        const minerInfos = (_b = rigInfos.status) === null || _b === void 0 ? void 0 : _b.minersStats[minerFullName];
        const minerStatus = (config && Rig.minerRunGetStatus(config, { miner: minerName }));
        const allMiners = rigData.allMiners;
        const installStatus = false;
        const uninstallStatus = false;
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Rig Manager - Miner install`,
                noIndex: false,
            }, contentTemplate: `..${SEP}rig${SEP}miner_install.html`, rigInfos, miner: minerName, minerAlias,
            minerStatus,
            minerInfos,
            allMiners,
            installStatus,
            uninstallStatus });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });
}
exports.rigMinerInstall = rigMinerInstall;
;
function rigMinerInstallPost(rigData, req, res, next) {
    var _a, _b, _c, _d;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const minerName = req.params.minerName;
        const action = ((_a = req.body.action) === null || _a === void 0 ? void 0 : _a.toString()) || '';
        const minerAlias = ((_b = req.body.alias) === null || _b === void 0 ? void 0 : _b.toString()) || '';
        const minerDefault = ((_c = req.body.default) === null || _c === void 0 ? void 0 : _c.toString()) || '';
        const version = ((_d = req.body.version) === null || _d === void 0 ? void 0 : _d.toString()) || '';
        const config = rigData.config;
        const minerStatus = (config && Rig.minerRunGetStatus(config, { miner: minerName })); // TODO farm
        if (action === 'start') {
            if (!minerName) {
                res.send(`Error: missing 'miner' parameter`);
                return;
            }
            if (minerStatus) {
                res.send(`Error: cannot start miner install while it is running`);
                return;
            }
            if (!config) {
                res.send(`Error: cannot start miner install without config`);
                return;
            }
            const params = {
                miner: minerName,
                alias: minerAlias,
                default: (minerDefault === '1'),
                version,
            };
            try {
                yield Rig.minerInstallStart(config, params); // TODO farm
                res.send(`OK: miner install started`);
            }
            catch (err) {
                res.send(`Error: cannot start miner install => ${err.message}`);
            }
            return;
        }
        res.send(`Error: invalid action`);
    });
}
exports.rigMinerInstallPost = rigMinerInstallPost;
;
function rigMinerRun(rigData, req, res, next) {
    var _a, _b, _c;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const minerName = req.params.minerName;
        const action = ((_a = req.query.action) === null || _a === void 0 ? void 0 : _a.toString()) || '';
        const config = rigData.config;
        const minerConfig = !config ? { defaultAlias: '' } : Rig.getInstalledMinerConfiguration(config, minerName); // TODO farm
        const minerAlias = ((_b = req.query.alias) === null || _b === void 0 ? void 0 : _b.toString()) || minerConfig.defaultAlias;
        const minerFullName = `${minerName}-${minerAlias}`;
        const monitorStatus = rigData.monitorStatus;
        const rigInfos = rigData.rigInfos;
        const minerInfos = (_c = rigInfos.status) === null || _c === void 0 ? void 0 : _c.minersStats[minerFullName];
        const minerStatus = (config && Rig.minerRunGetStatus(config, { miner: minerName })); // TODO farm
        const allMiners = rigData.allMiners;
        if (action === 'log') {
            //res.send( `not yet available` );
            if (!config) {
                res.send(`Error: cannot show miner log without config`);
                return;
            }
            res.header('Content-Type', 'text/plain');
            const log = yield Rig.minerRunGetLog(config, { miner: minerName, lines: 50 }); // TODO farm ?
            res.send(log);
            return;
        }
        else if (action === 'status') {
            if (!monitorStatus) {
                res.send(`Warning: JSON status requires rig monitor to be started. Click here to <a href="/rig/monitor-start">start monitor</a>`);
                return;
            }
            if (!allMiners[minerName]) {
                res.send(`Warning: invalid miner`);
                return;
            }
            if (!minerStatus) {
                res.send(`Warning: this miner is not running`);
                return;
            }
            if (!allMiners[minerName].managed) {
                res.send(`Warning: this miner is not managed`);
                return;
            }
            if (!minerInfos) {
                res.send(`Warning: data not yet available`);
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
            }, contentTemplate: `..${SEP}rig${SEP}miner_run.html`, monitorStatus,
            rigInfos, miner: minerName, minerAlias,
            minerStatus,
            minerInfos,
            allMiners });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });
}
exports.rigMinerRun = rigMinerRun;
;
function rigMinerRunPost(rigData, req, res, next) {
    var _a, _b, _c, _d, _e, _f;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const minerName = req.params.minerName;
        const action = ((_a = req.body.action) === null || _a === void 0 ? void 0 : _a.toString()) || '';
        const config = rigData.config;
        const minerStatus = (config && Rig.minerRunGetStatus(config, { miner: minerName })); // TODO farm
        const coin = ((_b = req.body.coin) === null || _b === void 0 ? void 0 : _b.toString()) || '';
        const algo = ((_c = req.body.algo) === null || _c === void 0 ? void 0 : _c.toString()) || '';
        const poolUrl = ((_d = req.body.poolUrl) === null || _d === void 0 ? void 0 : _d.toString()) || '';
        const poolUser = ((_e = req.body.poolUser) === null || _e === void 0 ? void 0 : _e.toString()) || '';
        const extraArgs = (((_f = req.body.extraArgs) === null || _f === void 0 ? void 0 : _f.toString()) || '').split(' ').filter((arg) => !!arg);
        if (action === 'start') {
            if (!minerName || !algo || !poolUrl || !poolUser) {
                res.send(`Error: missing parameters`);
                return;
            }
            if (!config) {
                res.send(`Error: cannot start miner install without config`);
                return;
            }
            const params = {
                miner: minerName,
                coin,
                algo,
                poolUrl,
                poolUser,
                extraArgs,
            };
            try {
                yield Rig.minerRunStart(config, params); // TODO farm
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
                Rig.minerRunStop(config, params); // TODO farm
                res.send(`OK: miner run stopped`);
            }
            catch (err) {
                res.send(`Error: cannot stop miner run => ${err.message}`);
            }
            return;
        }
        res.send(`Error: invalid action`);
    });
}
exports.rigMinerRunPost = rigMinerRunPost;
;
/* #### */
function registerRigRoutes(app, urlPrefix = '') {
    // GET Rig homepage => /rig/
    app.get(`${urlPrefix}/`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        rigHomepage(yield getRigData(), req, res, next);
    }));
    // GET Rig status => /rig/status
    app.get(`${urlPrefix}/status`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        rigStatus(yield getRigData(), req, res, next);
    }));
    // GET Rig status JSON => /rig/status.json
    app.get(`${urlPrefix}/status.json`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const rigInfos = yield Rig.getRigInfos(config);
        let content = JSON.stringify(rigInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    }));
    // GET Rig farm-agent start => /rig/farm-agent/run
    app.get(`${urlPrefix}/farm-agent/run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _a;
        const config = Daemon.getConfig();
        const action = ((_a = req.query.action) === null || _a === void 0 ? void 0 : _a.toString()) || '';
        if (action === 'start') {
            Rig.farmAgentStart(config);
            res.send('Rig farm-agent started [TODO]');
            return;
        }
        else if (action === 'stop') {
            Rig.farmAgentStop();
            res.send('Rig farm-agent started [TODO]');
            return;
        }
        res.send(`try action start/stop. <a href="?action=start">start</a> | <a href="?action=stop">stop</a>`);
        // TODO: afficher page html
    }));
    // POST Rig farm-agent start => /rig/farm-agent/run
    app.post(`${urlPrefix}/farm-agent/run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _b;
        const config = Daemon.getConfig();
        const action = ((_b = req.body.action) === null || _b === void 0 ? void 0 : _b.toString()) || '';
        const farmAgentStatus = Rig.farmAgentGetStatus();
        if (action === 'start') {
            if (farmAgentStatus) {
                res.send('OK: Farm agent is running');
            }
            else {
                Rig.farmAgentStart(config);
                res.send('OK: Farm agent started');
            }
            return;
        }
        else if (action === 'stop') {
            if (farmAgentStatus) {
                Rig.farmAgentStop();
                res.send('OK: Farm agent stopped');
            }
            else {
                res.send('OK: Farm agent is not running');
            }
            return;
        }
    }));
    // GET Rig monitor run => /rig/monitor-run
    app.get(`${urlPrefix}/monitor-run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        //const config = Daemon.getConfig();
        const monitorStatus = Rig.monitorGetStatus();
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Rig Manager - Monitor run`,
                noIndex: false,
            }, contentTemplate: `..${SEP}rig${SEP}monitor_run.html`, monitorStatus });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // POST Rig monitor run => /rig/monitor-run
    app.post(`${urlPrefix}/monitor-run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _c;
        const config = Daemon.getConfig();
        const action = ((_c = req.body.action) === null || _c === void 0 ? void 0 : _c.toString()) || '';
        const monitorStatus = Rig.monitorGetStatus();
        if (action === 'start') {
            if (monitorStatus) {
                res.send('OK: Rig monitor is running');
            }
            else {
                Rig.monitorStart(config);
                res.send('OK: Rig monitor started');
            }
            return;
        }
        else if (action === 'stop') {
            if (monitorStatus) {
                Rig.monitorStop();
                res.send('OK: Rig monitor stopped');
            }
            else {
                res.send('OK: Rig monitor is not running');
            }
            return;
        }
        res.send(`Error: invalid action`);
    }));
    // GET Miner install page => /rig/miners/{minerName}/install
    app.get(`${urlPrefix}/miners/:minerName/install`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        rigMinerInstall(yield getRigData(), req, res, next);
    }));
    // POST Miner install page => /rig/miners/{minerName}/install
    app.post(`${urlPrefix}/miners/:minerName/install`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        rigMinerInstallPost(yield getRigData(), req, res, next);
    }));
    // GET Miner run page => /rig/miners/{minerName}/run
    app.get(`${urlPrefix}/miners/:minerName/run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        rigMinerRun(yield getRigData(), req, res, next);
    }));
    // POST Miner run page => /rig/miners/{minerName}/run
    app.post(`${urlPrefix}/miners/:minerName/run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        rigMinerRunPost(yield getRigData(), req, res, next);
    }));
    app.get(`${urlPrefix}/miners-run-modal`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        rigMinerRunModal(yield getRigData(), req, res, next);
    }));
}
exports.registerRigRoutes = registerRigRoutes;
