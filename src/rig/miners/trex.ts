
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';

import { now, getOpt, downloadFile } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website  : https://trex-miner.com/
Github   : https://github.com/trexminer/T-Rex
Download : https://github.com/trexminer/T-Rex/releases/

*/
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
            dlUrl = `https://github.com/trexminer/T-Rex/releases/download/0.26.8/t-rex-0.26.8-linux.tar.gz`;

        } else if (platform === 'win32') {
            dlUrl = `https://github.com/trexminer/T-Rex/releases/download/0.26.8/t-rex-0.26.8-win.zip`;

        } else if (platform === 'darwin') {
            throw { message: `No installation script available for the platform ${platform}` };

        } else {
            throw { message: `No installation script available for the platform ${platform}` };
        }

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
        fs.mkdirSync(targetDir, {recursive: true});
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.renameSync( `${tempDir}${SEP}unzipped${SEP}`, targetDir);
        console.log(`${now()} [INFO] [RIG] Install complete into ${targetDir}`);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};



export const minerCommands: t.minerCommandInfos = {
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

        const cpus: any[] = [];

        let workerHashRate = 0;
        const gpus = minerSummary.gpus.map((gpu: any) => {
            workerHashRate += gpu.hashrate;
            return {
                id: gpu.gpu_id,
                name: gpu.name,
                hashRate: gpu.hashrate,
                temperature: gpu.temperature,
                fanSpeed: gpu.fan_speed,
                power: gpu.power,
            }
        });

        const hashRate = workerHashRate;


        let infos: t.MinerInfos = {
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
    }
};


