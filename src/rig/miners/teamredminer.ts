
import fs from 'fs';
import path from 'path';
import os from 'os';
//import fetch from 'node-fetch';
//import net from 'net';


import { now, getOpt, downloadFile, sendSocketMessage } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';
import * as baseMiner from './_baseMiner';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website  : 
Github   : https://github.com/todxx/teamredminer
Download : https://github.com/todxx/teamredminer/releases/

*/
/* ########## CONFIG ######### */

const minerName = 'teamredminer';
const minerTitle = 'TeamRedMiner';
const github = 'todxx/teamredminer';
const lastVersion = '0.10.8';

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
        let subDir = `${SEP}teamredminer-v${version}-*`;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/todxx/teamredminer/releases/download/v${version}/teamredminer-v${version}-linux.tgz`,
            'win32':   `https://github.com/todxx/teamredminer/releases/download/v${version}/teamredminer-v${version}-win.zip`,
            'darwin':  ``,
            'freebsd': ``,
        }
        let dlUrl = dlUrls[platform] || '';

        if (! dlUrl) throw { message: `No installation script available for the platform ${platform}` };

        // Some common install options
        const { minerAlias, tempDir, minerDir, aliasDir } = this.getInstallOptions(config, params, version);

        if (platform === 'linux') {
            subDir = `${SEP}teamredminer-v${version}-linux`;

        } else if (platform === 'win32') {
            subDir = `${SEP}teamredminer-v${version}-win`;
        }


        // Downloading
        const dlFileName = path.basename(dlUrl);
        const dlFilePath = `${tempDir}${SEP}${dlFileName}`;
        await this.downloadFile(dlUrl, dlFilePath);

        // Extracting
        await this.extractFile(tempDir, dlFilePath);

        // Install to target dir
        fs.mkdirSync(aliasDir, {recursive: true});
        fs.rmSync(aliasDir, { recursive: true, force: true });
        fs.copyFileSync( `${tempDir}${SEP}unzipped${subDir}${SEP}`, aliasDir);

        // Write report files
        this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`${now()} [INFO] [RIG] Install complete into ${aliasDir}`);
    }
};



export const minerCommands: t.minerCommandInfos = {
    ...baseMiner.minerCommands,

    apiPort: 52004,
    command: 'teamredminer', // the filename of the executable (without .exe extension)
    managed: true,

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
        const apiHost = '127.0.0.1';
        const headers: any = {}; // edit-me if needed

        //const minerSummaryRes = await fetch(`${apiUrl}/`, {headers}); // EDIT API URL
        const minerSummaryRes = await sendSocketMessage(`{"command":"summary","parameter":""}`, apiHost, this.apiPort) as any;
        const minerSummary: any = JSON.parse(minerSummaryRes).SUMMARY;

        const poolsRes = await sendSocketMessage(`{"command":"pools","parameter":""}`, apiHost, this.apiPort) as any;
        const pools: any = JSON.parse(poolsRes).POOLS;

        const minerDevRes = await sendSocketMessage(`{"command":"devs","parameter":""}`, apiHost, this.apiPort) as any;
        const minerDev: any = JSON.parse(minerDevRes).DEVS;

        const minerDevDetailsRes = await sendSocketMessage(`{"command":"devdetails","parameter":""}`, apiHost, this.apiPort) as any;
        const minerDevDetails: any = JSON.parse(minerDevDetailsRes).DEVDETAILS;

        //const minerGpuRes = await sendSocketMessage(`{"command":"gpu","parameter":""}`, apiHost, this.apiPort) as any;
        //const minerGpu: any = JSON.parse(minerGpuRes).GPU;

        // EDIT THESE VALUES - START //
        const uptime = minerSummary[0].Elapsed as number;
        const algo = pools[0].Algorithm as string;
        const workerHashRate = (minerSummary[0]['KHS 30s'] || 0) * 1000;

        const poolUrl = pools[0].URL as string;
        const poolUser = pools[0].User as string;
        const workerName = poolUser.split('.').pop() as string || ''; // edit-me

        const cpus: t.MinerCpuInfos[] = [];

        const gpus: t.MinerGpuInfos[] = await Promise.all(
            minerDev.map(async (gpu: any, idx: number) => {
                return {
                    id: gpu.GPU as number, //  minerDevDetails[idx]['ID'] OR minerGpu[idx]['GPU']
                    name: minerDevDetails[idx]['Model'],
                    hashRate: (gpu['KHS 30s'] || 0) * 1000,
                    temperature: gpu['Temperature'],
                    fanSpeed: gpu['Fan Percent'],
                    power: gpu['GPU Power'],
                }
            })
        );
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


