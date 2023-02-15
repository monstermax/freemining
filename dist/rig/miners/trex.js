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

Website  : https://trex-miner.com/
Github   : https://github.com/trexminer/T-Rex
Download : https://github.com/trexminer/T-Rex/releases/

*/
/* ########## CONFIG ######### */
const minerName = 'trex';
const minerTitle = 'T-Rex';
const github = 'trexminer/T-Rex';
const lastVersion = '0.26.8';
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
            // Download url selection
            const dlUrls = {
                'linux': `https://github.com/trexminer/T-Rex/releases/download/${version}/t-rex-${version}-linux.tar.gz`,
                'win32': `https://github.com/trexminer/T-Rex/releases/download/${version}/t-rex-${version}-win.zip`,
                'darwin': ``,
                'freebsd': ``,
            };
            let dlUrl = dlUrls[platform] || '';
            if (!dlUrl)
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
            // Write report files
            this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Install complete into ${aliasDir}`);
        });
    } });
exports.minerCommands = Object.assign(Object.assign({}, baseMiner.minerCommands), { apiPort: 52005, command: 't-rex', managed: true, getCommandFile(config, params) {
        return this.command + (os_1.default.platform() === 'win32' ? '.exe' : '');
    },
    getCommandArgs(config, params) {
        const args = [];
        if (this.apiPort > 0) {
            args.push(...[
                '--api-bind-http', `127.0.0.1:${this.apiPort.toString()}`,
            ]);
        }
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
            const uptime = minerSummary.uptime; // uptime until last crash/restart of the watchdoged subprocess
            //const uptime = minerSummary.watchdog_stat.uptime as number; // full uptime
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
