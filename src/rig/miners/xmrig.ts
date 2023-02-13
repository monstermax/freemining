
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';

import { now, hasOpt, getOpt, downloadFile } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';
import * as baseMiner from './_baseMiner';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website  : https://xmrig.com/
Github   : https://github.com/xmrig/xmrig
Download : https://github.com/xmrig/xmrig/releases/

*/
/* ########## CONFIG ######### */

const minerName = 'xmrig';
const minerTitle = 'XMRig';
const github = 'xmrig/xmrig';
const lastVersion = '6.18.1';

/* ########## MAIN ######### */

const SEP = path.sep;

/* ########## FUNCTIONS ######### */


export const minerInstall: t.minerInstallInfos = {
    ...baseMiner.minerInstall,
    minerName,
    minerTitle,
    lastVersion,
    github,

    async install(config, params) {
        const platform = getOpt('--platform', config._args) || os.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
        const setAsDefaultAlias = params.default || false;

        let version = params.version || this.lastVersion;
        let subDir = `${SEP}xmrig-${version}`;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/${github}/releases/download/v${version}/xmrig-${version}-linux-x64.tar.gz`,
            'win32':   `https://github.com/${github}/releases/download/v${version}/xmrig-${version}-gcc-win64.zip`,
            'darwin':  `https://github.com/${github}/releases/download/v${version}/xmrig-${version}-macos-x64.tar.gz`,
            'freebsd': `https://github.com/${github}/releases/download/v${version}/xmrig-${version}-freebsd-static-x64.tar.gz`,
        };
        let dlUrl = dlUrls[platform] || '';

        if (platform === 'linux' && hasOpt('--variant', config._args)) {
            const variant = getOpt('--variant', config._args);
            if (variant == 'static') dlUrl = `https://github.com/${github}/releases/download/v${version}/xmrig-${version}-linux-static-x64.tar.gz`;
            if (variant == 'bionic') dlUrl = `https://github.com/${github}/releases/download/v${version}/xmrig-${version}-bionic-x64.tar.gz`;
            if (variant == 'focal')  dlUrl = `https://github.com/${github}/releases/download/v${version}/xmrig-${version}-focal-x64.tar.gz`;
        }

        if (! dlUrl) throw { message: `No installation script available for the platform ${platform}` };

        // Some common install options
        const { minerAlias, tempDir, minerDir, aliasDir } = this.getInstallOptions(config, params, version);


        // Downloading
        const dlFileName = path.basename(dlUrl);
        const dlFilePath = `${tempDir}${SEP}${dlFileName}`;
        await this.downloadFile(dlUrl, dlFilePath);

        // Extracting
        await this.extractFile(tempDir, dlFilePath);

        // Install to target dir
        fs.mkdirSync(aliasDir, {recursive: true});
        fs.rmSync(aliasDir, { recursive: true, force: true });
        fs.cpSync( `${tempDir}${SEP}unzipped${subDir}${SEP}`, `${aliasDir}${SEP}`, { recursive: true } );

        // Write report files
        this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`${now()} [INFO] [RIG] Install complete into ${aliasDir}`);
    },

};



export const minerCommands: t.minerCommandInfos = {
    ...baseMiner.minerCommands,

    apiPort: 52003,
    command: 'xmrig',
    managed: true,

    getCommandArgs(config, params) {
        const args: string[] = [
            '-k',
            //'--cpu-max-threads-hint', '75',
            //'--cpu-priority', '3',
            '--randomx-no-rdmsr',
            '--no-color',
            //`--log-file=${SEP}tmp${SEP}debug_xmrig.log`,
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    '--http-enabled',
                    '--http-host', '127.0.0.1',
                    '--http-port', this.apiPort.toString(),
                    '--http-access-token=freemining-token',
                    '--http-no-restricted',
                ]
            );
        }

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

        const cpus: t.MinerCpuInfos[] = [];
        const gpus: t.MinerGpuInfos[] = [];

        let backend: any;
        for (backend of minerBackends) {
            if (!backend.enabled) continue;

            if (backend.type === 'cpu') {
                const cpu = {
                    id: 0,
                    name: minerSummary.cpu.brand,
                    hashRate: (backend.hashrate || [])[0] || 0,
                    threads: backend.threads.length,
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

        const uptime = minerSummary.uptime as number;
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

        let infos: t.MinerStats = {
            miner: {
                name: minerTitle,
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
    }
};


