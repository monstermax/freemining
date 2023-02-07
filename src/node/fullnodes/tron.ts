
import fs from 'fs';
import path from 'path';
import os from 'os';


import { now, getOpt, downloadFile } from '../../common/utils';
import * as baseFullnode from './_baseFullnode';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website  : 
Github   : https://github.com/tronprotocol/java-tron
Download : https://github.com/tronprotocol/java-tron/releases

*/
/* ########## CONFIG ######### */

const fullnodeName  = 'tron';
const fullnodeTitle = 'Tron';
const github        = 'tronprotocol/java-tron';
const lastVersion   = '4.7.0.1';

/* ########## MAIN ######### */

const SEP = path.sep;


/* ########## FUNCTIONS ######### */

export const fullnodeInstall: t.fullnodeInstallInfos = {
    ...baseFullnode.fullnodeInstall,
    fullnodeName,
    fullnodeTitle,
    lastVersion,
    github,


    async install(config, params) {
        const platform = getOpt('--platform', config._args) || os.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
        const setAsDefaultAlias = params.default || false;

        let version = params.version || this.lastVersion;
        let subDir = ``; // no zip

        if (! fullnodeName)  throw { message: `Install script not completed` };
        if (! fullnodeTitle) throw { message: `Install script not completed` };
        if (! lastVersion)   throw { message: `Install script not completed` };

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/tronprotocol/java-tron/releases/download/GreatVoyage-v${version}/FullNode.jar`,
            'win32':   `https://github.com/tronprotocol/java-tron/releases/download/GreatVoyage-v${version}/FullNode.jar`,
            'darwin':  `https://github.com/tronprotocol/java-tron/releases/download/GreatVoyage-v${version}/FullNode.jar`,
            'freebsd': `https://github.com/tronprotocol/java-tron/releases/download/GreatVoyage-v${version}/FullNode.jar`,
        }
        let dlUrl = dlUrls[platform] || '';

        if (dlUrl === '') throw { message: `No installation script available for the platform ${platform}` };

        // Some common install options
        const {  fullnodeAlias, tempDir, fullnodeDir, aliasDir } = this.getInstallOptions(config, params, version);


        // Downloading
        const dlFileName = path.basename(dlUrl);
        const dlFilePath = `${tempDir}${SEP}${dlFileName}`;
        await this.downloadFile(dlUrl, dlFilePath);

        // Extracting
        await this.extractFile(tempDir, dlFilePath);

        // Install to target dir
        fs.rmSync(aliasDir, { recursive: true, force: true });
        fs.mkdirSync(aliasDir, {recursive: true});
        fs.renameSync( dlFilePath, `${aliasDir}${SEP}FullNode.jar`);

        // Write report files
        this.writeReport(version, fullnodeAlias, dlUrl, aliasDir, fullnodeDir, setAsDefaultAlias);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`${now()} [INFO] [NODE] Install complete into ${aliasDir}`);
    }
};



export const fullnodeCommands: t.fullnodeCommandInfos = {
    ...baseFullnode.fullnodeCommands,

    p2pPort: -1, // edit-me
    rpcPort: -1, // edit-me
    command: 'java',
    managed: false, // set true when the getInfos() script is ready


    getCommandArgs(config, params) {
        const fullnodeAlias: string = params.alias || ''; // || fullnodeInstall.dedefaultVersion; // TODO
        const fullnodeDir = `${config?.appDir}${SEP}node${SEP}fullnodes${SEP}${fullnodeName}`
        //const aliasDir = `${fullnodeDir}${SEP}${fullnodeAlias}`;

        const args: string[] = [
            `-Xmx4G`,
            `-jar ${config.appDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}${SEP}${fullnodeAlias}${SEP}FullNode.jar`,
            `--mainnet`,
            `-c`, `${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
        ];

        if (this.p2pPort > 0) {

        }

        if (this.rpcPort > 0) {
            args.push( `-edit-me-rpcport=${this.rpcPort.toString()}` );
        }

        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }

        return args;
    },


    async getInfos(config, params) {
        // TODO: RPC REQUEST

        // EDIT THESE VALUES - START //
        const coin = ''; // edit-me

        const blocks = -1; // edit-me
        const blockHeaders = -1; // edit-me
        const peers = -1; // edit-me
        const bestBlockHash = ''; // edit-me
        const bestBlockTime = -1; // edit-me
        const sizeOnDisk = -1; // edit-me

        const walletAddress = ''; // edit-me
        const walletBalance = -1; // edit-me
        const walletTxCount = -1; // edit-me
        // EDIT THESE VALUES - END //

        let infos: t.FullnodeStats = {
            fullnode: {
                name: fullnodeTitle,
                coin,
            },
            blockchain: {
                blocks,
                headers: blockHeaders,
                bestBlockHash,
                bestBlockTime,
                sizeOnDisk,
                peers,
            },
            wallet: {
                address: walletAddress,
                balance: walletBalance,
                txcount: walletTxCount,
            }
        };

        return infos;
    }
};


