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

Website  : https://nanominer.org/
Github   : https://github.com/nanopool/nanominer
Download : https://github.com/nanopool/nanominer/releases/

*/
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
/* ########## FUNCTIONS ######### */
exports.minerInstall = {
    version: '3.7.6',
    install(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const targetAlias = params.alias || params.miner;
            const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), `frm-tmp.miner-install-${params.miner}-${targetAlias}-`), {});
            const targetDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}rig${SEP}miners${SEP}${targetAlias}`;
            //throw { message: `edit-me then delete this line` };
            const platform = (0, utils_1.getOpt)('--platform', config._args) || os_1.default.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
            let dlUrl;
            let subDir = `${SEP}nanominer-*-${this.version}`;
            if (platform === 'linux') {
                dlUrl = `https://github.com/nanopool/nanominer/releases/download/v${this.version}/nanominer-linux-${this.version}.tar.gz`;
                subDir = '';
            }
            else if (platform === 'win32') {
                dlUrl = `https://github.com/nanopool/nanominer/releases/download/v${this.version}/nanominer-windows-${this.version}.zip`;
                subDir = `${SEP}nanominer-windows-${this.version}`;
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
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Install complete into ${targetDir}`);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        });
    }
};
exports.minerCommands = {
    apiPort: 52014,
    command: 'nanominer',
    getCommandFile(config, params) {
        return this.command + (os_1.default.platform() === 'win32' ? '.exe' : '');
    },
    getCommandArgs(config, params) {
        const args = [];
        if (this.apiPort > 0) {
            args.push(...[
                '-webPort', this.apiPort.toString(),
            ]);
        }
        if (params.algo) {
            args.push('-algo');
            args.push(params.algo);
        }
        if (params.poolUrl) {
            args.push('-pool1');
            args.push(params.poolUrl);
        }
        if (params.poolUser) {
            args.push('-wallet');
            args.push(params.poolUser);
        }
        if (true) {
            //args.push('--edit-me-password');
            //args.push('x');
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
            const minerSummaryRes = yield (0, node_fetch_1.default)(`${apiUrl}/stats`, { headers }); // EDIT API URL
            const minerSummary = yield minerSummaryRes.json();
            // EDIT THESE VALUES - START //
            const minerName = 'Nanominer';
            const uptime = minerSummary.WorkTime;
            const algoInfos = Object.values(minerSummary.Algorithms[0])[0] || {};
            const algo = Object.keys(algoInfos)[0];
            const workerHashRate = -1; // edit-me
            const poolUrl = ''; // edit-me / Object.values(algoInfos as any)[0].CurrentPool;
            const poolUser = ''; // edit-me
            const workerName = poolUser.split('.').pop() || ''; // edit-me
            const cpus = [];
            const gpus = Object.values(minerSummary.Devices[0]).map((gpu, idx) => {
                return {
                    id: idx,
                    name: gpu.Name,
                    hashRate: algoInfos[`GPU ${idx}`].Hashrate,
                    temperature: gpu.Temperature,
                    fanSpeed: gpu.Fan,
                    power: gpu.Power,
                };
            });
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
