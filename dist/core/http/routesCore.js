"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCoreRoutes = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = require("../../common/utils");
const sysinfos_1 = require("../../common/sysinfos");
const Daemon = tslib_1.__importStar(require("../../core/Daemon"));
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
const utilFuncs = {
    now: utils_1.now,
};
/* ########## FUNCTIONS ######### */
function registerCoreRoutes(app, urlPrefix = '') {
    // Freemining homepage
    app.get(`${urlPrefix}/`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        //const config = Daemon.getConfig();
        const data = Object.assign(Object.assign({}, utilFuncs), { meta: {
                title: `Freemining`,
                noIndex: false,
            }, contentTemplate: `.${SEP}homepage.html` });
        res.render(`.${SEP}core${SEP}layout.html`, data);
    }));
    // Sysinfos => /sysinfos.json
    app.get(`${urlPrefix}/sysinfos.json`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const sysInfos = yield (0, sysinfos_1.getSystemInfos)();
        let content = JSON.stringify(sysInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    }));
    app.get(`${urlPrefix}/quit`, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const action = req.query.action || '';
        if (action === 'quit') {
            Daemon.safeQuit(0);
        }
        const content = `quitting...`;
        res.send(content);
    }));
}
exports.registerCoreRoutes = registerCoreRoutes;
