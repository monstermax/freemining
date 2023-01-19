"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const http = tslib_1.__importStar(require("http"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const app = (0, express_1.default)();
const server = http.createServer(app);
const config = require('../pool_manager.json');
const httpServerHost = ((_a = config.poolServer) === null || _a === void 0 ? void 0 : _a.host) || '0.0.0.0';
const httpServerPort = Number(((_b = config.poolServer) === null || _b === void 0 ? void 0 : _b.port) || 4100);
let httpServerRoot = ((_c = config.poolServer) === null || _c === void 0 ? void 0 : _c.root) || `${__dirname}/web/public`;
if (httpServerRoot.startsWith('~')) {
    const HOME = process.env.HOME;
    httpServerRoot = `${HOME}${httpServerRoot.slice(1)}`;
}
app.use(express_1.default.urlencoded());
if (httpServerRoot) {
    console.log(`${now()} [${safe_1.default.blue('INFO')}] Using root folder ${httpServerRoot}`);
    app.use(express_1.default.static(httpServerRoot));
}
app.use(function (req, res, next) {
    // Error 404
    console.log(`${now()} [${safe_1.default.yellow('WARNING')}] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);
    next();
});
server.listen(httpServerPort, httpServerHost, () => {
    console.log(`${now()} [${safe_1.default.blue('INFO')}] Server started on ${httpServerHost}:${httpServerPort}`);
});
function formatNumber(n) {
    return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format(n);
}
function now() {
    const options = {
        /* year: "numeric", month: "2-digit", day: "2-digit", */
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    };
    return new Date().toLocaleTimeString("fr-FR", options);
}
