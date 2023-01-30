"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCoreRoutes = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = require("../../common/utils");
const SEP = path_1.default.sep; //(os.platform() === 'win32') ? path.sep.repeat(2) : path.sep;
function registerCoreRoutes(app, urlPrefix = '') {
    app.get(urlPrefix + SEP, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const data = {
            now: utils_1.now,
            contentTemplate: `homepage.html`,
        };
        res.render(`core${SEP}layout.html`, data);
    }));
}
exports.registerCoreRoutes = registerCoreRoutes;
