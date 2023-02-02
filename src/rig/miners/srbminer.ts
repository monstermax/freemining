
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
Github   : https://github.com/doktor83/SRBMiner-Multi
Download : https://github.com/doktor83/SRBMiner-Multi/releases/

*/
/* ########## CONFIG ######### */

const minerName = 'srbminer';
const minerTitle = 'SRBMiner Multi';
const github = 'doktor83/SRBMiner-Multi';
const lastVersion = '2.1.0';

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
        const versionBis = version.replaceAll('.', '-');
        let subDir = `${SEP}SRBMiner-Multi-${versionBis}`;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/doktor83/SRBMiner-Multi/releases/download/${version}/SRBMiner-Multi-${versionBis}-Linux.tar.xz`,
            'win32':   `https://github.com/doktor83/SRBMiner-Multi/releases/download/${version}/SRBMiner-Multi-${versionBis}-win64.zip`,
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

    apiPort: 52011,
    command: 'SRBMiner-MULTI', // the filename of the executable (without .exe extension)

    getCommandArgs(config, params) {
        const args: string[] = [
            '--disable-cpu',
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    '--api-enable',
                    '--api-port', this.apiPort.toString(),
                ]
            );
        }

        if (params.algo) {
            args.push('--algorithm');
            args.push(params.algo);
        }

        if (params.poolUrl) {
            args.push('--pool');
            args.push(params.poolUrl);
        }

        if (params.poolUser) {
            args.push('--wallet');
            args.push(params.poolUser);

            //args.push('--edit-me-password');
            //args.push('x');
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


