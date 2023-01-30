"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRigRoutes = void 0;
const tslib_1 = require("tslib");
function registerRigRoutes(app, urlPrefix = '') {
    app.get(urlPrefix + '/', (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        res.render('rig/rig.html');
    }));
    app.get(urlPrefix + '/start', (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        res.send('rig started');
    }));
    app.get(urlPrefix + '/status', (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        res.send('rig status:');
    }));
    app.get(urlPrefix + '/stop', (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        res.send('rig stopped');
    }));
}
exports.registerRigRoutes = registerRigRoutes;
