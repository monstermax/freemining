"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPoolRoutes = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = require("../../common/utils");
const Daemon = tslib_1.__importStar(require("../../core/Daemon"));
const Pool = tslib_1.__importStar(require("../../pool/Pool"));
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
const utilFuncs = {
    now: utils_1.now,
};
/* ########## FUNCTIONS ######### */
function registerPoolRoutes(app, urlPrefix = '') {
    // POOL homepage => /pool/
    app.get(`${urlPrefix}/`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining - Pool Manager`,
                noIndex: false,
            }, contentTemplate: `..${SEP}pool${SEP}pool.html` });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // GET Pool status JSON => /pool/status.json
    app.get(`${urlPrefix}/status.json`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = Daemon.getConfig();
        const poolInfos = Pool.getPoolInfos(config);
        let content = JSON.stringify(poolInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    }));
}
exports.registerPoolRoutes = registerPoolRoutes;
