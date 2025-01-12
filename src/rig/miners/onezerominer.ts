
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
Github   : 
Download : 

*/
/* ########## CONFIG ######### */

const minerName = 'onezerominer';
const minerTitle = 'onezerominer';
const github = 'OneZeroMiner/onezerominer';
const lastVersion = '1.2.3';

/* ########## MAIN ######### */

const SEP = path.sep;

const minerStatsMapping: {[key: string]: any} = {
    miner: {
        name: 'onezerominer',
        worker: { path: 'worker.name', default: '' },
        uptime: { path: 'uptime_seconds', default: 0 },
        algo: { path: 'algos.0.name', default: '' },
        hashRate: { path: 'algos.0.total_hashrate', default: 0 },
    },
    pool: {
        url: { path: 'algos.0.pool.pool', default: '' },
        account: { path: 'algos.0.pool.account', default: '' },
    },
    devices: {
        cpus: [], // Pas d'informations CPU pour ce miner
        gpus: (apiResponse: OnezerominerApiResponse) => apiResponse.devices.map((gpu: any) => ({
            id: gpu.id,
            name: `${gpu.vendor} ${gpu.name}`,
            hashRate: apiResponse.algos[0]?.hashrates[gpu.id],
            temperature: gpu.temp,
            fanSpeed: gpu.fan,
            power: gpu.power,
        })),
    },
};

type OnezerominerApiResponse = any; // TODO


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
        //const versionBis = version.replace( new RegExp('\\.', 'g'), '-');
        let subDir = `${SEP}onezerominer-${platform}`;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/OneZeroMiner/onezerominer/releases/download/v${version}/onezerominer-linux-${version}.tar.gz`,
            'win32':   `https://github.com/OneZeroMiner/onezerominer/releases/download/v${version}/onezerominer-win64-${version}.zip`,
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

    apiPort: 52019,
    command: 'onezerominer',
    //command: '/usr/bin/docker', // TEST DOCKER
    managed: true,

    getCommandArgs(config, params) {
        const args: string[] = [];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    //'--api-enable',
                    '--api-host', '0.0.0.0',
                    '--api-port', this.apiPort.toString(),
                ]
            );
        }

        if (params.algo) {
            args.push('--algo');
            args.push(params.algo);
        }

        if (params.poolUrl) {
            args.push('--pool');
            args.push(params.poolUrl);
        }

        if (params.poolUser) {
            args.push('--wallet');
            args.push(params.poolUser);

            //args.push('--edit-me-password');
            //args.push('x');
        }

        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }

        return args;
    },


    async getInfos(config: t.DaemonConfig, params: t.getMinerInfosParams) {
        const apiUrl = `http://127.0.0.1:${this.apiPort}`;
        const response = await fetch(apiUrl);
        const apiResponse = await response.json() as OnezerominerApiResponse;

        // Appliquer le mapping spécifique au miner
        return this.mapApiResponse(apiResponse, minerStatsMapping);
    },

    async getInfos_OLD(config: t.DaemonConfig, params: t.getMinerInfosParams) {
        const apiUrl = `http://127.0.0.1:${this.apiPort}`;
        const headers: any = {};

        const minerSummaryRes = await fetch(`${apiUrl}/`, {headers});
        const minerSummary = await minerSummaryRes.json() as OnezerominerApiResponse;

        // EDIT THESE VALUES - START //
        const _algo = minerSummary.algos[0] || {};
        const uptime = minerSummary.uptime_seconds || -1;
        const algo = _algo?.name || '';
        const workerHashRate = _algo?.total_hashrate || -1;

        const poolUrl = _algo?.pool.pool || '';
        const poolUser = '';
        const workerName = poolUser.split('.').pop() as string || ''; // edit-me

        const cpus: t.MinerCpuInfos[] = [];

        const gpus: t.MinerGpuInfos[] = minerSummary.devices.map((gpu: any) => {
            return {
                id: gpu.id,
                name: `${gpu.vendor} ${gpu.name}`,
                hashRate: _algo.hashrates[gpu.id],
                temperature: gpu.temp,
                fanSpeed: gpu.fan,
                power: gpu.power,
            };
        })
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


