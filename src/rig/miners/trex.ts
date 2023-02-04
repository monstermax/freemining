
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';

import { now, getOpt, downloadFile } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';
import * as baseMiner from './_baseMiner';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website  : https://trex-miner.com/
Github   : https://github.com/trexminer/T-Rex
Download : https://github.com/trexminer/T-Rex/releases/

*/
/* ########## CONFIG ######### */

const minerName = 'trex';
const minerTitle = 'T-Rex';
const github = 'trexminer/T-Rex';
const lastVersion = '0.26.8';

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
        let subDir = ``;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/trexminer/T-Rex/releases/download/${version}/t-rex-${version}-linux.tar.gz`,
            'win32':   `https://github.com/trexminer/T-Rex/releases/download/${version}/t-rex-${version}-win.zip`,
            'darwin':  ``,
            'freebsd': ``,
        }
        let dlUrl = dlUrls[platform] || '';

        if (! dlUrl) throw { message: `No installation script available for the platform ${platform}` };

        // Some common install options
        const { minerAlias, tempDir, minerDir, aliasDir } = this.getInstallOptions(config, params, version);


        // Downloading
        const dlFileName = path.basename(dlUrl);
        const dlFilePath = `${tempDir}${SEP}${dlFileName}`;
        console.log(`${now()} [INFO] [RIG] Downloading file ${dlUrl}`);
        await downloadFile(dlUrl, dlFilePath);
        console.log(`${now()} [INFO] [RIG] Download complete`);

        // Extracting
        fs.mkdirSync(`${tempDir}${SEP}unzipped`);
        console.log(`${now()} [INFO] [RIG] Extracting file ${dlFilePath}`);
        await decompressFile(dlFilePath, `${tempDir}${SEP}unzipped`);

        console.log(`${now()} [INFO] [RIG] Extract complete`);

        // Install to target dir
        fs.mkdirSync(aliasDir, {recursive: true});
        fs.rmSync(aliasDir, { recursive: true, force: true });
        fs.renameSync( `${tempDir}${SEP}unzipped${subDir}${SEP}`, aliasDir);
        this.setDefault(minerDir, aliasDir, setAsDefaultAlias);

        // Write report files
        this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`${now()} [INFO] [RIG] Install complete into ${aliasDir}`);
    }
};



export const minerCommands: t.minerCommandInfos = {
    ...baseMiner.minerCommands,

    apiPort: 52005,
    command: 't-rex',

    getCommandFile(config, params) {
        return this.command + (os.platform() === 'win32' ? '.exe' : '');
    },

    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    '--api-bind-http', `127.0.0.1:${this.apiPort.toString()}`,
                ]
            );
        }

        if (params.algo) {
            args.push('-a');
            args.push(params.algo);
        }

        if (params.poolUrl) {
            args.push('-o');
            args.push(params.poolUrl);
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


    async getInfos(config, params) {
        const apiUrl = `http://127.0.0.1:${this.apiPort}`;
        const headers: any = {};

        const minerSummaryRes = await fetch(`${apiUrl}/summary`, {headers});
        const minerSummary: any = await minerSummaryRes.json();


        const minerName = 'T-Rex';
        const algo = minerSummary.algorithm as string;
        const uptime = minerSummary.uptime as number; // uptime until last crash/restart of the watchdoged subprocess
        //const uptime = minerSummary.watchdog_stat.uptime as number; // full uptime

        const poolUrl = minerSummary.active_pool?.url as string || '';
        const poolUser = minerSummary.active_pool?.user as string || '';
        const workerName = poolUser.split('.').pop() as string || '';

        const cpus: t.MinerCpuInfos[] = [];

        let workerHashRate = 0;
        const gpus: t.MinerGpuInfos[] = minerSummary.gpus.map((gpu: any) => {
            workerHashRate += gpu.hashrate;
            return {
                id: gpu.gpu_id as number,
                name: gpu.name as string,
                hashRate: gpu.hashrate as number,
                temperature: gpu.temperature as number,
                fanSpeed: gpu.fan_speed as number,
                power: gpu.power as number,
            }
        });

        const hashRate = workerHashRate;


        let infos: t.MinerStats = {
            miner: {
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
    }
};


