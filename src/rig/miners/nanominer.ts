
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

Website  : https://nanominer.org/
Github   : https://github.com/nanopool/nanominer
Download : https://github.com/nanopool/nanominer/releases/

*/
/* ########## CONFIG ######### */

const minerName = 'nanominer';
const minerTitle = 'NanoMiner';
const github = 'nanopool/nanominer';
const lastVersion = '3.7.6';

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
        let subDir = `${SEP}nanominer-*-${version}`;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/nanopool/nanominer/releases/download/v${version}/nanominer-linux-${version}.tar.gz`,
            'win32':   `https://github.com/nanopool/nanominer/releases/download/v${version}/nanominer-windows-${version}.zip`,
            'darwin':  ``,
            'freebsd': ``,
        }
        let dlUrl = dlUrls[platform] || '';

        if (! dlUrl) throw { message: `No installation script available for the platform ${platform}` };

        // Some common install options
        const { minerAlias, tempDir, minerDir, aliasDir } = this.getInstallOptions(config, params, version);

        if (platform === 'linux') {
            subDir = '';

        } else if (platform === 'win32') {
            subDir = `${SEP}nanominer-windows-${version}`;
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
        fs.cpSync( `${tempDir}${SEP}unzipped${subDir}${SEP}`, `${aliasDir}${SEP}`, { recursive: true } );

        // Write report files
        this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`${now()} [INFO] [RIG] Install complete into ${aliasDir}`);
    }
};



export const minerCommands: t.minerCommandInfos = {
    ...baseMiner.minerCommands,

    apiPort: 52014,
    command: 'nanominer', // the filename of the executable (without .exe extension)
    managed: false, // set true when the getInfos() script is ready

    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    '-webPort', this.apiPort.toString(),
                ]
            );
        }

        if (params.algo) {
            args.push('-algo');
            args.push(params.algo);
        }

        if (params.poolUrl) {
            args.push('-pool1');
            args.push(params.poolUrl);
        }

        if (params.poolUser) {
            args.push('-wallet');
            args.push(params.poolUser);
        }

        if (true) {
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

        const minerSummaryRes = await fetch(`${apiUrl}/stats`, {headers}); // EDIT API URL
        const minerSummary: any = await minerSummaryRes.json();

        // EDIT THESE VALUES - START //
        const minerName = 'Nanominer';
        const uptime = minerSummary.WorkTime;
        const algoInfos = Object.values(minerSummary.Algorithms[0])[0] || {} as any;
        const algo = Object.keys(algoInfos)[0];
        const workerHashRate = -1; // edit-me

        const poolUrl = ''; // edit-me / Object.values(algoInfos as any)[0].CurrentPool;
        const poolUser = ''; // edit-me
        const workerName = poolUser.split('.').pop() as string || ''; // edit-me

        const cpus: t.MinerCpuInfos[] = [];

        const gpus: t.MinerGpuInfos[] = Object.values(minerSummary.Devices[0]).map((gpu: any, idx: number) => {
            return {
                id: idx,
                name: gpu.Name,
                hashRate: algoInfos[`GPU ${idx}`].Hashrate,
                temperature: gpu.Temperature,
                fanSpeed: gpu.Fan,
                power: gpu.Power,
            };
        });
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


