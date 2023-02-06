"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fullnodeCommands = exports.fullnodeInstall = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const client_js_1 = require("@open-rpc/client-js");
const utils_1 = require("../../common/utils");
const decompress_archive_1 = require("../../common/decompress_archive");
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
/* ########## FUNCTIONS ######### */
exports.fullnodeInstall = {
    fullnodeName: '',
    fullnodeTitle: '',
    lastVersion: '',
    github: '',
    install(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // EXTENDS ME
        });
    },
    getLastVersion() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.github)
                return '';
            const url = `https://api.github.com/repos/${this.github}/releases/latest`;
            const response = yield (0, node_fetch_1.default)(url);
            const releaseInfos = yield response.json();
            let version = releaseInfos.tag_name;
            if (version.startsWith('v')) {
                version = version.slice(1);
            }
            return version;
        });
    },
    getAllVersions() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.github)
                return [];
            const url = `https://api.github.com/repos/${this.github}/releases`;
            const response = yield (0, node_fetch_1.default)(url);
            const releaseVersions = yield response.json();
            return releaseVersions.map((release) => {
                let version = release.tag_name;
                if (version.startsWith('v')) {
                    version = version.slice(1);
                }
                return version;
            });
        });
    },
    getInstallOptions(config, params, version) {
        const fullnodeAlias = params.alias || `${this.fullnodeName}-${version}`;
        const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), `frm-tmp.fullnode-install-${this.fullnodeName}-${fullnodeAlias}-`), {});
        const fullnodeDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}node${SEP}fullnodes${SEP}${this.fullnodeName}`;
        const aliasDir = `${fullnodeDir}${SEP}${fullnodeAlias}`;
        return {
            fullnodeAlias,
            tempDir,
            fullnodeDir,
            aliasDir,
        };
    },
    writeReport(version, fullnodeAlias, dlUrl, aliasDir, fullnodeDir, setAsDefaultAlias = false) {
        // Alias report
        const aliasReport = {
            name: this.fullnodeName,
            alias: fullnodeAlias,
            version: version,
            installDate: new Date,
            installUrl: dlUrl,
        };
        fs_1.default.writeFileSync(`${aliasDir}/freeminingFullnodeAlias.json`, JSON.stringify(aliasReport, null, 4));
        // Fullnode report
        let fullnodeReport = {
            name: this.fullnodeName,
            title: this.fullnodeTitle,
            lastVersion: version,
            defaultAlias: fullnodeAlias,
        };
        if (fs_1.default.existsSync(`${fullnodeDir}/freeminingFullnode.json`)) {
            const reportJson = fs_1.default.readFileSync(`${fullnodeDir}/freeminingFullnode.json`).toString();
            fullnodeReport = JSON.parse(reportJson);
        }
        if (!fullnodeReport.versions) {
            fullnodeReport.versions = {};
        }
        if (version > fullnodeReport.lastVersion) {
            fullnodeReport.lastVersion = version;
        }
        if (setAsDefaultAlias) {
            fullnodeReport.defaultAlias = fullnodeAlias;
        }
        fullnodeReport.versions[fullnodeAlias] = aliasReport;
        fs_1.default.writeFileSync(`${fullnodeDir}/freeminingFullnode.json`, JSON.stringify(fullnodeReport, null, 4));
    },
    downloadFile(dlUrl, dlFilePath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Downloading file ${dlUrl}`);
            try {
                yield (0, utils_1.downloadFile)(dlUrl, dlFilePath);
                console.log(`${(0, utils_1.now)()} [INFO] [NODE] Download complete`);
            }
            catch (err) {
                console.warn(`${(0, utils_1.now)()} [WARNING] [NODE] Download failed`);
            }
        });
    },
    extractFile(tempDir, dlFilePath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            fs_1.default.mkdirSync(`${tempDir}${SEP}unzipped`);
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Extracting file ${dlFilePath}`);
            try {
                yield (0, decompress_archive_1.decompressFile)(dlFilePath, `${tempDir}${SEP}unzipped`);
                console.log(`${(0, utils_1.now)()} [INFO] [NODE] Extract complete`);
            }
            catch (err) {
                console.warn(`${(0, utils_1.now)()} [WARNING] [NODE] Extract failed`);
            }
        });
    }
};
exports.fullnodeCommands = {
    p2pPort: -1,
    rpcPort: -1,
    command: '',
    managed: false,
    getCommandFile(config, params) {
        return this.command + (os_1.default.platform() === 'linux' ? '' : '.exe');
    },
    getCommandArgs(config, params) {
        // EXTENDS ME
        return [];
    },
    getInfos(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // EXTENDS ME
            const fullnodeName = '';
            const coin = '';
            const blocks = -1;
            const blockHeaders = -1;
            const peers = -1;
            let infos = {
                fullnode: {
                    name: fullnodeName,
                    coin,
                },
                blockchain: {
                    blocks,
                    headers: blockHeaders,
                    peers,
                },
            };
            return infos;
        });
    },
    rpcRequest(fullnodeName, method, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            /*
            const rpcClient = new RpcClient({
                host: "127.0.0.1",
                port: this.rpcPort,
                protocol: "http",
            });
            rpcClient.setBasicAuth("user", "pass");
            */
            const transport = new client_js_1.HTTPTransport(`http://user:pass@127.0.0.1:${this.rpcPort}`);
            const rpcClient = new client_js_1.Client(new client_js_1.RequestManager([transport]));
            const result = yield rpcClient.request({ method, params })
                .catch((err) => {
                console.warn(`${(0, utils_1.now)()} [WARNING] [NODE] Cannot get ${method} ${fullnodeName} : ${err.message}`);
            });
            return result;
        });
    }
};
