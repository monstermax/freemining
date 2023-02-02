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
const baseMiner = tslib_1.__importStar(require("./_baseMiner"));
/* ########## DESCRIPTION ######### */
/*

Website  :
Github   : https://github.com/firoorg/firominer
Download : https://github.com/firoorg/firominer/releases/

*/
/* ########## CONFIG ######### */
const minerName = 'firominer';
const minerTitle = 'FiroMiner';
const github = 'firoorg/firominer';
const lastVersion = '1.1.0';
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
            let subDir = ``;
            let installFileName = 'firominer';
            // Download url selection
            const dlUrls = {
                'linux': `https://github.com/firoorg/firominer/releases/download/${version}/firominer-Linux.7z`,
                'win32': `https://github.com/firoorg/firominer/releases/download/${version}/firominer-Windows.zip`,
                'darwin': ``,
                'freebsd': ``,
            };
            let dlUrl = dlUrls[platform] || '';
            if (!dlUrl)
                throw { message: `No installation script available for the platform ${platform}` };
            // Some common install options
            const { minerAlias, tempDir, minerDir, aliasDir } = this.getInstallOptions(config, params, version);
            if (platform === 'win32') {
                installFileName = 'firominer.exe';
            }
            // Downloading
            const dlFileName = path_1.default.basename(dlUrl);
            const dlFilePath = `${tempDir}${SEP}${dlFileName}`;
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Downloading file ${dlUrl}`);
            yield (0, utils_1.downloadFile)(dlUrl, dlFilePath);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Download complete`);
            // Extracting
            fs_1.default.mkdirSync(`${tempDir}${SEP}unzipped`);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Extracting file ${dlFilePath}`);
            yield (0, decompress_archive_1.decompressFile)(dlFilePath, `${tempDir}${SEP}unzipped`);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Extract complete`);
            // Install to target dir
            fs_1.default.mkdirSync(aliasDir, { recursive: true });
            fs_1.default.rmSync(aliasDir, { recursive: true, force: true });
            fs_1.default.renameSync(`${tempDir}${SEP}unzipped${subDir}${SEP}`, aliasDir);
            fs_1.default.chmodSync(`${aliasDir}/${installFileName}`, 0o755);
            this.setDefault(minerDir, aliasDir, setAsDefaultAlias);
            // Write report files
            this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Install complete into ${aliasDir}`);
        });
    } });
exports.minerCommands = Object.assign(Object.assign({}, baseMiner.minerCommands), { apiPort: 52012, command: 'firominer', // the filename of the executable (without .exe extension)
    getCommandArgs(config, params) {
        const args = [];
        if (this.apiPort > 0) {
            args.push(...[
                '--api-bind',
                '--api-port', this.apiPort.toString(),
                //'--api-password', 'pass',
            ]);
        }
        if (params.algo) {
        }
        if (params.poolUrl && params.poolUser) {
            args.push('--pool');
            args.push(`stratum+tcp://${params.poolUser}:x@${params.poolUrl}`);
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
            const minerName = 'edit-me';
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
                    name: minerName,
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
