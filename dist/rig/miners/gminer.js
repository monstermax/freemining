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
Github   : https://github.com/develsoftware/GMinerRelease
Download : https://github.com/develsoftware/GMinerRelease/releases/

*/
/* ########## CONFIG ######### */
const minerName = 'gminer';
const minerTitle = 'GMiner';
const github = 'develsoftware/GMinerRelease';
const lastVersion = '3.27';
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
            const versionBis = version.replace(new RegExp('.', 'g'), '_');
            let subDir = ``;
            // Download url selection
            const dlUrls = {
                'linux': `https://github.com/develsoftware/GMinerRelease/releases/download/${version}/gminer_${versionBis}_linux64.tar.xz`,
                'win32': `https://github.com/develsoftware/GMinerRelease/releases/download/${version}/gminer_${versionBis}_windows64.zip`,
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
            fs_1.default.copyFileSync(`${tempDir}${SEP}unzipped${subDir}${SEP}`, aliasDir);
            // Write report files
            this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Install complete into ${aliasDir}`);
        });
    } });
exports.minerCommands = Object.assign(Object.assign({}, baseMiner.minerCommands), { apiPort: 52006, command: 'miner', managed: true, getCommandArgs(config, params) {
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
            args.push((Number(params.poolUrl.split(':')[1]) || 0).toString());
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
            const minerSummaryRes = yield (0, node_fetch_1.default)(`${apiUrl}/stat`, { headers });
            const minerSummary = yield minerSummaryRes.json();
            // EDIT THESE VALUES - START //
            const uptime = minerSummary.uptime;
            const algo = minerSummary.algorithm;
            let workerHashRate = 0;
            const poolUrl = minerSummary.server || '';
            const poolUser = minerSummary.user || '';
            const workerName = poolUser.split('.').pop() || '';
            const cpus = [];
            const gpus = minerSummary.devices.map((gpu) => {
                workerHashRate += gpu.speed;
                return {
                    id: gpu.gpu_id,
                    name: gpu.name,
                    temperature: gpu.temperature,
                    fanSpeed: gpu.fan,
                    hashRate: gpu.speed,
                    power: gpu.power_usage,
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