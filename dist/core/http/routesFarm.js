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
        //const config = Daemon.getConfig();
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);
        if (!rigData || !rigData.rigInfos) {
            res.send(`Error: invalid rig`);
            return;
        }
        routesRig.rigHomepage(rigData, req, res, next);
    }));
    app.get(`${urlPrefix}/rigs/:rigName/status`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        //const config = Daemon.getConfig();
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);
        if (!(rigData === null || rigData === void 0 ? void 0 : rigData.rigInfos)) {
            res.send(`Error: invalid rig`);
            return;
        }
        routesRig.rigStatus(rigData, req, res, next);
    }));
}
exports.registerFarmRoutes = registerFarmRoutes;
function getRigData(rigName) {
    var _a;
    const config = Daemon.getConfig();
    const farmInfos = Farm.getFarmInfos(config);
    const rigInfos = farmInfos.rigsInfos[rigName];
    const allMiners = {}; // TODO
    if (!rigInfos) {
        return null;
    }
    const rigData = {
        config,
        rigInfos,
        monitorStatus: ((_a = rigInfos.status) === null || _a === void 0 ? void 0 : _a.monitorStatus) || false,
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
