
import fs from 'fs';
import path from 'path';
import os from 'os';
//import fetch from 'node-fetch';
//import net from 'net';

import { exec } from '../../common/exec';

import { now, getOpt, downloadFile, sendSocketMessage } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';
import * as baseMiner from './_baseMiner';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website  : 
Github   : https://github.com/JayDDee/cpuminer-opt
Download : 

Build dependencies: libcurl4-gnutls-dev libgmp-dev

*/
/* ########## CONFIG ######### */

const minerName = 'cpuminer';
const minerTitle = 'cpuminer';
const github = 'JayDDee/cpuminer';
const lastVersion = '3.21.0';

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
        let subDir = `${SEP}cpuminer-v${version}-*`;

        if (platform === 'linux') {
            return this.installFromSources(config, params);
        }

        // Download url selection
        const dlUrls: any = {
            'linux':   ``,
            'win32':   `https://github.com/JayDDee/cpuminer-opt/releases/download/v3.21.0/cpuminer-opt-${version}-windows.zip`,
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
    },


    async installFromSources(config: t.DaemonConfigAll, params: t.minerInstallStartParams) {
        const platform = getOpt('--platform', config._args) || os.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
        const setAsDefaultAlias = params.default || false;

        let version = params.version || this.lastVersion;
        let subDir = ``; // edit-me


        // Some common install options
        const { minerAlias, tempDir, minerDir, aliasDir } = this.getInstallOptions(config, params, version);


        // Clone
        const dlUrl = `https://github.com/JayDDee/cpuminer-opt`;
        await exec('/usr/bin/git', ['clone', dlUrl], '', tempDir)
        .catch((err: any) => {
            console.warn(`${now()} [WARNING] [RIG] PROCESS ERROR ${minerName}-${minerAlias} : ${err.message}`);
        });

        // Build
        await exec('./build.sh', [], '', `${tempDir}/cpuminer-opt`)
        .catch((err: any) => {
            console.warn(`${now()} [WARNING] [RIG] PROCESS ERROR ${minerName}-${minerAlias} : ${err.message}`);
        });

        // Install to target dir
        fs.rmSync(aliasDir, { recursive: true, force: true });
        fs.mkdirSync(aliasDir, {recursive: true});
        fs.renameSync( `${tempDir}${SEP}cpuminer-opt${SEP}cpuminer`, `${aliasDir}${SEP}cpuminer`);

        // Write report files
        this.writeReport(version, minerAlias, dlUrl, aliasDir, minerDir, setAsDefaultAlias);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`${now()} [INFO] [RIG] Install complete into ${aliasDir}`);
    }
};



export const minerCommands: t.minerCommandInfos = {
    ...baseMiner.minerCommands,

    apiPort: 52016,
    command: 'cpuminer',
    managed: true,


    getCommandArgs(config, params) {
        const args: string[] = [
        ];

        if (this.apiPort > 0) {
            args.push(
                ...[
                    `--api-bind=127.0.0.1:${this.apiPort.toString()}`, // sgminer style API
                ]
            );
        }

        if (params.algo) {
            args.push('-a');
            args.push(params.algo);
        }

        if (params.poolUrl) {
            args.push('-o');
            args.push( `${params.poolUrl}` );
        }

        if (params.poolUser) {
            args.push('--user');
            args.push(params.poolUser);

            //args.push('-p');
            //args.push('x');
        }

        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }

        return args;
    },


    async getInfos(config, params) {
        const apiHost = '127.0.0.1';
        const headers: any = {};

        const minerSummaryTxt: any = (await sendSocketMessage(`summary`, apiHost, this.apiPort)
                                        .catch((err: any) => {
                                            console.warn(`${now()} [WARNING] [RIG] getInfos summary ERROR ${minerName} : ${err.message}`);
                                        })) || '{}';
        // NAME=cpuminer-opt;VER=3.21.0;API=1.0;ALGO=yescryptr16;CPUS=6;URL=connect.fennecblockchain.com:8200;HS=1135.89;KHS=1.14;ACC=0;REJ=0;SOL=0;ACCMN=0.000;DIFF=0.054484;TEMP=42.8;FAN=0;FREQ=4545973;UPTIME=3;TS=1675586025|

        let parts = minerSummaryTxt.split(';')
        const minerSummary = Object.fromEntries(parts.map((data: string) => {
            const [key, value] = data.split('=');
            return [key, value];
        }));

        const threadsTxt: any = (await sendSocketMessage(`threads`, apiHost, this.apiPort)
                                        .catch((err: any) => {
                                            console.warn(`${now()} [WARNING] [RIG] getInfos threads ERROR ${minerName} : ${err.message}`);
                                        })) || '{}';
        // CPU=0;H/s=278.19|CPU=1;H/s=278.17|CPU=2;H/s=278.15|CPU=3;H/s=278.17|CPU=4;H/s=277.76|CPU=5;H/s=278.15|

        const devices = threadsTxt.split('|').map((deviceTxt: string) => {
            const parts = deviceTxt.split(';')
            return Object.fromEntries(parts.map((data: string) => {
                const [key, value] = data.split('=');
                return [key, value];
            }));
        });


        // EDIT THESE VALUES - START //
        const uptime = minerSummary.UPTIME;
        const algo = minerSummary.ALGO;
        const workerHashRate = minerSummary.HS;

        const poolUrl = minerSummary.URL;
        const poolUser = '';
        const workerName = poolUser.split('.').pop() as string || '';

        let cpuHashRate = 0;
        devices.forEach((cpu: any) => {
            const value = Number(cpu['H/s']);
            if (value) {
                cpuHashRate += value;
            }
        });
        //const cpus: t.MinerCpuInfos[] = devices.map((cpu: any) => {
        //    return {
        //        id: cpu.CPU,
        //        name: '',
        //        hashRate: cpu['H/s'],
        //        threads: -1,
        //        //totalThreads: -1,
        //    };
        //});
        const cpus: t.MinerCpuInfos[] = [{
            id: 0,
            name: '',
            hashRate: cpuHashRate,
            threads: devices.length,
        }];

        const gpus: t.MinerGpuInfos[] = [];
        for (const [gpu, idx] of [] as any) {
            gpus.push({
                id: -1,
                name: '',
                hashRate: -1,
                temperature: -1,
                fanSpeed: -1,
                power: -1,
            });
        }
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


