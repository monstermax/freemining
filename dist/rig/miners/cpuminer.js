"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minerCommands = exports.minerInstall = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
//import fetch from 'node-fetch';
//import net from 'net';
const exec_1 = require("../../common/exec");
const utils_1 = require("../../common/utils");
const baseMiner = tslib_1.__importStar(require("./_baseMiner"));
/* ########## DESCRIPTION ######### */
/*

Website  :
Github   : https://github.com/JayDDee/cpuminer-opt
Download :

*/
/* ########## CONFIG ######### */
const minerName = 'cpuminer';
const minerTitle = 'cpuminer';
const github = 'JayDDee/cpuminer';
const lastVersion = '3.21.0';
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
            let subDir = `${SEP}cpuminer-v${version}-*`;
            if (platform === 'linux') {
                return this.installFromSources(config, params);
            }
            // Download url selection
            const dlUrls = {
                'linux': ``,
                'win32': `https://github.com/JayDDee/cpuminer-opt/releases/download/v3.21.0/cpuminer-opt-${version}-windows.zip`,
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
            fs_1.default.renameSync(`${tempDir}${SEP}unzipped${subDir}${SEP}`, aliasDir);
            // Write report files
            this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Install complete into ${aliasDir}`);
        });
    },
    installFromSources(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const platform = (0, utils_1.getOpt)('--platform', config._args) || os_1.default.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
            const setAsDefaultAlias = params.default || false;
            let version = params.version || this.lastVersion;
            let subDir = ``; // edit-me
            // Some common install options
            const { minerAlias, tempDir, minerDir, aliasDir } = this.getInstallOptions(config, params, version);
            // Clone
            const dlUrl = `https://github.com/JayDDee/cpuminer-opt`;
            yield (0, exec_1.exec)('/usr/bin/git', ['clone', dlUrl], '', tempDir)
                .catch((err) => {
                console.warn(`${(0, utils_1.now)()} [WARNING] [RIG] PROCESS ERROR ${minerName}-${minerAlias} : ${err.message}`);
            });
            // Build
            yield (0, exec_1.exec)('./build.sh', [], '', `${tempDir}/cpuminer-opt`)
                .catch((err) => {
                console.warn(`${(0, utils_1.now)()} [WARNING] [RIG] PROCESS ERROR ${minerName}-${minerAlias} : ${err.message}`);
            });
            // Install to target dir
            fs_1.default.rmSync(aliasDir, { recursive: true, force: true });
            fs_1.default.mkdirSync(aliasDir, { recursive: true });
            fs_1.default.renameSync(`${tempDir}${SEP}cpuminer-opt${SEP}cpuminer`, `${aliasDir}${SEP}cpuminer`);
            // Write report files
            this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Install complete into ${aliasDir}`);
        });
    } });
exports.minerCommands = Object.assign(Object.assign({}, baseMiner.minerCommands), { apiPort: 52016, command: 'cpuminer', managed: true, getCommandArgs(config, params) {
        const args = [];
        if (this.apiPort > 0) {
            args.push(...[
                `--api-bind=127.0.0.1:${this.apiPort.toString()}`, // sgminer style API
            ]);
        }
        if (params.algo) {
            args.push('-a');
            args.push(params.algo);
        }
        if (params.poolUrl) {
            args.push('-o');
            args.push(`${params.poolUrl}`);
        }
        if (params.poolUser) {
            args.push('--user');
            args.push(params.poolUser);
            //args.push('-p');
            //args.push('x');
        }
        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }
        return args;
    },
    getInfos(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const apiHost = '127.0.0.1';
            const headers = {};
            const minerSummaryTxt = (yield (0, utils_1.sendSocketMessage)(`summary`, apiHost, this.apiPort)
                .catch((err) => {
                console.warn(`${(0, utils_1.now)()} [WARNING] [RIG] getInfos summary ERROR ${minerName} : ${err.message}`);
            })) || '{}';
            // NAME=cpuminer-opt;VER=3.21.0;API=1.0;ALGO=yescryptr16;CPUS=6;URL=connect.fennecblockchain.com:8200;HS=1135.89;KHS=1.14;ACC=0;REJ=0;SOL=0;ACCMN=0.000;DIFF=0.054484;TEMP=42.8;FAN=0;FREQ=4545973;UPTIME=3;TS=1675586025|
            let parts = minerSummaryTxt.split(';');
            const minerSummary = Object.fromEntries(parts.map((data) => {
                const [key, value] = data.split('=');
                return [key, value];
            }));
            const threadsTxt = (yield (0, utils_1.sendSocketMessage)(`threads`, apiHost, this.apiPort)
                .catch((err) => {
                console.warn(`${(0, utils_1.now)()} [WARNING] [RIG] getInfos threads ERROR ${minerName} : ${err.message}`);
            })) || '{}';
            // CPU=0;H/s=278.19|CPU=1;H/s=278.17|CPU=2;H/s=278.15|CPU=3;H/s=278.17|CPU=4;H/s=277.76|CPU=5;H/s=278.15|
            const devices = threadsTxt.split('|').map((deviceTxt) => {
                const parts = deviceTxt.split(';');
                return Object.fromEntries(parts.map((data) => {
                    const [key, value] = data.split('=');
                    return [key, value];
                }));
            });
            // EDIT THESE VALUES - START //
            const uptime = minerSummary.UPTIME;
            const algo = minerSummary.ALGO;
            const workerHashRate = minerSummary.HS;
            const poolUrl = minerSummary.URL;
            const poolUser = '';
            const workerName = poolUser.split('.').pop() || '';
            let cpuHashRate = 0;
            devices.forEach((cpu) => {
                const value = Number(cpu['H/s']);
                if (value) {
                    cpuHashRate += value;
                }
            });
            //const cpus: t.MinerCpuInfos[] = devices.map((cpu: any) => {
            //    return {
            //        id: cpu.CPU,
            //        name: '',
            //        hashRate: cpu['H/s'],
            //        threads: -1,
            //        //totalThreads: -1,
            //    };
            //});
            const cpus = [{
                    id: 0,
                    name: '',
                    hashRate: cpuHashRate,
                    threads: devices.length,
                }];
            const gpus = [];
            for (const [gpu, idx] of []) {
                gpus.push({
                    id: -1,
                    name: '',
                    hashRate: -1,
                    temperature: -1,
                    fanSpeed: -1,
                    power: -1,
                });
            }
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
