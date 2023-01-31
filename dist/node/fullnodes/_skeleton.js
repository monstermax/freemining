"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fullnodeCommands = exports.fullnodeInstall = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
const tar_1 = tslib_1.__importDefault(require("tar"));
const adm_zip_1 = tslib_1.__importDefault(require("adm-zip"));
const utils_1 = require("../../common/utils");
/* ########## DESCRIPTION ######### */
/*

Website:
Github :

*/
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
/* ########## FUNCTIONS ######### */
exports.fullnodeInstall = {
    version: 'edit-me',
    install(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const targetAlias = params.alias || params.fullnode;
            const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), `frm-tmp.fullnode-install-${params.fullnode}-${targetAlias}-`), {});
            const targetDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}node${SEP}fullnodes${SEP}${targetAlias}`;
            throw { message: `edit-me then delete this line` };
            const platform = (0, utils_1.getOpt)('--platform', config._args) || os_1.default.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
            let dlUrl;
            if (platform === 'linux') {
                dlUrl = `edit-me`;
            }
            else if (platform === 'win32') {
                dlUrl = `edit-me`;
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
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Downloading file ${dlUrl}`);
            yield (0, utils_1.downloadFile)(dlUrl, dlFilePath);
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Download complete`);
            // Extracting
            fs_1.default.mkdirSync(`${tempDir}${SEP}unzipped`);
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Extracting file ${dlFilePath}`);
            if (path_1.default.extname(dlFilePath) === '.gz') {
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
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Extract complete`);
            // Install to target dir
            fs_1.default.mkdirSync(targetDir, { recursive: true });
            fs_1.default.rmSync(targetDir, { recursive: true, force: true });
            fs_1.default.renameSync(`${tempDir}${SEP}unzipped${SEP}edit-me${SEP}`, targetDir);
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Install complete into ${targetDir}`);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        });
    }
};
exports.fullnodeCommands = {
    p2pPort: -1,
    rpcPort: -1,
    command: 'edit-me',
    getCommandFile(config, params) {
        return this.command + (os_1.default.platform() === 'linux' ? '' : '.exe');
    },
    getCommandArgs(config, params) {
        const args = [
            `-edit-me-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
        ];
        if (this.rpcPort !== -1) {
            args.push(`-edit-me-rpcport=${this.rpcPort.toString()}`);
        }
        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }
        return args;
    },
    getInfos(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const apiUrl = `http://127.0.0.1:${this.rpcPort}`;
            const headers = {}; // edit-me if needed
            // TODO: RPC REQUEST
            //const fullnodeSummaryRes = await fetch(`${apiUrl}/`, {headers}); // EDIT API URL
            //const fullnodeSummary: any = await fullnodeSummaryRes.json();
            // EDIT THESE VALUES - START //
            const fullnodeName = 'edit-me';
            const coin = 'edit-me';
            const blocks = -1; // edit-me
            const blockHeaders = -1; // edit-me
            const cpus = []; // edit-me
            // EDIT THESE VALUES - END //
            let infos = {
                infos: {
                    name: fullnodeName,
                    coin,
                },
                blockchain: {
                    blocks,
                    headers: blockHeaders,
                },
            };
            return infos;
        });
    }
};
