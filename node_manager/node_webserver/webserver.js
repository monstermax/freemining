"use strict";
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const http = tslib_1.__importStar(require("http"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const utils_1 = require("./common/utils");
const app = (0, express_1.default)();
const server = http.createServer(app);
const configNode = require('../node_manager.json');
const configFrm = require('../../freemining.json');
const httpServerHost = ((_a = configNode.nodeServer) === null || _a === void 0 ? void 0 : _a.host) || '0.0.0.0';
const httpServerPort = Number(((_b = configNode.nodeServer) === null || _b === void 0 ? void 0 : _b.port) || 4400);
let staticDir = ((_c = configNode.nodeServer) === null || _c === void 0 ? void 0 : _c.root) || `${__dirname}/web/public`;
let templatesDir = ((_d = configNode.nodeServer) === null || _d === void 0 ? void 0 : _d.templates) || `${__dirname}/web/templates`;
const nodeAppDir = __dirname + '/..'; // configFrm.frmDataDir + '/node';
const ctx = Object.assign(Object.assign(Object.assign({}, configFrm), configNode), { nodeAppDir });
templatesDir = (0, utils_1.stringTemplate)(templatesDir, ctx, false, true, true) || '';
staticDir = (0, utils_1.stringTemplate)(staticDir, ctx, false, true, true) || '';
/* ############################## MAIN ###################################### */
app.use(express_1.default.urlencoded({ extended: true }));
if (staticDir) {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Using static folder ${staticDir}`);
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Using templates folder ${templatesDir}`);
    app.use(express_1.default.static(staticDir));
}
app.get('/', (req, res, next) => {
    const content = loadTemplate('index.html');
    const pageContent = applyLayout(req, content, {});
    res.send(pageContent);
    res.end();
});
app.use(function (req, res, next) {
    // Error 404
    console.log(`${(0, utils_1.now)()} [${safe_1.default.yellow('WARNING')}] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);
    next();
});
server.listen(httpServerPort, httpServerHost, () => {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Server started on ${httpServerHost}:${httpServerPort}`);
});
/* ############################ FUNCTIONS ################################### */
function applyLayout(req, content, opts = {}) {
    const layoutPath = `${templatesDir}/layout_node_webserver.html`;
    opts = opts || {};
    opts.body = opts.body || {};
    opts.body.content = content;
    opts.currentUrl = req.url;
    return (0, utils_1.applyHtmlLayout)(layoutPath, opts);
}
