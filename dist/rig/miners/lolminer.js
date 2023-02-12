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
Github   : https://github.com/Lolliedieb/lolMiner-releases
Download : https://github.com/Lolliedieb/lolMiner-releases/releases/

*/
/* ########## CONFIG ######### */
const minerName = 'lolminer';
const minerTitle = 'lolMiner';
const github = 'Lolliedieb/lolMiner-releases';
const lastVersion = '1.66';
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
            let subDir = `${SEP}${version}`;
            // Download url selection
            const dlUrls = {
                'linux': `https://github.com/Lolliedieb/lolMiner-releases/releases/download/${version}/lolMiner_v${version}_Lin64.tar.gz`,
                'win32': `https://github.com/Lolliedieb/lolMiner-releases/releases/download/${version}/lolMiner_v${version}_Win64.zip`,
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
            fs_1.default.copyFileSync(`${tempDir}${SEP}unzipped${subDir}${SEP}`, `${aliasDir}${SEP}`);
            // Write report files
            this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Install complete into ${aliasDir}`);
        });
    } });
exports.minerCommands = Object.assign(Object.assign({}, baseMiner.minerCommands), { apiPort: 52002, command: 'lolMiner', managed: true, getCommandArgs(config, params) {
        const args = [];
        if (this.apiPort > 0) {
            args.push(...[
                '--apihost', '127.0.0.1',
                '--apiport', this.apiPort.toString(),
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
            const headers = {};
            const minerSummaryRes = yield (0, node_fetch_1.default)(`${apiUrl}/`, { headers });
            const minerSummary = yield minerSummaryRes.json();
            // EDIT THESE VALUES - START //
            const _algo = minerSummary.Algorithms[0];
            const multipliers = {
                "Mh/s": 1000 * 1000,
                "Hh/s": 1000,
            };
            const uptime = minerSummary.Session.Uptime;
            const algo = _algo.Algorithm;
            const workerHashRate = _algo.Total_Performance * (multipliers[_algo.Performance_Unit] || 1);
            const poolUrl = _algo.Pool;
            const poolUser = _algo.User;
            const workerName = poolUser.split('.').pop() || '';
            const cpus = [];
            const gpus = minerSummary.Workers.map((worker) => {
                return {
                    id: worker.Index,
                    name: worker.Name,
                    temperature: worker.Core_Temp,
                    fanSpeed: worker.Fan_Speed,
                    hashRate: _algo.Worker_Performance[worker.Index] * (multipliers[_algo.Performance_Unit] || 1),
                    power: minerSummary.Workers[worker.Index].Power,
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
