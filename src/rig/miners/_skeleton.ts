
import fs from 'fs';
import path from 'path';
import os from 'os';
import tar from 'tar';
import fetch from 'node-fetch';
import admZip from 'adm-zip';

import { now, getOpt, downloadFile } from '../../common/utils';

import type *  as t from '../../common/types';


const SEP = (os.platform() === 'win32') ? path.sep.repeat(2) : path.sep;



export const minerInstall: t.minerInstallInfos = {
    version: '6.18.1',

    async install(config, params) {
        const targetAlias: string = params.alias || params.miner;
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `frm-tmp.miner-install-${params.miner}-${targetAlias}-`), {});
        const targetDir = `${config?.appDir}${SEP}rig${SEP}miners${SEP}${targetAlias}`

        throw { message: `edit-me then delete this line` };

        const platform = getOpt('--platform', config._args) || os.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
        let dlUrl: string;

        if (platform === 'linux') {
            dlUrl = `edit-me`;

        } else if (platform === 'win32') {
            dlUrl = `edit-me`;

        } else if (platform === 'darwin') {
            dlUrl = `edit-me`;

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
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.renameSync( `${tempDir}${SEP}unzipped${SEP}edit-me${SEP}`, targetDir);
        console.log(`${now()} [INFO] [RIG] Install complete into ${targetDir}`);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};



export const minerCommands: t.minerCommandInfos = {
    apiPort: 42099, // edit-me

    command: 'edit-me', // the filename of the executable (without .exe extension)

    getCommandFile(config, params) {
        return this.command + (os.platform() === 'linux' ? '' : '.exe');
    },

    getCommandArgs(config, params) {
        const args: string[] = [
            '--edit-me-api-host', '127.0.0.1',
            '--edit-me-api-port', this.apiPort.toString(),
        ];

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
        const headers: any = {};

        const minerSummaryRes = await fetch(`${apiUrl}/`, {headers}); // EDIT API URL
        const minerSummary: any = await minerSummaryRes.json();

        // EDIT THESE VALUES - START //
        const minerName = '';
        const algo = '';
        const workerHashRate = 0;

        const poolUrl = '';
        const poolUser = '';
        const workerName = poolUser.split('.').pop() || '';

        const cpus: any[] = [];
        const gpus: any[] = [];
        // EDIT THESE VALUES - END //

        let infos: t.MinerInfos = {
            infos: {
                name: minerName,
                worker: workerName,
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


