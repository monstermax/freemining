
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
Github   : https://github.com/develsoftware/GMinerRelease
Download : https://github.com/develsoftware/GMinerRelease/releases/

*/
/* ########## CONFIG ######### */

const minerName = 'gminer';
const minerTitle = 'GMiner';
const github = 'develsoftware/GMinerRelease';
const lastVersion = '3.27';

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
        const versionBis = version.replace( new RegExp('.', 'g'), '_');
        let subDir = ``;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/develsoftware/GMinerRelease/releases/download/${version}/gminer_${versionBis}_linux64.tar.xz`,
            'win32':   `https://github.com/develsoftware/GMinerRelease/releases/download/${version}/gminer_${versionBis}_windows64.zip`,
            'darwin':  ``,
            'freebsd': ``,
        }
        let dlUrl = dlUrls[platform] || '';

        if (! dlUrl) throw { message: `No installation script available for the platform ${platform}` };

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

    apiPort: 52006,
    command: 'miner',
    managed: true,

    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    '--api', this.apiPort.toString(),
                ]
            );
        }

        if (params.algo) {
            args.push('--algo');
            args.push(params.algo);
        }

        if (params.poolUrl) {
            args.push('--server');
            args.push(params.poolUrl.split(':')[0] || "-");
            args.push('--port');
            args.push( (Number(params.poolUrl.split(':')[1]) || 0).toString() );
        }

        if (params.poolUser) {
            args.push('--user');
            args.push(params.poolUser);
        }

        if (true) {
            args.push('--pass');
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

        const minerSummaryRes = await fetch(`${apiUrl}/stat`, {headers});
        const minerSummary: any = await minerSummaryRes.json();

        // EDIT THESE VALUES - START //
        const uptime = minerSummary.uptime;
        const algo = minerSummary.algorithm
        let workerHashRate = 0;

        const poolUrl = minerSummary.server || '';
        const poolUser = minerSummary.user || '';
        const workerName = poolUser.split('.').pop() as string || '';

        const cpus: t.MinerCpuInfos[] = [];

        const gpus: t.MinerGpuInfos[] = minerSummary.devices.map((gpu: any) => {
            workerHashRate += gpu.speed;

            return {
                id: gpu.gpu_id,
                name: gpu.name,
                temperature: gpu.temperature,
                fanSpeed: gpu.fan,
                hashRate: gpu.speed,
                power: gpu.power_usage,
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


