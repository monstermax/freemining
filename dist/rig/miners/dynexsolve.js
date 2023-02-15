"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minerCommands = exports.minerInstall = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const utils_1 = require("../../common/utils");
const baseMiner = tslib_1.__importStar(require("./_baseMiner"));
/* ########## DESCRIPTION ######### */
/*

Website  :
Github   : https://github.com/dynexcoin/Dynex
Download : https://github.com/dynexcoin/Dynex/releases/tag/DynexSolve

*/
/* ########## CONFIG ######### */
const minerName = 'dynexsolve';
const minerTitle = 'Dynex Solve';
const github = 'dynexcoin/Dynex';
const lastVersion = '2.2.3';
const versionLinux = '3a9c8aa';
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
/* ########## FUNCTIONS ######### */
exports.minerInstall = Object.assign(Object.assign({}, baseMiner.minerInstall), { minerName,
    minerTitle,
    lastVersion,
    github,
    install(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const platform = (0, utils_1.getOpt)('--platform', config._args) || os_1.default.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
            const setAsDefaultAlias = params.default || false;
            let version = params.version || this.lastVersion;
            let subDir = `${SEP}DynexSolve-main-${versionLinux}`;
            if (platform === 'win32')
                subDir = `${SEP}dynexsolve_windows${version}`;
            if (platform === 'linux')
                subDir = `${SEP}DynexSolve-main-${versionLinux}`;
            let installFileName = 'dynexsolve';
            if (platform === 'win32') {
                installFileName = 'dynexsolve.exe';
            }
            // Download url selection
            const dlUrls = {
                'linux': `https://github.com/dynexcoin/Dynex/releases/download/DynexSolve/DynexSolve-main-${versionLinux}-ubuntu-20.04-linux-x64-core2.zip`,
                'win32': `https://github.com/dynexcoin/Dynex/releases/download/DynexSolve/dynexsolve_windows${version}.7z`,
                'darwin': ``,
                'freebsd': ``,
            };
            let dlUrl = dlUrls[platform] || '';
            if (dlUrl === '')
                throw { message: `No installation script available for the platform ${platform}` };
            // Some common install options
            const { minerAlias, tempDir, minerDir, aliasDir } = this.getInstallOptions(config, params, version);
            // Downloading
            const dlFileName = path_1.default.basename(dlUrl);
            const dlFilePath = `${tempDir}${SEP}${dlFileName}`;
            yield this.downloadFile(dlUrl, dlFilePath);
            // Extracting
            yield this.extractFile(tempDir, dlFilePath);
            // Install to target dir
            fs_1.default.mkdirSync(aliasDir, { recursive: true });
            fs_1.default.rmSync(aliasDir, { recursive: true, force: true });
            fs_1.default.cpSync(`${tempDir}${SEP}unzipped${subDir}${SEP}`, `${aliasDir}${SEP}`, { recursive: true });
            fs_1.default.chmodSync(`${aliasDir}/${installFileName}`, 0o755);
            // Write report files
            this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Install complete into ${aliasDir}`);
        });
    } });
exports.minerCommands = Object.assign(Object.assign({}, baseMiner.minerCommands), { apiPort: -1, command: 'dynexsolve', managed: false, // set true when the getInfos() script is ready
    getCommandArgs(config, params) {
        const args = [
            `-no-cpu`,
            `-multi-gpu`,
        ];
        if (this.apiPort > 0) {
            args.push(...[
                '--edit-me-api-host', '127.0.0.1',
                '--edit-me-api-port', this.apiPort.toString(),
            ]);
        }
        if (params.algo) {
            //args.push('--edit-me-algo');
            //args.push(params.algo);
        }
        if (params.poolUrl) {
            const parts = params.poolUrl.split(':');
            args.push('-stratum-url');
            args.push(parts[0]);
            args.push('-stratum-port');
            args.push(parts[1]);
        }
        if (params.poolUser) {
            const parts = params.poolUser.split('.');
            args.push('-mining-address');
            args.push(parts[0]);
            args.push('-stratum-password');
            args.push(parts[1]);
        }
        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }
        return args;
    },
    getInfos(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const apiUrl = `http://127.0.0.1:${this.apiPort}`;
            const headers = {}; // edit-me if needed
            const minerSummaryRes = yield (0, node_fetch_1.default)(`${apiUrl}/`, { headers }); // EDIT API URL
            const minerSummary = yield minerSummaryRes.json();
            // EDIT THESE VALUES - START //
            const uptime = -1; // edit-me
            const algo = 'edit-me';
            const workerHashRate = -1; // edit-me
            const poolUrl = ''; // edit-me
            const poolUser = ''; // edit-me
            const workerName = poolUser.split('.').pop() || ''; // edit-me
            const cpus = []; // edit-me
            const gpus = []; // edit-me
            // EDIT THESE VALUES - END //
            let infos = {
                miner: {
                    name: minerTitle,
                    worker: workerName,
                    uptime,
                    algo,
                    hashRate: workerHashRate,
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
    } });
