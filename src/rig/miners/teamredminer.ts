
import fs from 'fs';
import path from 'path';
import os from 'os';
import tar from 'tar';
import fetch from 'node-fetch';
import admZip from 'adm-zip';

import { now, getOpt, downloadFile } from '../../common/utils';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website: 
Github : 

*/
/* ########## MAIN ######### */

const SEP = path.sep;


/* ########## FUNCTIONS ######### */

export const minerInstall: t.minerInstallInfos = {
    version: '0.10.8',

    async install(config, params) {
        const targetAlias: string = params.alias || params.miner;
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `frm-tmp.miner-install-${params.miner}-${targetAlias}-`), {});
        const targetDir = `${config?.appDir}${SEP}rig${SEP}miners${SEP}${targetAlias}`

        //throw { message: `edit-me then delete this line` };

        const platform = getOpt('--platform', config._args) || os.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
        let dlUrl: string;
        let subDir = `teamredminer-v${this.version}-*`;

        if (platform === 'linux') {
            dlUrl = `https://github.com/todxx/teamredminer/releases/download/v${this.version}/teamredminer-v${this.version}-linux.tgz`;
            subDir = `teamredminer-v${this.version}-linux`;

        } else if (platform === 'win32') {
            dlUrl = `https://github.com/todxx/teamredminer/releases/download/v${this.version}/teamredminer-v${this.version}-win.zip`;
            subDir = `teamredminer-v${this.version}-win`;

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
        if (path.extname(dlFilePath) === '.gz') {
            await tar.extract(
                {
                    file: dlFilePath,
                    cwd: `${tempDir}${SEP}unzipped`,
                }
            ).catch((err: any) => {
                throw { message: err.message };
            });

        } else {
            const zipFile = new admZip(dlFilePath);
            await new Promise((resolve, reject) => {
                zipFile.extractAllToAsync(`${tempDir}${SEP}unzipped`, true, true, (err: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(null);
                });
            }).catch((err:any) => {
                throw { message: err.message };
            });
        }
        console.log(`${now()} [INFO] [RIG] Extract complete`);

        // Install to target dir
        fs.mkdirSync(targetDir, {recursive: true});
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.renameSync( `${tempDir}${SEP}unzipped${SEP}edit-me${SEP}`, targetDir);
        console.log(`${now()} [INFO] [RIG] Install complete into ${targetDir}`);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};



export const minerCommands: t.minerCommandInfos = {
    apiPort: -1, // 42004

    command: 'teamredminer', // the filename of the executable (without .exe extension)

    getCommandFile(config, params) {
        return this.command + (os.platform() === 'linux' ? '' : '.exe');
    },

    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    `--api_listen=0.0.0.0:${this.apiPort.toString()}`,
                ]
            );
        }

        if (params.algo) {
            args.push('-a');
            args.push(params.algo);
        }

        if (params.poolUrl) {
            args.push('-o');
            args.push( `stratum+tcp://${params.poolUrl}` );
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


