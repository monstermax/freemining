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
/* ########## DESCRIPTION ######### */
/*

Website  :
Github   : https://github.com/andru-kun/wildrig-multi
Download : https://github.com/andru-kun/wildrig-multi/releases/

*/
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
/* ########## FUNCTIONS ######### */
exports.minerInstall = {
    version: '0.36.5b',
    install(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const targetAlias = params.alias || params.miner;
            const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), `frm-tmp.miner-install-${params.miner}-${targetAlias}-`), {});
            const targetDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}rig${SEP}miners${SEP}${targetAlias}`;
            let subDir = ``;
            //throw { message: `edit-me then delete this line` };
            const platform = (0, utils_1.getOpt)('--platform', config._args) || os_1.default.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
            let dlUrl;
            if (platform === 'linux') {
                dlUrl = `https://github.com/andru-kun/wildrig-multi/releases/download/${this.version}/wildrig-multi-linux-${this.version}.tar.xz`;
            }
            else if (platform === 'win32') {
                dlUrl = `https://github.com/andru-kun/wildrig-multi/releases/download/${this.version}/wildrig-multi-windows-${this.version}.7z`;
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
            yield (0, decompress_archive_1.decompressFile)(dlFilePath, `${tempDir}${SEP}unzipped`);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Extract complete`);
            // Install to target dir
            fs_1.default.mkdirSync(targetDir, { recursive: true });
            fs_1.default.rmSync(targetDir, { recursive: true, force: true });
            fs_1.default.renameSync(`${tempDir}${SEP}unzipped${subDir}${SEP}`, targetDir);
            if (os_1.default.platform() === 'linux') {
                fs_1.default.renameSync(`${targetDir}${SEP}wildrig-multi`, `${targetDir}${SEP}wildrig`);
            }
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Install complete into ${targetDir}`);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        });
    }
};
exports.minerCommands = {
    apiPort: 52013,
    command: 'wildrig',
    getCommandFile(config, params) {
        return this.command + (os_1.default.platform() === 'win32' ? '.exe' : '');
    },
    getCommandArgs(config, params) {
        const args = [
            '--no-color',
        ];
        if (this.apiPort > 0) {
            args.push(...[
                '--api-port', this.apiPort.toString(),
            ]);
        }
        if (params.algo) {
            args.push('--algo');
            args.push(params.algo);
        }
        if (params.poolUrl) {
            args.push('--url');
            args.push(params.poolUrl);
        }
        if (params.poolUser) {
            args.push('--user');
            args.push(params.poolUser);
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
