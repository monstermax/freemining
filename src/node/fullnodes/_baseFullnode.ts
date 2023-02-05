
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';
const RpcClient = require("rpc-client");

import { now, getOpt, downloadFile } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';

import type *  as t from '../../common/types';


/* ########## MAIN ######### */

const SEP = path.sep;


/* ########## FUNCTIONS ######### */

export const fullnodeInstall: t.fullnodeInstallInfos = {
    fullnodeName: '',
    fullnodeTitle: '',
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
        const fullnodeAlias: string = params.alias || `${this.fullnodeName}-${version}`;
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `frm-tmp.fullnode-install-${this.fullnodeName}-${fullnodeAlias}-`), {});
        const fullnodeDir = `${config?.appDir}${SEP}node${SEP}fullnodes${SEP}${this.fullnodeName}`
        const aliasDir = `${fullnodeDir}${SEP}${fullnodeAlias}`;

        return {
            fullnodeAlias,
            tempDir,
            fullnodeDir,
            aliasDir,
        };
    },


    writeReport(version: string, fullnodeAlias: string, dlUrl:string, aliasDir: string, fullnodeDir: string, setAsDefaultAlias: boolean=false): void {
        // Alias report
        const aliasReport = {
            name: this.fullnodeName,
            alias: fullnodeAlias,
            version: version,
            installDate: new Date,
            installUrl: dlUrl,
        };
        fs.writeFileSync(`${aliasDir}/freeminingFullnodeAlias.json`, JSON.stringify(aliasReport, null, 4));


        // Fullnode report
        let fullnodeReport: any = {
            name: this.fullnodeName,
            title: this.fullnodeTitle,
            lastVersion: version,
            defaultAlias: fullnodeAlias,
        };
        if (fs.existsSync(`${fullnodeDir}/freeminingFullnode.json`)) {
            const reportJson = fs.readFileSync(`${fullnodeDir}/freeminingFullnode.json`).toString();
            fullnodeReport = JSON.parse(reportJson);
        }
        if (! fullnodeReport.versions) {
            fullnodeReport.versions = {};
        }
        if (version > fullnodeReport.lastVersion) {
            fullnodeReport.lastVersion = version;
        }
        if (setAsDefaultAlias) {
            fullnodeReport.defaultAlias = fullnodeAlias;
        }
        fullnodeReport.versions[fullnodeAlias] = aliasReport;
        fs.writeFileSync(`${fullnodeDir}/freeminingFullnode.json`, JSON.stringify(fullnodeReport, null, 4));
    },

    async downloadFile(dlUrl: string, dlFilePath: string): Promise<void> {
        console.log(`${now()} [INFO] [NODE] Downloading file ${dlUrl}`);
        await downloadFile(dlUrl, dlFilePath);
        console.log(`${now()} [INFO] [NODE] Download complete`);
    },

    async extractFile(tempDir: string, dlFilePath: string): Promise<void> {
        fs.mkdirSync(`${tempDir}${SEP}unzipped`);

        console.log(`${now()} [INFO] [NODE] Extracting file ${dlFilePath}`);
        await decompressFile(dlFilePath, `${tempDir}${SEP}unzipped`);
        console.log(`${now()} [INFO] [NODE] Extract complete`);
    }
};


export const fullnodeCommands: t.fullnodeCommandInfos = {
    p2pPort: -1,
    rpcPort: -1,
    command: '', // the filename of the executable (without .exe extension)
    managed: false, // set true when the getInfos() script is ready


    getCommandFile(config, params) {
        return this.command + (os.platform() === 'linux' ? '' : '.exe');
    },


    getCommandArgs(config, params) {
        // EXTENDS ME
        return [];
    },


    async getInfos(config, params) {
        // EXTENDS ME

        const fullnodeName = '';
        const coin = '';
        const blocks = -1;
        const blockHeaders = -1;
        const peers = -1;

        let infos: t.FullnodeStats = {
            fullnode: {
                name: fullnodeName,
                coin,
            },
            blockchain: {
                blocks,
                headers: blockHeaders,
                peers,
            },
        };

        return infos;
    },


    async rpcRequest(fullnodeName: string, method: string, params: any) {
        const rpcClient = new RpcClient({
            host: "127.0.0.1",
            port: this.rpcPort,
            protocol: "http",
        });
        rpcClient.setBasicAuth("user", "pass");

        return new Promise((resolve, reject) => {
            rpcClient.call(method, params, function(err: any, result: any){
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });

        }).catch((err: any) => {
            console.warn(`${now()} [WARNING] [NODE] Cannot get ${method} ${fullnodeName} : ${err.message}`);
        });
    }
};


