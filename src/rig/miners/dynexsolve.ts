
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

Website  : 
Github   : https://github.com/dynexcoin/Dynex
Download : https://github.com/dynexcoin/Dynex/releases/tag/DynexSolve

*/
/* ########## CONFIG ######### */

const minerName   = 'dynexsolve';
const minerTitle  = 'Dynex Solve';
const github      = 'dynexcoin/Dynex';
const lastVersion = '2.2.3';
const versionLinux = '3a9c8aa';

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
        let subDir = `${SEP}DynexSolve-main-${versionLinux}`;

        if (platform === 'win32') subDir = `${SEP}dynexsolve_windows${version}`;
        if (platform === 'linux') subDir = `${SEP}DynexSolve-main-${versionLinux}`;

        let installFileName = 'dynexsolve';

        if (platform === 'win32') {
            installFileName = 'dynexsolve.exe';
        }

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/dynexcoin/Dynex/releases/download/DynexSolve/DynexSolve-main-${versionLinux}-ubuntu-20.04-linux-x64-core2.zip`,
            'win32':   `https://github.com/dynexcoin/Dynex/releases/download/DynexSolve/dynexsolve_windows${version}.7z`,
            'darwin':  ``,
            'freebsd': ``,
        }
        let dlUrl = dlUrls[platform] || '';

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
        fs.chmodSync(`${aliasDir}/${installFileName}`, 0o755);

        // Write report files
        this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`${now()} [INFO] [RIG] Install complete into ${aliasDir}`);
    }
};



export const minerCommands: t.minerCommandInfos = {
    ...baseMiner.minerCommands,

    apiPort: -1, // 52017 // no api ?
    command: 'dynexsolve',
    managed: false, // set true when the getInfos() script is ready


    getCommandArgs(config, params) {
        const args: string[] = [
            `-no-cpu`,
            `-multi-gpu`,
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
            //args.push('--edit-me-algo');
            //args.push(params.algo);
        }

        if (params.poolUrl) {
            const parts = params.poolUrl.split(':');
            args.push('-stratum-url');
            args.push(parts[0]);
            args.push('-stratum-port');
            args.push(parts[1]);
        }

        if (params.poolUser) {
            const parts = params.poolUser.split('.');
            args.push('-mining-address');
            args.push(parts[0]);
            args.push('-stratum-password');
            args.push(parts[1]);
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


