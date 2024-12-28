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
Github   : https://github.com/doktor83/SRBMiner-Multi
Download : https://github.com/doktor83/SRBMiner-Multi/releases/

*/
/* ########## CONFIG ######### */
const minerName = 'srbminer';
const minerTitle = 'SRBMiner Multi';
const github = 'doktor83/SRBMiner-Multi';
//const lastVersion = '2.2.3';
const lastVersion = '2.3.5';
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
            const versionBis = version.replace(new RegExp('\\.', 'g'), '-');
            let subDir = `${SEP}SRBMiner-Multi-${versionBis}`;
            // Download url selection
            const dlUrls = {
                'linux': `https://github.com/doktor83/SRBMiner-Multi/releases/download/${version}/SRBMiner-Multi-${versionBis}-Linux.tar.gz`,
                'win32': `https://github.com/doktor83/SRBMiner-Multi/releases/download/${version}/SRBMiner-Multi-${versionBis}-win64.zip`,
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
exports.minerCommands = Object.assign(Object.assign({}, baseMiner.minerCommands), { apiPort: 52011, command: 'SRBMiner-MULTI', managed: true, getCommandArgs(config, params) {
        const args = [
            '--disable-cpu',
        ];
        if (this.apiPort > 0) {
            args.push(...[
                '--api-enable',
                '--api-port', this.apiPort.toString(),
            ]);
        }
        if (params.algo) {
            args.push('--algorithm');
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
            const _algo = minerSummary.algorithms[0] || {};
            const uptime = (_algo === null || _algo === void 0 ? void 0 : _algo.mining_time) || -1;
            const algo = (_algo === null || _algo === void 0 ? void 0 : _algo.name) || '';
            const workerHashRate = (_algo === null || _algo === void 0 ? void 0 : _algo.hashrate.gpu.total) || -1;
            const poolUrl = (_algo === null || _algo === void 0 ? void 0 : _algo.pool.pool) || '';
            const poolUser = '';
            const workerName = poolUser.split('.').pop() || ''; // edit-me
            const cpus = [];
            const gpus = minerSummary.gpu_devices.map((gpu) => {
                return {
                    id: gpu.id,
                    name: gpu.model,
                    hashRate: _algo.hashrate.gpu[`gpu${gpu.id}`],
                    temperature: gpu.temperature,
                    fanSpeed: -1,
                    power: gpu.asic_power,
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
