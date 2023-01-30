"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCoreRoutes = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = require("../../common/utils");
function registerCoreRoutes(app, urlPrefix = '') {
    app.get(urlPrefix + path_1.default.sep, (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const data = {
            now: utils_1.now,
            contentTemplate: `.${path_1.default.sep}homepage.html`,
        };
        res.render(`core${path_1.default.sep}layout.html`, data);
    }));
}
exports.registerCoreRoutes = registerCoreRoutes;
