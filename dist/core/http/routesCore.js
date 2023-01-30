"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCoreRoutes = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = require("../../common/utils");
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
}
exports.registerCoreRoutes = registerCoreRoutes;
