
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

export const fullnodeInstall: t.fullnodeInstallInfos = {
    version: 'edit-me',

    async install(config, params) {
        const targetAlias: string = params.alias || params.fullnode;
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `frm-tmp.fullnode-install-${params.fullnode}-${targetAlias}-`), {});
        const targetDir = `${config?.appDir}${SEP}node${SEP}fullnodes${SEP}${targetAlias}`

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

        if (dlUrl === 'edit-me') throw { message: `No installation script available for the platform ${platform}` };

        // Downloading
        const dlFileName = path.basename(dlUrl);
        const dlFilePath = `${tempDir}${SEP}${dlFileName}`;
        console.log(`${now()} [INFO] [NODE] Downloading file ${dlUrl}`);
        await downloadFile(dlUrl, dlFilePath);
        console.log(`${now()} [INFO] [NODE] Download complete`);

        // Extracting
        fs.mkdirSync(`${tempDir}${SEP}unzipped`);
        console.log(`${now()} [INFO] [NODE] Extracting file ${dlFilePath}`);
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
        console.log(`${now()} [INFO] [NODE] Extract complete`);

        // Install to target dir
        fs.mkdirSync(targetDir, {recursive: true});
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.renameSync( `${tempDir}${SEP}unzipped${SEP}edit-me${SEP}`, targetDir);
        console.log(`${now()} [INFO] [NODE] Install complete into ${targetDir}`);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};



export const fullnodeCommands: t.fullnodeCommandInfos = {
    p2pPort: -1, // edit-me
    rpcPort: -1, // edit-me

    command: 'edit-me', // the filename of the executable (without .exe extension)

    getCommandFile(config, params) {
        return this.command + (os.platform() === 'linux' ? '' : '.exe');
    },

    getCommandArgs(config, params) {
        const args: string[] = [
            `-edit-me-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
        ];

        if (this.rpcPort !== -1) {
            args.push( `-edit-me-rpcport=${this.rpcPort.toString()}` );
        }

        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }

        return args;
    },


    async getInfos(config, params) {
        const apiUrl = `http://127.0.0.1:${this.rpcPort}`;
        const headers: any = {}; // edit-me if needed

        // TODO: RPC REQUEST

        //const fullnodeSummaryRes = await fetch(`${apiUrl}/`, {headers}); // EDIT API URL
        //const fullnodeSummary: any = await fullnodeSummaryRes.json();

        // EDIT THESE VALUES - START //
        const fullnodeName = 'edit-me';
        const coin = 'edit-me';
        const blocks = -1; // edit-me
        const blockHeaders = -1; // edit-me

        const cpus: any[] = []; // edit-me
        // EDIT THESE VALUES - END //

        let infos: t.FullnodeInfos = {
            infos: {
                name: fullnodeName,
                coin,
            },
            blockchain: {
                blocks,
                headers: blockHeaders,
            },
        };

        return infos;
    }
};


