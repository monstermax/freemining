
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

Website  : https://www.bminer.me/
Github   : 
Download : https://www.bminer.me/releases/

*/
/* ########## CONFIG ######### */

const minerName = 'bminer';
const minerTitle = 'Bminer';
const github = '';
const lastVersion = '16.4.11-2849b5c';

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
        let subDir = `${SEP}bminer-v${version}`;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://www.bminercontent.com/releases/bminer-v${version}-amd64.tar.xz`,
            'win32':   `https://www.bminercontent.com/releases/bminer-v${version}-amd64.zip`,
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

    apiPort: 52009,
    command: 'bminer', // the filename of the executable (without .exe extension)

    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    '-api', `127.0.0.1:${this.apiPort.toString()}`,
                ]
            );
        }

        if (params.algo) {
            args.push('-pers');
            args.push(params.algo);
        }

        if (params.poolUrl && params.poolUser) {
            args.push('-uri');
            args.push( `stratum://${params.poolUser}@${params.poolUrl}` );
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
        const minerName = 'edit-me';
        const uptime = -1; // edit-me
        const algo = 'edit-me';
        const workerHashRate = -1; // edit-me

        const poolUrl = ''; // edit-me
        const poolUser = ''; // edit-me
        const workerName = poolUser.split('.').pop() as string || ''; // edit-me

        const cpus: any[] = []; // edit-me
        const gpus: any[] = []; // edit-me
        // EDIT THESE VALUES - END //

        let infos: t.MinerInfos = {
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


