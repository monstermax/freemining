
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';

import { now, getOpt, downloadFile } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website  : 
Github   : https://github.com/firoorg/firominer
Download : https://github.com/firoorg/firominer/releases/

*/
/* ########## MAIN ######### */

const SEP = path.sep;


/* ########## FUNCTIONS ######### */

export const minerInstall: t.minerInstallInfos = {
    version: '1.1.0',

    async install(config, params) {
        const targetAlias: string = params.alias || params.miner;
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `frm-tmp.miner-install-${params.miner}-${targetAlias}-`), {});
        const targetDir = `${config?.appDir}${SEP}rig${SEP}miners${SEP}${targetAlias}`

        //throw { message: `edit-me then delete this line` };

        const platform = getOpt('--platform', config._args) || os.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
        let dlUrl: string;
        let installFileName = 'firominer';

        if (platform === 'linux') {
            dlUrl = `https://github.com/firoorg/firominer/releases/download/${this.version}/firominer-Linux.7z`;

        } else if (platform === 'win32') {
            dlUrl = `https://github.com/firoorg/firominer/releases/download/${this.version}/firominer-Windows.zip`;
            installFileName = 'firominer.exe';

        } else if (platform === 'darwin') {
            dlUrl = `edit-me`;

        } else {
            throw { message: `No installation script available for the platform ${platform}` };
        }

        if (dlUrl === 'edit-me') throw { message: `No installation script available for the platform ${platform}` };

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
        fs.chmodSync(`${targetDir}/${installFileName}`, 0o755);
        console.log(`${now()} [INFO] [RIG] Install complete into ${targetDir}`);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};



export const minerCommands: t.minerCommandInfos = {
    apiPort: 52012,

    command: 'firominer', // the filename of the executable (without .exe extension)

    getCommandFile(config, params) {
        return this.command + (os.platform() === 'win32' ? '.exe' : '');
    },

    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    '--api-bind',
                    '--api-port', this.apiPort.toString(),
                    //'--api-password', 'pass',
                ]
            );
        }

        if (params.algo) {
        }

        if (params.poolUrl && params.poolUser) {
            args.push('--pool');
            args.push( `stratum+tcp://${params.poolUser}:x@${params.poolUrl}` );
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


