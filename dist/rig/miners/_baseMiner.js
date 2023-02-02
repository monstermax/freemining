"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minerCommands = exports.minerInstall = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
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
        const minerAlias = params.alias || `${this.minerName}-${version}`;
        const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), `frm-tmp.miner-install-${this.minerName}-${minerAlias}-`), {});
        const minerDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}rig${SEP}miners${SEP}${this.minerName}`;
        const aliasDir = `${minerDir}${SEP}${minerAlias}`;
        //if (minerAlias === 'default') {
        //    throw { message: `invalid alias. 'default' is a reserved word` };
        //}
        return {
            minerAlias,
            tempDir,
            minerDir,
            aliasDir,
        };
    },
    setDefault(minerDir, aliasDir, setAsDefaultAlias) {
        // Disabled because symlinks do not work properly on Windows
        //const symlinkExists = fs.existsSync(`${minerDir}/default`);
        //if (! symlinkExists || setAsDefaultAlias) {
        //    if (symlinkExists) {
        //        fs.unlinkSync(`${minerDir}/default`);
        //    }
        //    //fs.symlinkSync(aliasDir, `${minerDir}/default`);
        //    process.chdir(minerDir);
        //    const minerAlias = path.basename(aliasDir);
        //    fs.symlinkSync(minerAlias, `default`);
        //}
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
        fs_1.default.writeFileSync(`${aliasDir}/freemining.json`, JSON.stringify(aliasReport, null, 4));
        // Miner report
        let minerReport = {
            name: this.minerName,
            title: this.minerTitle,
            lastVersion: version,
            defaultAlias: minerAlias,
        };
        if (fs_1.default.existsSync(`${minerDir}/freemining.json`)) {
            const reportJson = fs_1.default.readFileSync(`${minerDir}/freemining.json`).toString();
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
        fs_1.default.writeFileSync(`${minerDir}/freemining.json`, JSON.stringify(minerReport, null, 4));
    }
};
exports.minerCommands = {
    apiPort: -1,
    command: '',
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
            const cpus = [];
            const gpus = [];
            const uptime = 0;
            const algo = '';
            const poolUrl = '';
            const poolUser = '';
            const worker = '';
            const hashRate = 0;
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
