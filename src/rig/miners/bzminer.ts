
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

Website  : https://www.bzminer.com/
Github   : https://github.com/bzminer/bzminer
Download : https://github.com/bzminer/bzminer/releases/

*/
/* ########## CONFIG ######### */

const minerName = 'bzminer';
const minerTitle = 'BzMiner';
const github = 'bzminer/bzminer';
const lastVersion = '13.0.3';

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
        let subDir = `${SEP}bzminer_v${version}_*`;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/bzminer/bzminer/releases/download/v${version}/bzminer_v${version}_linux.tar.gz`,
            'win32':   `https://github.com/bzminer/bzminer/releases/download/v${version}/bzminer_v${version}_windows.zip`,
            'darwin':  ``,
            'freebsd': ``,
        }
        let dlUrl = dlUrls[platform] || '';

        if (! dlUrl) throw { message: `No installation script available for the platform ${platform}` };

        // Some common install options
        const { minerAlias, tempDir, minerDir, aliasDir } = this.getInstallOptions(config, params, version);

        if (platform === 'linux') {
            subDir = `${SEP}bzminer_v${version}_linux`;

        } else if (platform === 'win32') {
            subDir = `${SEP}bzminer_v${version}_windows`;
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
        fs.renameSync( `${tempDir}${SEP}unzipped${subDir}${SEP}`, aliasDir);

        // Write report files
        this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`${now()} [INFO] [RIG] Install complete into ${aliasDir}`);
    }
};



export const minerCommands: t.minerCommandInfos = {
    ...baseMiner.minerCommands,

    apiPort: 52008,
    command: 'bzminer', // the filename of the executable (without .exe extension)
    managed: true,

    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    '--http_enabled', '1',
                    '--http_address', '127.0.0.1',
                    '--http_port', this.apiPort.toString(),
                    //'--http_password', 'pass',
                ]
            );
        }

        if (params.algo) {
            args.push('-a');
            args.push(params.algo);
        }

        if (params.poolUrl) {
            args.push('-p');
            args.push( `stratum+tcp://${params.poolUrl}` );
        }

        if (params.poolUser) {
            args.push('-w');
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

        const minerSummaryRes = await fetch(`${apiUrl}/status`, {headers}); // EDIT API URL
        const minerSummary: any = await minerSummaryRes.json();

        // EDIT THESE VALUES - START //
        const minerName = 'BzMiner';
        const uptime = minerSummary.uptime_s as number;
        const poolInfos = minerSummary.pools[0] || {} as any;
        const algo = poolInfos.algorithm as string;
        const workerHashRate = poolInfos.hashrate as number;

        const poolUrl = poolInfos.url[0] as string;
        const poolUser = poolInfos.wallet as string;
        const workerName = poolInfos.username as string;

        const cpus: t.MinerCpuInfos[] = [];

        const gpus: t.MinerGpuInfos[] = minerSummary.devices.map((gpu:any, idx:number) => {
            return {
                id: idx,
                name: gpu.name as string,
                hashRate: gpu.hashrate[0] as number || 0,
                temperature: gpu.core_temp as number,
                fanSpeed: gpu.fan as number,
                power: gpu.power as number,
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


