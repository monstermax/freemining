
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
Command  : ./quai-gpu-miner -G --HWMON 1 -P stratum://anonymous.0x690BF6Cfce1Affb8C0E72Fe863Bd0A2ab06374Cc.worker@pool-poussin.fr:3334 --api-bind 127.0.0.1:3334 --opencl

*/
/* ########## CONFIG ######### */

const minerName = 'quai_gpu_miner_amd';
const minerTitle = 'quai-gpu-miner-amd';
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
            'linux':   `https://github.com/dominant-strategies/quai-gpu-miner/releases/download/${version}/quai-gpu-miner-amd-${version}.tar.gz`,
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

    apiPort: -1, // edit-me
    command: '', // edit-me // the filename of the executable (without .exe extension)
    managed: false, // set true when the getInfos() script is ready


    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    '--edit-me-api-host', '127.0.0.1',
                    '--edit-me-api-port', this.apiPort.toString(),
                ]
            );
        }

        if (params.algo) {
            args.push('--edit-me-algo');
            args.push(params.algo);
        }

        if (params.poolUrl) {
            args.push('--edit-me-url');
            args.push(params.poolUrl);
        }

        if (params.poolUser) {
            args.push('--edit-me-user');
            args.push(params.poolUser);
        }

        if (true) {
            args.push('--edit-me-password');
            args.push('x');
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


