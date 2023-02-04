
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
Github   : https://github.com/NebuTech/NBMiner
Download : https://github.com/NebuTech/NBMiner/releases/

*/
/* ########## CONFIG ######### */

const minerName = 'nbminer';
const minerTitle = 'NBMiner';
const github = 'NebuTech/NBMiner';
const lastVersion = '42.3';

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
        let subDir = `${SEP}NBMiner_*`;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/NebuTech/NBMiner/releases/download/v${version}/NBMiner_${version}_Linux.tgz`,
            'win32':   `https://github.com/NebuTech/NBMiner/releases/download/v${version}/NBMiner_${version}_Win.zip`,
            'darwin':  ``,
            'freebsd': ``,
        }
        let dlUrl = dlUrls[platform] || '';

        if (! dlUrl) throw { message: `No installation script available for the platform ${platform}` };

        // Some common install options
        const { minerAlias, tempDir, minerDir, aliasDir } = this.getInstallOptions(config, params, version);

        if (platform === 'linux') {
            subDir = `${SEP}NBMiner_Linux`;

        } else if (platform === 'win32') {
            subDir = `${SEP}NBMiner_Win`;
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

    apiPort: 52001,
    command: 'nbminer', // the filename of the executable (without .exe extension)

    getCommandArgs(config, params) {
        const logDir   = `${config.logDir}${SEP}rig${SEP}miners`;
        const logFile  = `${logDir}${SEP}${params.miner}.run.log`;

        const args: string[] = [
            '--no-color',
            '--no-watchdog',
            //'--log-file', logFile + '.debug.log',
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    '--api', `127.0.0.1:${this.apiPort.toString()}`,
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

        const minerSummaryRes = await fetch(`${apiUrl}/api/v1/status`, {headers});
        const minerSummary: any = await minerSummaryRes.json();

        // EDIT THESE VALUES - START //
        const start_time = minerSummary.start_time;
        const uptime = (Date.now() / 1000) - start_time;
        const algo = minerSummary.algorithm;
        const workerHashRate = minerSummary.miner.total_hashrate

        const poolUrl = minerSummary.stratum.url;
        const poolUser = minerSummary.stratum.user;
        const workerName = poolUser.split('.').pop() as string || '';

        const cpus: t.MinerCpuInfos[] = [];

        const gpus: t.MinerGpuInfos[] = minerSummary.miner.devices.map((gpu: any) => {
            return {
                id: gpu.id,
                name: gpu.info,
                temperature: gpu.temperature,
                fanSpeed: gpu.fan,
                hashRate: gpu.hashrate,
                power: gpu.power,
            };
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


