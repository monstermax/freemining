
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';

import { now, getOpt, downloadFile } from '../../common/utils';
//import { decompressFile } from '../../common/decompress_archive';
import * as baseMiner from './_baseMiner';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website  : 
Github   : https://github.com/fancyIX/ccminer
Download : https://github.com/fancyIX/ccminer/releases/

*/
/* ########## CONFIG ######### */

const minerName = 'ccminer';
const minerTitle = 'CCminer';
const github = 'fancyIX/ccminer';
//const lastVersion = '';
const lastVersionLinux = '0.5.0';
const lastVersionWindows = '0.5.1';
const lastVersion = (lastVersionWindows > lastVersionLinux) ? lastVersionWindows : lastVersionLinux;

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
        let installFileName = 'ccminer';

        if (platform === 'linux') {
            version = params.version || lastVersionLinux || lastVersion;

        } else if (platform === 'win32') {
            version = params.version || lastVersionWindows || lastVersion;
            installFileName = 'ccminer.exe';
        }

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/fancyIX/ccminer/releases/download/${version}/ccminer-linux-amd64`,
            'win32':   `https://github.com/fancyIX/ccminer/releases/download/${version}/ccminer-win64.exe`,
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

        // Install to target dir
        fs.rmSync(aliasDir, { recursive: true, force: true });
        fs.mkdirSync(aliasDir, {recursive: true});
        fs.renameSync( `${tempDir}${SEP}${dlFileName}`, `${aliasDir}/${installFileName}`);
        fs.chmodSync(`${aliasDir}/${installFileName}`, 0o755);
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

    apiPort: -1, // edit-me
    command: 'ccminer', // the filename of the executable (without .exe extension)

    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    `--api-bind=${this.apiPort.toString()}`,
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

            //args.push('-p');
            //args.push('x');
        }

        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }

        return args;
    },


    async EDIT_ME_getInfos(config, params) {
        const apiUrl = `http://127.0.0.1:${this.apiPort}`;
        const headers: any = {}; // edit-me if needed

        const minerSummaryRes = await fetch(`${apiUrl}/`, {headers}); // EDIT API URL
        const minerSummary: any = await minerSummaryRes.json();

        // EDIT THESE VALUES - START //
        const minerName = 'edit-me';
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


