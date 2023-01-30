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
const utils_1 = require("../../common/utils");
exports.minerInstall = {
    version: '6.18.1',
    install(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const targetAlias = params.alias || params.miner;
            const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), `frm-tmp.miner-install-${params.miner}-${targetAlias}-`), {});
            const targetDir = `${config === null || config === void 0 ? void 0 : config.appDir}${path_1.default.sep}rig${path_1.default.sep}miners${path_1.default.sep}${targetAlias}`;
            const platform = (0, utils_1.getOpt)('--platform', config._args) || os_1.default.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
            let dlUrl;
            if (platform === 'linux') {
                dlUrl = `https://github.com/trexminer/T-Rex/releases/download/0.26.8/t-rex-0.26.8-linux.tar.gz`;
            }
            else if (platform === 'win32') {
                dlUrl = `https://github.com/trexminer/T-Rex/releases/download/0.26.8/t-rex-0.26.8-win.zip`;
            }
            else if (platform === 'darwin') {
                throw { message: `No installation script available for the platform ${platform}` };
            }
            else {
                throw { message: `No installation script available for the platform ${platform}` };
            }
            // Downloading
            const dlFileName = path_1.default.basename(dlUrl);
            const dlFilePath = `${tempDir}${path_1.default.sep}${dlFileName}`;
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Downloading file ${dlUrl}`);
            yield (0, utils_1.downloadFile)(dlUrl, dlFilePath);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Download complete`);
            // Extracting
            fs_1.default.mkdirSync(`${tempDir}${path_1.default.sep}unzipped`);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Extracting file ${dlFilePath}`);
            if (path_1.default.extname(dlFilePath) === '.gz') {
                yield tar_1.default.extract({
                    file: dlFilePath,
                    cwd: `${tempDir}${path_1.default.sep}unzipped`,
                }).catch((err) => {
                    throw { message: err.message };
                });
            }
            else {
                const zipFile = new adm_zip_1.default(dlFilePath);
                yield new Promise((resolve, reject) => {
                    zipFile.extractAllToAsync(`${tempDir}${path_1.default.sep}unzipped`, true, true, (err) => {
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
            fs_1.default.rmSync(targetDir, { recursive: true, force: true });
            fs_1.default.renameSync(`${tempDir}${path_1.default.sep}unzipped${path_1.default.sep}`, targetDir);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Install complete into ${targetDir}`);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        });
    }
};
exports.minerCommands = {
    apiPort: 52005,
    command: 't-rex',
    getCommandFile(config, params) {
        return this.command + (os_1.default.platform() === 'linux' ? '' : '.exe');
    },
    getCommandArgs(config, params) {
        const args = [
            '--api-bind-http', `127.0.0.1:${this.apiPort.toString()}`,
        ];
        if (params.algo) {
            args.push('-a');
            args.push(params.algo);
        }
        if (params.poolUrl) {
            args.push('-o');
            args.push(params.poolUrl);
        }
        if (params.poolUser) {
            args.push('-u');
            args.push(params.poolUser);
        }
        if (true) {
            args.push('-p');
            args.push('x');
        }
        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }
        return args;
    },
    getInfos(config, params) {
        var _a, _b;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const apiUrl = `http://127.0.0.1:${this.apiPort}`;
            const headers = {};
            const minerSummaryRes = yield (0, node_fetch_1.default)(`${apiUrl}/summary`, { headers });
            const minerSummary = yield minerSummaryRes.json();
            const minerName = 'T-Rex';
            const algo = minerSummary.algorithm;
            const poolUrl = ((_a = minerSummary.active_pool) === null || _a === void 0 ? void 0 : _a.url) || '';
            const poolUser = ((_b = minerSummary.active_pool) === null || _b === void 0 ? void 0 : _b.user) || '';
            const workerName = poolUser.split('.').pop() || '';
            const cpus = [];
            let workerHashRate = 0;
            const gpus = minerSummary.gpus.map((gpu) => {
                workerHashRate += gpu.hashrate;
                return {
                    id: gpu.gpu_id,
                    name: gpu.name,
                    hashRate: gpu.hashrate,
                    temperature: gpu.temperature,
                    fanSpeed: gpu.fan_speed,
                    power: gpu.power,
                };
            });
            const hashRate = workerHashRate;
            let infos = {
                infos: {
                    name: minerName,
                    worker: workerName,
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
