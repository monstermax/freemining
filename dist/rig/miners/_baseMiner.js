"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minerCommands = exports.minerInstall = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const utils_1 = require("../../common/utils");
const decompress_archive_1 = require("../../common/decompress_archive");
// https://docs.google.com/spreadsheets/d/1IjCImtz4bPQbOoj5_QpQw6kVCPL71a7ncrY9YMS2haA/edit#gid=1761756353 - config overclocking
// https://github.com/minershive/hive-pooltemplates/tree/master/miners - config miners algos + pools configs
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
/* ########## FUNCTIONS ######### */
exports.minerInstall = {
    minerName: '',
    minerTitle: '',
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
            let version = releaseInfos.tag_name || '';
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
            const releaseVersions = yield response.json().catch((err) => null);
            if (!releaseVersions || !Array.isArray(releaseVersions)) {
                return [];
            }
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
        const minerAlias = params.alias || `${this.minerName}-${version}`;
        const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), `frm-tmp.miner-install-${this.minerName}-${minerAlias}-`), {});
        const minerDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}rig${SEP}miners${SEP}${this.minerName}`;
        const aliasDir = `${minerDir}${SEP}${minerAlias}`;
        return {
            minerAlias,
            tempDir,
            minerDir,
            aliasDir,
        };
    },
    uninstall(minerAlias, minerDir) {
        var _a;
        if (!fs_1.default.existsSync(`${minerDir}/freeminingMiner.json`)) {
            throw new Error('missing freeminingMiner.json');
        }
        const reportJson = fs_1.default.readFileSync(`${minerDir}/freeminingMiner.json`).toString();
        const minerReport = JSON.parse(reportJson);
        delete minerReport.versions[minerAlias];
        const versionsList = Object.values(minerReport.versions);
        if (versionsList.length === 0) {
            fs_1.default.rmSync(minerDir, { recursive: true });
            return;
        }
        if (minerReport.defaultAlias === minerAlias) {
            const lastAlias = ((_a = versionsList.at(-1)) === null || _a === void 0 ? void 0 : _a.alias) || '';
            minerReport.defaultAlias = lastAlias;
        }
        fs_1.default.writeFileSync(`${minerDir}/freeminingMiner.json`, JSON.stringify(minerReport, null, 4));
    },
    writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias = false) {
        // Alias report
        const aliasReport = {
            name: this.minerName,
            alias: minerAlias,
            version: version,
            installDate: new Date,
            installUrl: dlUrl,
        };
        fs_1.default.writeFileSync(`${aliasDir}/freeminingMinerAlias.json`, JSON.stringify(aliasReport, null, 4));
        // Miner report
        let minerReport = {
            name: this.minerName,
            title: this.minerTitle,
            lastVersion: version,
            defaultAlias: minerAlias,
        };
        if (fs_1.default.existsSync(`${minerDir}/freeminingMiner.json`)) {
            const reportJson = fs_1.default.readFileSync(`${minerDir}/freeminingMiner.json`).toString();
            minerReport = JSON.parse(reportJson);
        }
        if (!minerReport.versions) {
            minerReport.versions = {};
        }
        if (version > minerReport.lastVersion) {
            minerReport.lastVersion = version;
        }
        if (setAsDefaultAlias) {
            minerReport.defaultAlias = minerAlias;
        }
        minerReport.versions[minerAlias] = aliasReport;
        fs_1.default.writeFileSync(`${minerDir}/freeminingMiner.json`, JSON.stringify(minerReport, null, 4));
    },
    downloadFile(dlUrl, dlFilePath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Downloading file ${dlUrl}`);
            yield (0, utils_1.downloadFile)(dlUrl, dlFilePath);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Download complete`);
        });
    },
    extractFile(tempDir, dlFilePath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            fs_1.default.mkdirSync(`${tempDir}${SEP}unzipped`);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Extracting file ${dlFilePath}`);
            yield (0, decompress_archive_1.decompressFile)(dlFilePath, `${tempDir}${SEP}unzipped`);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Extract complete`);
        });
    }
};
exports.minerCommands = {
    apiPort: -1,
    command: '',
    managed: false,
    getCommandFile(config, params) {
        return this.command + (os_1.default.platform() === 'win32' ? '.exe' : '');
    },
    getCommandArgs(config, params) {
        // EXTENDS ME
        return [];
    },
    getInfos(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // EXTENDS ME
            const uptime = 0;
            const algo = '';
            const poolUrl = '';
            const poolUser = '';
            const worker = '';
            const hashRate = 0;
            const cpus = [];
            const gpus = [];
            let infos = {
                miner: {
                    name: '',
                    worker,
                    uptime,
                    algo,
                    hashRate,
                },
                pool: {
                    url: poolUrl,
                    account: poolUser,
                },
                devices: {
                    cpus,
                    gpus,
                }
            };
            return infos;
        });
    }
};
