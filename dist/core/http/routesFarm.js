"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFarmRoutes = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = require("../../common/utils");
const Daemon = tslib_1.__importStar(require("../../core/Daemon"));
const Farm = tslib_1.__importStar(require("../../farm/Farm"));
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
const utilFuncs = {
    now: utils_1.now,
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
        const farmInfos = Farm.getFarmInfos();
        let content = JSON.stringify(farmInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    }));
    app.get(`${urlPrefix}/rigs/`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const farmInfos = Farm.getFarmInfos();
        const rigsInfos = farmInfos.rigsInfos;
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Farm Manager`,
                noIndex: false,
            }, contentTemplate: `..${SEP}farm${SEP}farm_rigs.html`, 
            //farmInfos,
            rigsInfos });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
}
exports.registerFarmRoutes = registerFarmRoutes;
