
import fs from 'fs';
import path from 'path';
import os from 'os';
//import fetch from 'node-fetch';
//import net from 'net';


import { now, getOpt, downloadFile, sendSocketMessage } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website  : 
Github   : https://github.com/todxx/teamredminer
Download : https://github.com/todxx/teamredminer/releases/

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
        await decompressFile(dlFilePath, `${tempDir}${SEP}unzipped`);
        console.log(`${now()} [INFO] [RIG] Extract complete`);

        // Install to target dir
        fs.mkdirSync(targetDir, {recursive: true});
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.renameSync( `${tempDir}${SEP}unzipped${SEP}${subDir}${SEP}`, targetDir);
        console.log(`${now()} [INFO] [RIG] Install complete into ${targetDir}`);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};



export const minerCommands: t.minerCommandInfos = {
    apiPort: 52004,

    command: 'teamredminer', // the filename of the executable (without .exe extension)

    getCommandFile(config, params) {
        return this.command + (os.platform() === 'win32' ? '.exe' : '');
    },

    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    `--api_listen=0.0.0.0:${this.apiPort.toString()}`, // sgminer style API
                    //`cm_api_listen=0.0.0.0:${this.apiPort.toString()}`, // claymore style API
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
        //const apiUrl = `http://127.0.0.1:${this.apiPort}`;
        const apiHost = '127.0.0.1';
        const headers: any = {}; // edit-me if needed

        //const minerSummaryRes = await fetch(`${apiUrl}/`, {headers}); // EDIT API URL
        const minerSummaryRes = await sendSocketMessage(`{"command":"summary","parameter":""}`, apiHost, this.apiPort) as any;
        const minerSummary: any = JSON.parse(minerSummaryRes)
        
        const minerDevRes = await sendSocketMessage(`{"command":"devs","parameter":""}`, apiHost, this.apiPort) as any;
        const minerDev: any = JSON.parse(minerDevRes);

        // EDIT THESE VALUES - START //
        const minerName = 'TeamRedMiner';
        const uptime = -1; // edit-me
        const algo = 'edit-me';
        const workerHashRate = (minerSummary['KHS 30s'] || 0) / 1000;

        const poolUrl = ''; // edit-me
        const poolUser = ''; // edit-me
        const workerName = poolUser.split('.').pop() as string || ''; // edit-me

        const cpus: any[] = [];

        const gpus: any[] = await minerDev.DEVS.map(async (gpu: any, idx: number) => {
            const minerGpuRes = await sendSocketMessage(`{"command":"devs","parameter":""}`, apiHost, this.apiPort) as any;
            const minerGpu: any = JSON.parse(minerGpuRes);

            return {
                id: gpu.GPU as number,
                name: gpu.name as string,
                hashRate: gpu.hashrate as number,
                temperature: gpu['Temperature'] as number,
                fanSpeed: gpu['Fan Percent'] as number,
                power: gpu['GPU Power'] as number,
            }
        });
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


