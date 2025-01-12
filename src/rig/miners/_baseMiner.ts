
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';

import { now, getOpt, downloadFile } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';

import type *  as t from '../../common/types';


// https://docs.google.com/spreadsheets/d/1IjCImtz4bPQbOoj5_QpQw6kVCPL71a7ncrY9YMS2haA/edit#gid=1761756353 - config overclocking

// https://github.com/minershive/hive-pooltemplates/tree/master/miners - config miners algos + pools configs


/* ########## MAIN ######### */

const SEP = path.sep;

type MinerApiResponse = any; // extends me


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

        let version = releaseInfos.tag_name || '';
        if (version.startsWith('v')) {
            version = version.slice(1);
        }

        return version;
    },

    async getAllVersions(): Promise<string[]> {
        if (! this.github) return [];

        const url = `https://api.github.com/repos/${this.github}/releases`;
        const response = await fetch(url);
        const releaseVersions: any = await response.json().catch((err: any) => null);

        if (! releaseVersions || ! Array.isArray(releaseVersions)) {
            return [];
        }

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


    uninstall(minerAlias: string, minerDir: string): void {
        if (! fs.existsSync(`${minerDir}/freeminingMiner.json`)) {
            throw new Error('missing freeminingMiner.json');
        }

        const reportJson = fs.readFileSync(`${minerDir}/freeminingMiner.json`).toString();
        const minerReport = JSON.parse(reportJson);

        delete minerReport.versions[minerAlias];

        const versionsList = Object.values(minerReport.versions) as {name: string, alias: string, version: string, installDate: string, installUrl: string}[];

        if (versionsList.length === 0) {
            fs.rmSync(minerDir, { recursive: true });
            return;
        }

        if (minerReport.defaultAlias === minerAlias) {
            const lastAlias = versionsList.at(-1)?.alias || '';
            minerReport.defaultAlias = lastAlias;
        }

        fs.writeFileSync(`${minerDir}/freeminingMiner.json`, JSON.stringify(minerReport, null, 4));
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
    },

    mapApiResponse(apiResponse: MinerApiResponse, mapping: {[key: string]: any}): t.MinerStats {
        const result: any = {};

        for (const key1 in mapping) {
            const value1 = mapping[key1] as {[key: string]: any};

            result[key1] = result[key1] || {};

            for (const [key2, value2] of Object.entries(value1)) {
                if (typeof value2 === 'string') {
                    // Accéder à la valeur dans l'API avec une clé simple
                    //result[key1][key2] = apiResponse[value2];
                    result[key1][key2] = mapping[key1][key2];

                } else if (typeof value2 === 'object' && value2?.path) {
                    // Parcourir un chemin dans l'objet
                    const pathParts = value2.path.split('.');
                    let current = apiResponse;

                    for (const part of pathParts) {
                        if (current && current[part] !== undefined) {
                            current = current[part];
                        } else {
                            current = undefined;
                            break;
                        }
                    }
                    result[key1][key2] = current !== undefined ? current : value2.default;

                } else if (typeof value2 === 'object') {
                    result[key1][key2] = mapping[key1][key2];

                } else if (typeof value2 === 'function') {
                    // Appliquer une fonction custom
                    result[key1][key2] = value2(apiResponse);
                }
            }
        }

        return result as t.MinerStats;
    }

};


