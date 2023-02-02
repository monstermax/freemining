"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minerCommands = exports.minerInstall = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
//import fetch from 'node-fetch';
//import net from 'net';
const utils_1 = require("../../common/utils");
const decompress_archive_1 = require("../../common/decompress_archive");
const baseMiner = tslib_1.__importStar(require("./_baseMiner"));
/* ########## DESCRIPTION ######### */
/*

Website  :
Github   : https://github.com/todxx/teamredminer
Download : https://github.com/todxx/teamredminer/releases/

*/
/* ########## CONFIG ######### */
const minerName = 'teamredminer';
const minerTitle = 'TeamRedMiner';
const github = 'todxx/teamredminer';
const lastVersion = '0.10.8';
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
            let subDir = `${SEP}teamredminer-v${version}-*`;
            // Download url selection
            const dlUrls = {
                'linux': `https://github.com/todxx/teamredminer/releases/download/v${version}/teamredminer-v${version}-linux.tgz`,
                'win32': `https://github.com/todxx/teamredminer/releases/download/v${version}/teamredminer-v${version}-win.zip`,
                'darwin': ``,
                'freebsd': ``,
            };
            let dlUrl = dlUrls[platform] || '';
            if (!dlUrl)
                throw { message: `No installation script available for the platform ${platform}` };
            // Some common install options
            const { minerAlias, tempDir, minerDir, aliasDir } = this.getInstallOptions(config, params, version);
            if (platform === 'linux') {
                subDir = `${SEP}teamredminer-v${version}-linux`;
            }
            else if (platform === 'win32') {
                subDir = `${SEP}teamredminer-v${version}-win`;
            }
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
            fs_1.default.mkdirSync(aliasDir, { recursive: true });
            fs_1.default.rmSync(aliasDir, { recursive: true, force: true });
            fs_1.default.renameSync(`${tempDir}${SEP}unzipped${subDir}${SEP}`, aliasDir);
            this.setDefault(minerDir, aliasDir, setAsDefaultAlias);
            // Write report files
            this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Install complete into ${aliasDir}`);
        });
    } });
exports.minerCommands = Object.assign(Object.assign({}, baseMiner.minerCommands), { apiPort: 52004, command: 'teamredminer', // the filename of the executable (without .exe extension)
    getCommandArgs(config, params) {
        const args = [];
        if (this.apiPort > 0) {
            args.push(...[
                `--api_listen=0.0.0.0:${this.apiPort.toString()}`, // sgminer style API
                //`cm_api_listen=0.0.0.0:${this.apiPort.toString()}`, // claymore style API
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
            //const apiUrl = `http://127.0.0.1:${this.apiPort}`;
            const apiHost = '127.0.0.1';
            const headers = {}; // edit-me if needed
            //const minerSummaryRes = await fetch(`${apiUrl}/`, {headers}); // EDIT API URL
            const minerSummaryRes = yield (0, utils_1.sendSocketMessage)(`{"command":"summary","parameter":""}`, apiHost, this.apiPort);
            const minerSummary = JSON.parse(minerSummaryRes).SUMMARY;
            const poolsRes = yield (0, utils_1.sendSocketMessage)(`{"command":"pools","parameter":""}`, apiHost, this.apiPort);
            const pools = JSON.parse(poolsRes).POOLS;
            const minerDevRes = yield (0, utils_1.sendSocketMessage)(`{"command":"devs","parameter":""}`, apiHost, this.apiPort);
            const minerDev = JSON.parse(minerDevRes).DEVS;
            const minerDevDetailsRes = yield (0, utils_1.sendSocketMessage)(`{"command":"devdetails","parameter":""}`, apiHost, this.apiPort);
            const minerDevDetails = JSON.parse(minerDevDetailsRes).DEVDETAILS;
            //const minerGpuRes = await sendSocketMessage(`{"command":"gpu","parameter":""}`, apiHost, this.apiPort) as any;
            //const minerGpu: any = JSON.parse(minerGpuRes).GPU;
            // EDIT THESE VALUES - START //
            const minerName = 'TeamRedMiner';
            const uptime = minerSummary[0].Elapsed;
            const algo = pools[0].Algorithm;
            const workerHashRate = (minerSummary[0]['KHS 30s'] || 0) / 1000;
            const poolUrl = pools[0].URL;
            const poolUser = pools[0].User;
            const workerName = poolUser.split('.').pop() || ''; // edit-me
            const cpus = [];
            const gpus = yield Promise.all(minerDev.map((gpu, idx) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                return {
                    id: gpu.GPU,
                    name: minerDevDetails[idx]['Model'],
                    hashRate: (gpu['KHS 30s'] || 0) / 1000,
                    temperature: gpu['Temperature'],
                    fanSpeed: gpu['Fan Percent'],
                    power: gpu['GPU Power'], // minerGpu[idx]['GPU Power']
                };
            })));
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
    } });
