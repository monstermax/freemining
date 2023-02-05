
import fs from 'fs';
import path from 'path';
import os from 'os';

import { now, hasOpt, getOpt, downloadFile } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';
import * as baseFullnode from './_baseFullnode';


import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website : 
Github  : https://github.com/btcsuite/btcd/
Download: https://github.com/btcsuite/btcd/releases


- https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-linux-amd64-v${version}.tar.gz
- 
- 
- 

*/
/* ########## CONFIG ######### */

const fullnodeName      = 'btcd';
const fullnodeTitle     = 'Bitcoin BTCd';
const github            = 'btcsuite/btcd';
const lastVersion       = '0.23.3';

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
        // install bitcoincore from bitcoincore.org OR bitcoin.org
        const platform = getOpt('--platform', config._args) || os.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
        const setAsDefaultAlias = params.default || false;

        let version = params.version || this.lastVersion;
        let subDir = `${SEP}btcd-${platform}-amd64-v${version}`;

        if (platform === 'win32') subDir = `${SEP}btcd-windows-amd64-v${version}`;

        // Download url selection
        let dlUrls: any = {
            'linux':   `https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-linux-amd64-v${version}.tar.gz`,
            'win32':   `https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-windows-amd64-v${version}.zip`,
            'darwin':  `https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-darwin-amd64-v${version}.tar.gz`,
            'freebsd': `https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-freebsd-amd64-v${version}.tar.gz`,
        }

        let dlUrl = dlUrls[platform] || '';

        if (dlUrl === 'edit-me') throw { message: `No installation script available for the platform ${platform}` };

        // Some common install options
        const {  fullnodeAlias, tempDir, fullnodeDir, aliasDir } = this.getInstallOptions(config, params, version);


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
        this.writeReport(version, fullnodeAlias, dlUrl, aliasDir, fullnodeDir, setAsDefaultAlias);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`${now()} [INFO] [NODE] Install complete into ${aliasDir}`);
    },

};




export const fullnodeCommands: t.fullnodeCommandInfos = {
    ...baseFullnode.fullnodeCommands,

    p2pPort: -1, // edit-me // default = 
    rpcPort: -1, // edit-me // default = 
    command: 'btcd', // the filename of the executable (without .exe extension)
    managed: false, // set true when the getInfos() script is ready


    getCommandArgs(config, params) {
        const args: string[] = [
            //`-EDIT-ME-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
        ];

        if (this.p2pPort > 0) {
            //args.push( `-server` );
            //args.push( `-port=${this.p2pPort.toString()}` );
        }

        if (this.rpcPort !== -1) {
            //args.push( `-rpcport=${this.rpcPort.toString()}` );
            //args.push( `-rpcbind=0.0.0.0` );
            //args.push( `-rpcuser=user` );
            //args.push( `-rpcpassword=pass` );
            //args.push( `-rpcallowip=127.0.0.1` );
        }

        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }

        return args;
    },


    async getInfos(config, params) {
        const apiUrl = `http://127.0.0.1:${this.rpcPort}`;
        const headers: any = {};

        // TODO: RPC REQUEST

        //const fullnodeSummaryRes = await fetch(`${apiUrl}/`, {headers}); // EDIT API URL
        //const fullnodeSummary: any = await fullnodeSummaryRes.json();

        // EDIT THESE VALUES - START //
        const fullnodeName = 'edit-me';
        const coin = 'edit-me';
        const blocks = -1; // edit-me
        const blockHeaders = -1; // edit-me
        const peers = -1; // edit-me
        // EDIT THESE VALUES - END //

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
    }
};


