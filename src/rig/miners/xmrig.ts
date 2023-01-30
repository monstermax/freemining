
import fs from 'fs';
import path from 'path';
import os from 'os';
import tar from 'tar';
import fetch from 'node-fetch';
import admZip from 'adm-zip';

import { now, getOpt, downloadFile } from '../../common/utils';

import type *  as t from '../../common/types';



/* ########## MAIN ######### */

const SEP = path.sep;


/* ########## FUNCTIONS ######### */

export const minerInstall: t.minerInstallInfos = {
    version: '6.18.1',

    async install(config, params) {
        const targetAlias: string = params.alias || params.miner;
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `frm-tmp.miner-install-${params.miner}-${targetAlias}-`), {});
        const targetDir = `${config?.appDir}${SEP}rig${SEP}miners${SEP}${targetAlias}`

        const platform = getOpt('--platform', config._args) || os.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
        let dlUrl: string;
        if (platform === 'linux') {
            dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-linux-x64.tar.gz`;

            const variant = getOpt('--variant', config._args);
            if (variant == 'static') dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-linux-static-x64.tar.gz`;
            if (variant == 'bionic') dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-bionic-x64.tar.gz`;
            if (variant == 'focal')  dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-focal-x64.tar.gz`;

        } else if (platform === 'win32') {
            dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-gcc-win64.zip`;

        } else if (platform === 'darwin') {
            dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-macos-x64.tar.gz`;

        } else if (platform === 'freebsd') {
            dlUrl = `https://github.com/xmrig/xmrig/releases/download/v${this.version}/xmrig-${this.version}-freebsd-static-x64.tar.gz`;

        } else {
            throw { message: `No installation script available for the platform ${platform}` };
        }

        // Downloading
        const dlFileName = path.basename(dlUrl);
        const dlFilePath = `${tempDir}${SEP}${dlFileName}`;
        console.debug(`${now()} [DEBUG] [RIG] Downloading file ${dlUrl}`);
        await downloadFile(dlUrl, dlFilePath);
        console.debug(`${now()} [DEBUG] [RIG] Download complete`);

        // Extracting
        fs.mkdirSync(`${tempDir}${SEP}unzipped`);
        console.debug(`${now()} [DEBUG] [RIG] Extracting file ${dlFilePath}`);
        if (path.extname(dlFilePath) === '.gz') {
            await tar.extract(
                {
                    file: dlFilePath,
                    cwd: `${tempDir}${SEP}unzipped`,
                }
            ).catch((err: any) => {
                throw { message: err.message };
            });

        } else {
            const zipFile = new admZip(dlFilePath);
            await new Promise((resolve, reject) => {
                zipFile.extractAllToAsync(`${tempDir}${SEP}unzipped`, true, true, (err: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(null);
                });
            }).catch((err:any) => {
                throw { message: err.message };
            });
        }
        console.debug(`${now()} [DEBUG] [RIG] Extract complete`);

        // Install to target dir
        fs.mkdirSync(targetDir, {recursive: true});
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.renameSync( `${tempDir}${SEP}unzipped${SEP}xmrig-${this.version}${SEP}`, targetDir);
        console.log(`${now()} [INFO] [RIG] Install complete into ${targetDir}`);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};



export const minerCommands: t.minerCommandInfos = {
    apiPort: 52003,

    command: 'xmrig',

    getCommandFile(config, params) {
        return this.command + (os.platform() === 'linux' ? '' : '.exe');
    },

    getCommandArgs(config, params) {
        const args: string[] = [
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


    async getInfos(config, params) {
        const apiUrl = `http://127.0.0.1:${this.apiPort}`;

        const headers: any = {
            Authorization: `Bearer freemining-token`,
        };

        const minerSummaryRes = await fetch(`${apiUrl}/2/summary`, {headers});
        const minerSummary: any = await minerSummaryRes.json();

        const minerConfigRes = await fetch(`${apiUrl}/2/config`, {headers}); // note: this url requires bearer token
        const minerConfig: any = await minerConfigRes.json();

        const minerBackendsRes = await fetch(`${apiUrl}/2/backends`, {headers});
        const minerBackends: any = await minerBackendsRes.json();

        const cpus: any[] = [];
        const gpus: any[] = [];

        let backend: any;
        for (backend of minerBackends) {
            if (!backend.enabled) continue;

            if (backend.type === 'cpu') {
                const cpu = {
                    id: 0,
                    name: minerSummary.cpu.brand as string,
                    hashRate: (backend.hashrate || [])[0] as number || 0,
                    threads: backend.threads.length as number,
                    //totalThreads: minerSummary.cpu.cores * 2 as number,
                };
                cpus.push(cpu);

            } else if (backend.type === 'opencl' || backend.type === 'cuda') {
                for (let i=0; i<backend.threads.length; i++) {
                    const thread: any = backend.threads[i];
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

        const algo = minerSummary.algo as string;
        //const algo = minerConfig.pools[0].algo as string;
        //const algo = minerSummary.connection.algo as string;

        //const poolUrl = (minerConfig.pools || [])[0].url as string;
        //const poolUrl = (minerSummary.pools || [])[0]?.url as string || '';
        const poolUrl = minerSummary.connection.pool as string;

        const poolUser = (minerConfig.pools || [])[0].user as string;
        //const poolUser = (minerSummary.pools || [])[0]?.user as string || '';

        //const poolAlgo = (minerSummary.pools || [])[0]?.algo as string || '';

        //const worker = poolUser.split('.').pop() as string || '';
        const worker = minerSummary.worker_id as string;
        const hashRate = (minerSummary.hashrate.total || [])[0] || 0 as number;

        let infos: t.MinerInfos = {
            infos: {
                name: 'XMRig',
                worker,
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
    }
};


