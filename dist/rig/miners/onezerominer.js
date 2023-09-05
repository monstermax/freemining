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
Github   :
Download :

*/
/* ########## CONFIG ######### */
const minerName = 'onezerominer';
const minerTitle = 'onezerominer';
const github = 'OneZeroMiner/onezerominer';
const lastVersion = '1.2.3';
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
            //const versionBis = version.replace( new RegExp('\\.', 'g'), '-');
            let subDir = `${SEP}onezerominer-${platform}`;
            // Download url selection
            const dlUrls = {
                'linux': `https://github.com/OneZeroMiner/onezerominer/releases/download/v${version}/onezerominer-linux-${version}.tar.gz`,
                'win32': `https://github.com/OneZeroMiner/onezerominer/releases/download/v${version}/onezerominer-win64-${version}.zip`,
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
exports.minerCommands = Object.assign(Object.assign({}, baseMiner.minerCommands), { apiPort: 52019, command: 'onezerominer', managed: true, getCommandArgs(config, params) {
        const args = [
        //'--disable-cpu',
        ];
        if (this.apiPort > 0) {
            args.push(...[
                //'--api-enable',
                '--api-port', this.apiPort.toString(),
            ]);
        }
        if (params.algo) {
            args.push('--algo');
            args.push(params.algo);
        }
        if (params.poolUrl) {
            args.push('--pool');
            args.push(params.poolUrl);
        }
        if (params.poolUser) {
            args.push('--wallet');
            args.push(params.poolUser);
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
            const headers = {};
            const minerSummaryRes = yield (0, node_fetch_1.default)(`${apiUrl}/`, { headers });
            const minerSummary = yield minerSummaryRes.json();
            // EDIT THESE VALUES - START //
            const _algo = minerSummary.algos[0] || {};
            const uptime = minerSummary.uptime_seconds || -1;
            const algo = (_algo === null || _algo === void 0 ? void 0 : _algo.name) || '';
            const workerHashRate = (_algo === null || _algo === void 0 ? void 0 : _algo.total_hashrate) || -1;
            const poolUrl = (_algo === null || _algo === void 0 ? void 0 : _algo.pool.pool) || '';
            const poolUser = '';
            const workerName = poolUser.split('.').pop() || ''; // edit-me
            const cpus = [];
            const gpus = minerSummary.devices.map((gpu) => {
                return {
                    id: gpu.id,
                    name: `${gpu.vendor} ${gpu.name}`,
                    hashRate: _algo.hashrates[gpu.id],
                    temperature: gpu.temp,
                    fanSpeed: gpu.fan,
                    power: gpu.power,
                };
            });
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
