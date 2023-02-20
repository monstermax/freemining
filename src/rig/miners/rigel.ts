
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
Github   : https://github.com/rigelminer/rigel
Download : https://github.com/rigelminer/rigel/releases

*/
/* ########## CONFIG ######### */

const minerName   = 'rigel';
const minerTitle  = 'rigel';
const github      = 'rigelminer/rigel';
const lastVersion = '1.3.5';

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
        let subDir = `${SEP}rigel-${version}-${platform}`;

        if (platform === 'linux') subDir = `${SEP}rigel-${version}-linux`;
        if (platform === 'win32') subDir = `${SEP}rigel-${version}-win`;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/rigelminer/rigel/releases/download/${version}/rigel-${version}-linux.tar.gz`,
            'win32':   `https://github.com/rigelminer/rigel/releases/download/${version}/rigel-${version}-win.zip`,
            'darwin':  ``,
            'freebsd': ``,
        }
        let dlUrl = dlUrls[platform] || '';

        if (dlUrl === '') throw { message: `No installation script available for the platform ${platform}` };

        // Some common install options
        const { minerAlias, tempDir, minerDir, aliasDir } = this.getInstallOptions(config, params, version);


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

    apiPort: 52009,
    command: 'rigel',
    managed: true,


    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    '--api-bind', `127.0.0.1:${this.apiPort}`,
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
        const headers: any = {};

        const minerSummaryRes = await fetch(`${apiUrl}/`, {headers});
        const minerSummary: any = await minerSummaryRes.json();

        // EDIT THESE VALUES - START //
        const uptime = minerSummary.uptime || -1;
        const algo = minerSummary.algorithm || '';
        const workerHashRate = Object.values(minerSummary.hashrate).shift() as number || 0;

        const algoPools: any = Object.values(minerSummary.pools).shift();
        const pool = algoPools[0];
        const poolUrl = `${pool.connection_details.hostname}:${pool.connection_details.port}`;
        const poolUser = pool.connection_details.username || '';
        const workerName = pool.connection_details.worker || poolUser.split('.').pop() as string || '';

        const cpus: t.MinerCpuInfos[] = [];

        const gpus: t.MinerGpuInfos[] = minerSummary.devices.map((gpu: any) => {
            return {
                id: gpu.id as number,
                name: gpu.name as string,
                hashRate: Object.values(gpu.hashrate).shift() as number || 0,
                temperature: gpu.monitoring_info.core_temperature as number,
                fanSpeed: gpu.monitoring_info.fan_speed as number,
                power: gpu.monitoring_info.power_usage as number,
            }
        });
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


