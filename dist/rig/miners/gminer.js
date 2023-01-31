"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minerCommands = exports.minerInstall = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
const tar_1 = tslib_1.__importDefault(require("tar"));
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const adm_zip_1 = tslib_1.__importDefault(require("adm-zip"));
const decompress_1 = tslib_1.__importDefault(require("decompress"));
const decompressTarxz = require('decompress-tarxz');
const utils_1 = require("../../common/utils");
/* ########## DESCRIPTION ######### */
/*

Website:
Github :

*/
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
/* ########## FUNCTIONS ######### */
exports.minerInstall = {
    version: '3.27',
    install(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const targetAlias = params.alias || params.miner;
            const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), `frm-tmp.miner-install-${params.miner}-${targetAlias}-`), {});
            const targetDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}rig${SEP}miners${SEP}${targetAlias}`;
            const versionBis = this.version.replaceAll('.', '_');
            //throw { message: `edit-me then delete this line` };
            const platform = (0, utils_1.getOpt)('--platform', config._args) || os_1.default.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
            let dlUrl;
            if (platform === 'linux') {
                dlUrl = `https://github.com/develsoftware/GMinerRelease/releases/download/${this.version}/gminer_${versionBis}_linux64.tar.xz`;
            }
            else if (platform === 'win32') {
                dlUrl = `https://github.com/develsoftware/GMinerRelease/releases/download/${this.version}/gminer_${versionBis}_windows64.zip`;
            }
            else if (platform === 'darwin') {
                dlUrl = `edit-me`;
            }
            else {
                throw { message: `No installation script available for the platform ${platform}` };
            }
            if (dlUrl === 'edit-me')
                throw { message: `No installation script available for the platform ${platform}` };
            // Downloading
            const dlFileName = path_1.default.basename(dlUrl);
            const dlFilePath = `${tempDir}${SEP}${dlFileName}`;
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Downloading file ${dlUrl}`);
            yield (0, utils_1.downloadFile)(dlUrl, dlFilePath);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Download complete`);
            // Extracting
            fs_1.default.mkdirSync(`${tempDir}${SEP}unzipped`);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Extracting file ${dlFilePath}`);
            if (path_1.default.extname(dlFilePath) === '.xz') {
                yield (0, decompress_1.default)(dlFilePath, `${tempDir}${SEP}unzipped`, {
                    plugins: [
                        decompressTarxz()
                    ]
                });
            }
            else if (path_1.default.extname(dlFilePath) === '.gz') {
                yield tar_1.default.extract({
                    file: dlFilePath,
                    cwd: `${tempDir}${SEP}unzipped`,
                }).catch((err) => {
                    throw { message: err.message };
                });
            }
            else {
                const zipFile = new adm_zip_1.default(dlFilePath);
                yield new Promise((resolve, reject) => {
                    zipFile.extractAllToAsync(`${tempDir}${SEP}unzipped`, true, true, (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(null);
                    });
                }).catch((err) => {
                    throw { message: err.message };
                });
            }
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Extract complete`);
            // Install to target dir
            fs_1.default.mkdirSync(targetDir, { recursive: true });
            fs_1.default.rmSync(targetDir, { recursive: true, force: true });
            fs_1.default.renameSync(`${tempDir}${SEP}unzipped${SEP}`, targetDir);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Install complete into ${targetDir}`);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        });
    }
};
exports.minerCommands = {
    apiPort: -1,
    command: 'miner',
    getCommandFile(config, params) {
        return this.command + (os_1.default.platform() === 'linux' ? '' : '.exe');
    },
    getCommandArgs(config, params) {
        const args = [];
        if (this.apiPort > 0) {
            args.push(...[
                '--api', this.apiPort.toString(),
            ]);
        }
        if (params.algo) {
            args.push('--algo');
            args.push(params.algo);
        }
        if (params.poolUrl) {
            args.push('--server');
            args.push(params.poolUrl.split(':')[0] || "-");
            args.push('--port');
            args.push(params.poolUrl.split(':')[1] || 0);
        }
        if (params.poolUser) {
            args.push('--user');
            args.push(params.poolUser);
        }
        if (true) {
            args.push('--pass');
            args.push('x');
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
                infos: {
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
    }
};
