"use strict";
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const http = tslib_1.__importStar(require("http"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const utils_1 = require("./common/utils");
const app = (0, express_1.default)();
const server = http.createServer(app);
const configPool = require('../pool_manager.json');
const configFrm = require('../../freemining.json');
const engineApiUrl = ((_a = configPool.poolWebserver) === null || _a === void 0 ? void 0 : _a.apiProxyUrl) || 'http://localhost:4000/api/';
const httpServerHost = ((_b = configPool.poolWebserver) === null || _b === void 0 ? void 0 : _b.host) || '0.0.0.0';
const httpServerPort = Number(((_c = configPool.poolWebserver) === null || _c === void 0 ? void 0 : _c.port) || 4100);
let staticDir = ((_d = configPool.poolWebserver) === null || _d === void 0 ? void 0 : _d.root) || `${__dirname}/web/public`;
let templatesDir = ((_e = configPool.poolWebserver) === null || _e === void 0 ? void 0 : _e.templates) || `${__dirname}/web/templates`;
let engineWebsiteDir = ((_f = configPool.poolWebserver) === null || _f === void 0 ? void 0 : _f.poolsSiteDir) || `${__dirname}/web/public`;
const poolAppDir = __dirname + '/..'; // configFrm.frmDataDir + '/pool';
const ctx = Object.assign(Object.assign(Object.assign({}, configFrm), configPool), { poolAppDir });
templatesDir = (0, utils_1.stringTemplate)(templatesDir, ctx, false, true, true) || '';
staticDir = (0, utils_1.stringTemplate)(staticDir, ctx, false, true, true) || '';
engineWebsiteDir = (0, utils_1.stringTemplate)(engineWebsiteDir, ctx, false, true, true) || '';
const poolLayoutPath = `${templatesDir}/layout_pool_webserver.html`;
/* ############################## MAIN ###################################### */
app.use(express_1.default.urlencoded({ extended: true }));
if (staticDir) {
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Using static folder ${staticDir}`);
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Using templates folder ${templatesDir}`);
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Using engineWebsite folder ${engineWebsiteDir}`);
    console.log(`${(0, utils_1.now)()} [${safe_1.default.blue('INFO')}] Using engineApiUrl folder ${engineApiUrl}`);
    app.use(express_1.default.static(staticDir));
}
app.get('/', (req, res, next) => {
    const pageContent = loadPoolTemplate('index.html');
    res.send(pageContent);
    res.end();
});
app.use('/pools', express_1.default.static(engineWebsiteDir));
app.use('/api/', function (req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // Proxy to miningcore API
        try {
            const url = (engineApiUrl.endsWith('/') ? engineApiUrl.slice(0, -1) : engineApiUrl) + req.url;
            const response = yield (0, node_fetch_1.default)(url);
            const content = yield response.text();
            res.send(content);
        }
        catch (err) {
            console.log(`ERROR: ${err.message}`);
            res.send('ERROR');
        }
        res.end();
    });
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
function loadPoolTemplate(tplFile, data = {}, currentUrl = '') {
    const content = loadTemplate(templatesDir, tplFile) || '';
    const pageContent = (0, utils_1.applyHtmlLayout)(content, data, poolLayoutPath, currentUrl);
    return pageContent;
}
//export function loadTemplate(templatesDir: string, tplFile: string, data: any={}): string | null {
//    const tplPath = `${templatesDir}/${tplFile}`;
//
//    if (! fs.existsSync(tplPath)) {
//        return null;
//    }
//    const layoutTemplate = fs.readFileSync(tplPath).toString();
//    let tplContent = stringTemplate(layoutTemplate, data);
//
//    return tplContent;
//}
