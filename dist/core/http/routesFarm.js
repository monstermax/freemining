"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFarmRoutes = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = require("../../common/utils");
const Daemon = tslib_1.__importStar(require("../../core/Daemon"));
const Farm = tslib_1.__importStar(require("../../farm/Farm"));
const routesRig = tslib_1.__importStar(require("./routesRig"));
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
const utilFuncs = {
    now: utils_1.now,
    formatNumber: utils_1.formatNumber,
};
/* ########## FUNCTIONS ######### */
function registerFarmRoutes(app, urlPrefix = '') {
    // FARM homepage => /farm/
    app.get(`${urlPrefix}/`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Farm Manager`,
                noIndex: false,
            }, contentTemplate: `..${SEP}farm${SEP}farm.html` });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // GET Farm status JSON => /farm/status.json
    app.get(`${urlPrefix}/status.json`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const farmInfos = Farm.getFarmInfos(config);
        let content = JSON.stringify(farmInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    }));
    app.get(`${urlPrefix}/rigs/`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const farmInfos = Farm.getFarmInfos(config);
        const rigsInfos = farmInfos.rigsInfos;
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Farm Manager`,
                noIndex: false,
            }, contentTemplate: `..${SEP}farm${SEP}farm_rigs.html`, 
            //farmInfos,
            rigsInfos });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    app.get(`${urlPrefix}/rigs/:rigName/`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);
        if (!rigData || !rigData.rigInfos) {
            res.send(`Error: invalid rig`);
            return;
        }
        routesRig.rigHomepage(rigData, req, res, next);
    }));
    app.get(`${urlPrefix}/rigs/:rigName/status`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);
        if (!(rigData === null || rigData === void 0 ? void 0 : rigData.rigInfos)) {
            res.send(`Error: invalid rig`);
            return;
        }
        routesRig.rigStatus(rigData, req, res, next);
    }));
    app.get(`${urlPrefix}/rigs/:rigName/status.json`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);
        if (!(rigData === null || rigData === void 0 ? void 0 : rigData.rigInfos)) {
            res.send(`Error: invalid rig`);
            return;
        }
        let content = JSON.stringify(rigData.rigInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    }));
    app.get(`${urlPrefix}/rigs/:rigName/config.json`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);
        if (!(rigData === null || rigData === void 0 ? void 0 : rigData.rigInfos)) {
            res.send(`Error: invalid rig`);
            return;
        }
        let content = JSON.stringify(rigData.config, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    }));
    app.get(`${urlPrefix}/rigs/:rigName/miners/:minerName/install`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);
        routesRig.rigMinerInstall(rigData, req, res, next);
    }));
    app.post(`${urlPrefix}/rigs/:rigName/miners/:minerName/install`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);
        routesRig.rigMinerInstallPost(rigData, req, res, next);
    }));
    app.get(`${urlPrefix}/rigs/:rigName/miners/:minerName/run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);
        routesRig.rigMinerRun(rigData, req, res, next);
    }));
    app.post(`${urlPrefix}/rigs/:rigName/miners/:minerName/run`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);
        routesRig.rigMinerRunPost(rigData, req, res, next);
    }));
    app.get(`${urlPrefix}/rigs/:rigName/miners-run-modal`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);
        routesRig.rigMinerRunModal(rigData, req, res, next);
    }));
}
exports.registerFarmRoutes = registerFarmRoutes;
function getRigData(rigName) {
    var _a;
    const config = Daemon.getConfig();
    const farmInfos = Farm.getFarmInfos(config);
    const rigInfos = farmInfos.rigsInfos[rigName];
    const rigConfig = Farm.getRigConfig(rigName);
    const allMiners = getRigAllMiners(rigInfos);
    const rigData = {
        rigName,
        isFarm: true,
        config: rigConfig,
        rigInfos,
        monitorStatus: ((_a = rigInfos === null || rigInfos === void 0 ? void 0 : rigInfos.status) === null || _a === void 0 ? void 0 : _a.monitorStatus) || false,
        allMiners,
        //rigConfig: { // TODO
        //    farmAgent: {
        //        host: '0.0.0.0',
        //        port: 0,
        //    },
        //},
    };
    return rigData;
}
function getRigAllMiners(rigInfos) {
    var _a, _b, _c, _d, _e, _f, _g;
    let installableMiners = [];
    let installedMiners = [];
    let installedMinersAliases = {};
    let runnableMiners = [];
    let runningMiners = [];
    let runningMinersAliases = {};
    let managedMiners = [];
    if (rigInfos) {
        installableMiners = ((_a = rigInfos.status) === null || _a === void 0 ? void 0 : _a.installableMiners) || [];
        installedMiners = ((_b = rigInfos.status) === null || _b === void 0 ? void 0 : _b.installedMiners) || [];
        installedMinersAliases = ((_c = rigInfos.status) === null || _c === void 0 ? void 0 : _c.installedMinersAliases) || {};
        runnableMiners = ((_d = rigInfos.status) === null || _d === void 0 ? void 0 : _d.runnableMiners) || [];
        runningMiners = ((_e = rigInfos.status) === null || _e === void 0 ? void 0 : _e.runningMiners) || [];
        runningMinersAliases = ((_f = rigInfos.status) === null || _f === void 0 ? void 0 : _f.runningMinersAliases) || {};
        managedMiners = ((_g = rigInfos.status) === null || _g === void 0 ? void 0 : _g.managedMiners) || [];
    }
    const minersNames = Array.from(new Set([
        ...installableMiners,
        ...installedMiners,
        //...Object.keys(installedMinersAliases),
        ...runnableMiners,
        //...Object.keys(runningMinersAliases),
        ...managedMiners,
    ]));
    const miners = Object.fromEntries(minersNames.map(minerName => {
        return [
            minerName,
            {
                installable: installableMiners.includes(minerName),
                installed: installedMiners.includes(minerName),
                installedAliases: installedMinersAliases,
                runnable: runnableMiners.includes(minerName),
                running: runningMiners.includes(minerName),
                runningAlias: runningMinersAliases,
                managed: managedMiners.includes(minerName),
            }
        ];
    }));
    /*
    // result:
    miners = {
        miner1: {
            installed: boolean,
            running: boolean,
            installable: boolean,
            runnable: boolean,
            managed: boolean,
        },
        ...
    }
    */
    return miners;
}
