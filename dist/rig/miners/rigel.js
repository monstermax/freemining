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
Github   : https://github.com/rigelminer/rigel
Download : https://github.com/rigelminer/rigel/releases

*/
/* ########## CONFIG ######### */
const minerName = 'rigel';
const minerTitle = 'rigel';
const github = 'rigelminer/rigel';
const lastVersion = '1.3.5';
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
            let subDir = `${SEP}rigel-${version}-${platform}`;
            if (platform === 'linux')
                subDir = `${SEP}rigel-${version}-linux`;
            if (platform === 'win32')
                subDir = `${SEP}rigel-${version}-win`;
            // Download url selection
            const dlUrls = {
                'linux': `https://github.com/rigelminer/rigel/releases/download/${version}/rigel-${version}-linux.tar.gz`,
                'win32': `https://github.com/rigelminer/rigel/releases/download/${version}/rigel-${version}-win.zip`,
                'darwin': ``,
                'freebsd': ``,
            };
            let dlUrl = dlUrls[platform] || '';
            if (dlUrl === '')
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
exports.minerCommands = Object.assign(Object.assign({}, baseMiner.minerCommands), { apiPort: 52009, command: 'rigel', managed: true, getCommandArgs(config, params) {
        const args = [];
        if (this.apiPort > 0) {
            args.push(...[
                '--api-bind', `127.0.0.1:${this.apiPort}`,
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
            const minerSummaryRes = yield (0, node_fetch_1.default)(`${apiUrl}/`, { headers });
            const minerSummary = yield minerSummaryRes.json();
            // EDIT THESE VALUES - START //
            const uptime = minerSummary.uptime || -1;
            const algo = minerSummary.algorithm || '';
            const workerHashRate = Object.values(minerSummary.hashrate).shift() || 0;
            const algoPools = Object.values(minerSummary.pools).shift();
            const pool = algoPools[0];
            const poolUrl = `${pool.connection_details.hostname}:${pool.connection_details.port}`;
            const poolUser = pool.connection_details.username || '';
            const workerName = pool.connection_details.worker || poolUser.split('.').pop() || '';
            const cpus = [];
            const gpus = minerSummary.devices.map((gpu) => {
                return {
                    id: gpu.id,
                    name: gpu.name,
                    hashRate: Object.values(gpu.hashrate).shift() || 0,
                    temperature: gpu.monitoring_info.core_temperature,
                    fanSpeed: gpu.monitoring_info.fan_speed,
                    power: gpu.monitoring_info.power_usage,
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
