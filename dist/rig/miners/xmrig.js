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
/* ########## DESCRIPTION ######### */
/*

Website: https://xmrig.com/
Github : https://github.com/xmrig/xmrig

*/
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
/* ########## FUNCTIONS ######### */
exports.minerInstall = {
    version: '6.18.1',
    install(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const targetAlias = params.alias || params.miner;
            const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), `frm-tmp.miner-install-${params.miner}-${targetAlias}-`), {});
            const targetDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}rig${SEP}miners${SEP}${targetAlias}`;
            const platform = (0, utils_1.getOpt)('--platform', config._args) || os_1.default.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
            let dlUrl;
            if (platform === 'linux') {
                dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-linux-x64.tar.gz`;
                const variant = (0, utils_1.getOpt)('--variant', config._args);
                if (variant == 'static')
                    dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-linux-static-x64.tar.gz`;
                if (variant == 'bionic')
                    dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-bionic-x64.tar.gz`;
                if (variant == 'focal')
                    dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-focal-x64.tar.gz`;
            }
            else if (platform === 'win32') {
                dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-gcc-win64.zip`;
            }
            else if (platform === 'darwin') {
                dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-macos-x64.tar.gz`;
            }
            else if (platform === 'freebsd') {
                dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-freebsd-static-x64.tar.gz`;
            }
            else {
                throw { message: `No installation script available for the platform ${platform}` };
            }
            // Downloading
            const dlFileName = path_1.default.basename(dlUrl);
            const dlFilePath = `${tempDir}${SEP}${dlFileName}`;
            console.debug(`${(0, utils_1.now)()} [DEBUG] [RIG] Downloading file ${dlUrl}`);
            yield (0, utils_1.downloadFile)(dlUrl, dlFilePath);
            console.debug(`${(0, utils_1.now)()} [DEBUG] [RIG] Download complete`);
            // Extracting
            fs_1.default.mkdirSync(`${tempDir}${SEP}unzipped`);
            console.debug(`${(0, utils_1.now)()} [DEBUG] [RIG] Extracting file ${dlFilePath}`);
            if (path_1.default.extname(dlFilePath) === '.gz') {
                yield tar_1.default.extract({
                    file: dlFilePath,
                    cwd: `${tempDir}${SEP}unzipped`,
                }).catch((err) => {
                    throw { message: err.message };
                });
            }
            else {
                const zipFile = new adm_zip_1.default(dlFilePath);
                yield new Promise((resolve, reject) => {
                    zipFile.extractAllToAsync(`${tempDir}${SEP}unzipped`, true, true, (err) => {
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
            console.debug(`${(0, utils_1.now)()} [DEBUG] [RIG] Extract complete`);
            // Install to target dir
            fs_1.default.mkdirSync(targetDir, { recursive: true });
            fs_1.default.rmSync(targetDir, { recursive: true, force: true });
            fs_1.default.renameSync(`${tempDir}${SEP}unzipped${SEP}xmrig-${this.version}${SEP}`, targetDir);
            console.log(`${(0, utils_1.now)()} [INFO] [RIG] Install complete into ${targetDir}`);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        });
    }
};
exports.minerCommands = {
    apiPort: 52003,
    command: 'xmrig',
    getCommandFile(config, params) {
        return this.command + (os_1.default.platform() === 'linux' ? '' : '.exe');
    },
    getCommandArgs(config, params) {
        const args = [
            '--http-enabled',
            '--http-host', '127.0.0.1',
            '--http-port', this.apiPort.toString(),
            '--http-access-token=freemining-token',
            '--http-no-restricted',
            '-k',
            '--cpu-max-threads-hint', '75',
            '--cpu-priority', '3',
            '--randomx-no-rdmsr',
            '--no-color',
            '--log-file=${SEP}tmp${SEP}debug_xmrig.log',
        ];
        if (params.algo) {
            args.push('--algo');
            args.push(params.algo);
        }
        if (params.poolUrl) {
            args.push('--url');
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
        // enable cuda ?
        if (false) {
            args.push('--cuda');
            //args.push('--cuda-devices');
            //args.push('1');
        }
        // enable opencl ?
        if (false) {
            args.push('--opencl');
            //args.push('--opencl-devices');
            //args.push('1');
        }
        //if (config?._args.includes('--no-donate')) {
        // works only with modified sources of xmrig where minimum fees is set to 0
        args.push('--donate-level');
        args.push('0');
        //}
        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }
        return args;
    },
    getInfos(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const apiUrl = `http://127.0.0.1:${this.apiPort}`;
            const headers = {
                Authorization: `Bearer freemining-token`,
            };
            const minerSummaryRes = yield (0, node_fetch_1.default)(`${apiUrl}/2/summary`, { headers });
            const minerSummary = yield minerSummaryRes.json();
            const minerConfigRes = yield (0, node_fetch_1.default)(`${apiUrl}/2/config`, { headers }); // note: this url requires bearer token
            const minerConfig = yield minerConfigRes.json();
            const minerBackendsRes = yield (0, node_fetch_1.default)(`${apiUrl}/2/backends`, { headers });
            const minerBackends = yield minerBackendsRes.json();
            const cpus = [];
            const gpus = [];
            let backend;
            for (backend of minerBackends) {
                if (!backend.enabled)
                    continue;
                if (backend.type === 'cpu') {
                    const cpu = {
                        id: 0,
                        name: minerSummary.cpu.brand,
                        hashRate: (backend.hashrate || [])[0] || 0,
                        threads: backend.threads.length,
                        //totalThreads: minerSummary.cpu.cores * 2 as number,
                    };
                    cpus.push(cpu);
                }
                else if (backend.type === 'opencl' || backend.type === 'cuda') {
                    for (let i = 0; i < backend.threads.length; i++) {
                        const thread = backend.threads[i];
                        const gpu = {
                            id: thread.index,
                            name: thread.name,
                            hashRate: (thread.hashrate || [])[0] || 0,
                            temperature: thread.health.temperature,
                            fanSpeed: thread.health.fan_speed[0],
                            power: thread.health.power, // 0
                            //threadsCount: thread.threads, // 32 for NVIDIA GeForce GTX 1050 Ti
                        };
                        gpus.push(gpu);
                    }
                }
            }
            const uptime = minerSummary.uptime;
            const algo = minerSummary.algo;
            //const algo = minerConfig.pools[0].algo as string;
            //const algo = minerSummary.connection.algo as string;
            //const poolUrl = (minerConfig.pools || [])[0].url as string;
            //const poolUrl = (minerSummary.pools || [])[0]?.url as string || '';
            const poolUrl = minerSummary.connection.pool;
            const poolUser = (minerConfig.pools || [])[0].user;
            //const poolUser = (minerSummary.pools || [])[0]?.user as string || '';
            //const poolAlgo = (minerSummary.pools || [])[0]?.algo as string || '';
            //const worker = poolUser.split('.').pop() as string || '';
            const worker = minerSummary.worker_id;
            const hashRate = (minerSummary.hashrate.total || [])[0] || 0;
            let infos = {
                infos: {
                    name: 'XMRig',
                    worker,
                    uptime,
                    algo,
                    hashRate,
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
