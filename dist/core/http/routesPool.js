"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPoolRoutes = void 0;
const tslib_1 = require("tslib");
function registerPoolRoutes(app, urlPrefix = '') {
    app.get(urlPrefix + '/', (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        res.render('pool/pool.html');
    }));
}
exports.registerPoolRoutes = registerPoolRoutes;
