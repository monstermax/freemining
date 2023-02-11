
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';

import { now, getOpt, downloadFile } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';

import type *  as t from '../../common/types';


/* ########## MAIN ######### */

const SEP = path.sep;


/* ########## FUNCTIONS ######### */

export const minerInstall: t.minerInstallInfos = {
    minerName: '',
    minerTitle: '',
    lastVersion: '',
    github: '',


    async install(config, params) {
        // EXTENDS ME
    },

    async getLastVersion(): Promise<string> {
        if (! this.github) return '';

        const url = `https://api.github.com/repos/${this.github}/releases/latest`;
        const response = await fetch(url);
        const releaseInfos: any = await response.json();

        let version = releaseInfos.tag_name;
        if (version.startsWith('v')) {
            version = version.slice(1);
        }

        return version;
    },

    async getAllVersions(): Promise<string[]> {
        if (! this.github) return [];

        const url = `https://api.github.com/repos/${this.github}/releases`;
        const response = await fetch(url);
        const releaseVersions: any = await response.json();

        return releaseVersions.map((release: any) => {
            let version = release.tag_name as string;
            if (version.startsWith('v')) {
                version = version.slice(1);
            }

            return version;
        });
    },


    getInstallOptions(config: t.DaemonConfigAll, params: t.MapString<any>, version: string) {
        const minerAlias: string = params.alias || `${this.minerName}-${version}`;
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `frm-tmp.miner-install-${this.minerName}-${minerAlias}-`), {});
        const minerDir = `${config?.appDir}${SEP}rig${SEP}miners${SEP}${this.minerName}`
        const aliasDir = `${minerDir}${SEP}${minerAlias}`;

        return {
            minerAlias,
            tempDir,
            minerDir,
            aliasDir,
        };
    },


    writeReport(version: string, minerAlias: string, dlUrl:string, aliasDir: string, minerDir: string, setAsDefaultAlias: boolean=false): void {
        // Alias report
        const aliasReport = {
            name: this.minerName,
            alias: minerAlias,
            version: version,
            installDate: new Date,
            installUrl: dlUrl,
        };
        fs.writeFileSync(`${aliasDir}/freeminingMinerAlias.json`, JSON.stringify(aliasReport, null, 4));


        // Miner report
        let minerReport: any = {
            name: this.minerName,
            title: this.minerTitle,
            lastVersion: version,
            defaultAlias: minerAlias,
        };
        if (fs.existsSync(`${minerDir}/freeminingMiner.json`)) {
            const reportJson = fs.readFileSync(`${minerDir}/freeminingMiner.json`).toString();
            minerReport = JSON.parse(reportJson);
        }
        if (! minerReport.versions) {
            minerReport.versions = {};
        }
        if (version > minerReport.lastVersion) {
            minerReport.lastVersion = version;
        }
        if (setAsDefaultAlias) {
            minerReport.defaultAlias = minerAlias;
        }
        minerReport.versions[minerAlias] = aliasReport;
        fs.writeFileSync(`${minerDir}/freeminingMiner.json`, JSON.stringify(minerReport, null, 4));
    },


    async downloadFile(dlUrl: string, dlFilePath: string): Promise<void> {
        console.log(`${now()} [INFO] [RIG] Downloading file ${dlUrl}`);
        await downloadFile(dlUrl, dlFilePath);
        console.log(`${now()} [INFO] [RIG] Download complete`);
    },


    async extractFile(tempDir: string, dlFilePath: string): Promise<void> {
        fs.mkdirSync(`${tempDir}${SEP}unzipped`);

        console.log(`${now()} [INFO] [RIG] Extracting file ${dlFilePath}`);
        await decompressFile(dlFilePath, `${tempDir}${SEP}unzipped`);
        console.log(`${now()} [INFO] [RIG] Extract complete`);
    }
};



export const minerCommands: t.minerCommandInfos = {
    apiPort: -1,
    command: '',
    managed: false,


    getCommandFile(config, params) {
        return this.command + (os.platform() === 'win32' ? '.exe' : '');
    },


    getCommandArgs(config, params) {
        // EXTENDS ME
        return [];
    },


    async getInfos(config, params) {
        // EXTENDS ME

        const uptime = 0;
        const algo = '';
        const poolUrl = '';
        const poolUser = '';
        const worker = '';
        const hashRate = 0;
        const cpus: any[] = [];
        const gpus: any[] = [];

        let infos: t.MinerStats = {
            miner: {
                name: '',
                worker,
                uptime,
                algo,
                hashRate,
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


