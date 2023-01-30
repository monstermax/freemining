"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFarmRoutes = void 0;
const tslib_1 = require("tslib");
function registerFarmRoutes(app, urlPrefix = '') {
    app.get(urlPrefix + '/', (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        res.render('farm/farm.html');
    }));
}
exports.registerFarmRoutes = registerFarmRoutes;
