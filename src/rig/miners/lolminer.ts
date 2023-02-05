
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
Github   : https://github.com/Lolliedieb/lolMiner-releases
Download : https://github.com/Lolliedieb/lolMiner-releases/releases/

*/
/* ########## CONFIG ######### */

const minerName = 'lolminer';
const minerTitle = 'lolMiner';
const github = 'Lolliedieb/lolMiner-releases';
const lastVersion = '1.66';

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
        let subDir = `${SEP}${version}`;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/Lolliedieb/lolMiner-releases/releases/download/${version}/lolMiner_v${version}_Lin64.tar.gz`,
            'win32':   `https://github.com/Lolliedieb/lolMiner-releases/releases/download/${version}/lolMiner_v${version}_Win64.zip`,
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

    apiPort: 52002,
    command: 'lolMiner', // the filename of the executable (without .exe extension)
    managed: true,

    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    '--apihost', '127.0.0.1',
                    '--apiport', this.apiPort.toString(),
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

        const minerSummaryRes = await fetch(`${apiUrl}/`, {headers});
        const minerSummary: any = await minerSummaryRes.json();

        // EDIT THESE VALUES - START //
        const _algo: any = minerSummary.Algorithms[0];
        const multipliers: any = {
            "Mh/s": 1000 * 1000,
            "Hh/s": 1000,
        };

        const uptime = minerSummary.Session.Uptime
        const algo = _algo.Algorithm;
        const workerHashRate = _algo.Total_Performance * (multipliers[_algo.Performance_Unit] || 1);

        const poolUrl = _algo.Pool;
        const poolUser = _algo.User;
        const workerName = poolUser.split('.').pop() as string || '';

        const cpus: t.MinerCpuInfos[] = [];

        const gpus: t.MinerGpuInfos[] = minerSummary.Workers.map((worker: any) => {
            return {
                id: worker.Index,
                name: worker.Name,
                temperature: worker.Core_Temp,
                fanSpeed: worker.Fan_Speed,
                hashRate: _algo.Worker_Performance[worker.Index] * (multipliers[_algo.Performance_Unit] || 1),
                power: minerSummary.Workers[worker.Index].Power,
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


