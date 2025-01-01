
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';

import { now, getOpt } from '../../common/utils';
import * as baseMiner from './_baseMiner';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website  : https://qu.ai/
Github   : https://github.com/dominant-strategies/quai-gpu-miner
Download : https://github.com/dominant-strategies/quai-gpu-miner/releases/
Video    : https://www.youtube.com/watch?v=Uq0zq6EgYM8
Minerstat: 
Command  : ./quai-gpu-miner -U --HWMON 1 -P stratum://anonymous.0x690BF6Cfce1Affb8C0E72Fe863Bd0A2ab06374Cc.worker@pool-poussin.fr:3334 --api-bind 127.0.0.1:3334 --cuda --cu-devices 0

*/
/* ########## CONFIG ######### */

const minerName = 'quai_gpu_miner';
const minerTitle = 'quai-gpu-miner';
const github = 'dominant-strategies/quai-gpu-miner';
const lastVersion = 'v0.4.1';

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
        let subDir = `${SEP}quai-gpu-miner-amd`;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/dominant-strategies/quai-gpu-miner/releases/download/${version}/quai-gpu-miner-nvidia-${version}.tar.gz`,
            'win32':   ``,
            'darwin':  ``,
            'freebsd': ``,
        }
        let dlUrl = dlUrls[platform] || '';

        //throw { message: `edit-me then delete this line` };

        if (dlUrl === '') throw { message: `No installation script available for the platform ${platform}` };

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
    }
};



export const minerCommands: t.minerCommandInfos = {
    ...baseMiner.minerCommands,

    apiPort: 52021,
    command: 'quai-gpu-miner', // the filename of the executable (without .exe extension)
    managed: true, // set true when the getInfos() script is ready


    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    '--api-bind', `127.0.0.1:${this.apiPort}`,
                ]
            );
        }

        if (params.poolUrl &&params.poolUser) {
            args.push('--pool');
            args.push( `stratum+tcp://${params.poolUser}.{worker}:x@${params.poolUrl}` );
        }

        if (true) {
            args.push('--cuda');
        }

        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }

        return args;
    },


    async getInfos(config, params) {
        const apiUrl = `http://127.0.0.1:${this.apiPort}`;
        const headers: any = {}; // edit-me if needed

        const minerSummaryRes = await fetch(`${apiUrl}/`, {headers}); // EDIT API URL
        const minerSummary: any = await minerSummaryRes.json();

        // EDIT THESE VALUES - START //
        const uptime = -1; // edit-me
        const algo = 'edit-me';
        const workerHashRate = -1; // edit-me

        const poolUrl = ''; // edit-me
        const poolUser = ''; // edit-me
        const workerName = poolUser.split('.').pop() as string || ''; // edit-me

        const cpus: t.MinerCpuInfos[] = []; // edit-me

        const gpus: t.MinerGpuInfos[] = []; // edit-me
        // EDIT THESE VALUES - END //

        let infos: t.MinerStats = {
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
    }
};


