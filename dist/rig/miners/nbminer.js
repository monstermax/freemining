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
Github   : https://github.com/NebuTech/NBMiner
Download : https://github.com/NebuTech/NBMiner/releases/

*/
/* ########## CONFIG ######### */
const minerName = 'nbminer';
const minerTitle = 'NBMiner';
const github = 'NebuTech/NBMiner';
const lastVersion = '42.3';
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
            let subDir = `${SEP}NBMiner_*`;
            // Download url selection
            const dlUrls = {
                'linux': `https://github.com/NebuTech/NBMiner/releases/download/v${version}/NBMiner_${version}_Linux.tgz`,
                'win32': `https://github.com/NebuTech/NBMiner/releases/download/v${version}/NBMiner_${version}_Win.zip`,
                'darwin': ``,
                'freebsd': ``,
            };
            let dlUrl = dlUrls[platform] || '';
            if (!dlUrl)
                throw { message: `No installation script available for the platform ${platform}` };
            // Some common install options
            const { minerAlias, tempDir, minerDir, aliasDir } = this.getInstallOptions(config, params, version);
            if (platform === 'linux') {
                subDir = `${SEP}NBMiner_Linux`;
            }
            else if (platform === 'win32') {
                subDir = `${SEP}NBMiner_Win`;
            }
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
exports.minerCommands = Object.assign(Object.assign({}, baseMiner.minerCommands), { apiPort: 52001, command: 'nbminer', managed: true, getCommandArgs(config, params) {
        const logDir = `${config.logDir}${SEP}rig${SEP}miners`;
        const logFile = `${logDir}${SEP}${params.miner}.run.log`;
        const args = [
            '--no-color',
            '--no-watchdog',
            //'--log-file', logFile + '.debug.log',
        ];
        if (this.apiPort > 0) {
            args.push(...[
                '--api', `127.0.0.1:${this.apiPort.toString()}`,
            ]);
        }
        if (params.algo) {
            args.push('-a');
            args.push(params.algo);
        }
        if (params.poolUrl) {
            args.push('-o');
            args.push(`stratum+tcp://${params.poolUrl}`);
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const apiUrl = `http://127.0.0.1:${this.apiPort}`;
            const headers = {};
            const minerSummaryRes = yield (0, node_fetch_1.default)(`${apiUrl}/api/v1/status`, { headers });
            const minerSummary = yield minerSummaryRes.json();
            // EDIT THESE VALUES - START //
            const start_time = minerSummary.start_time;
            const uptime = (Date.now() / 1000) - start_time;
            const algo = minerSummary.stratum.algorithm;
            const workerHashRate = minerSummary.miner.total_hashrate_raw;
            const poolUrl = minerSummary.stratum.url;
            const poolUser = minerSummary.stratum.user;
            const workerName = poolUser.split('.').pop() || '';
            const cpus = [];
            const gpus = minerSummary.miner.devices.map((gpu) => {
                return {
                    id: gpu.id,
                    name: gpu.info,
                    temperature: gpu.temperature,
                    fanSpeed: gpu.fan,
                    hashRate: gpu.hashrate_raw,
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
