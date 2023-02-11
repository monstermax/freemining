
import fs from 'fs';
import path from 'path';
import os from 'os';


import { now, getOpt, downloadFile } from '../../common/utils';
import * as baseFullnode from './_baseFullnode';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website  : https://www.getmonero.org
Github   : https://github.com/monero-project/monero
Download : https://www.getmonero.org/downloads/

*/
/* ########## CONFIG ######### */

const fullnodeName  = 'monero';
const fullnodeTitle = 'Monero';
const github        = ''; // monero-project/monero
const lastVersion   = '0.18.1.2'; // 0.18.1.2

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
        let subDir = `${SEP}monero-x86_64-*-v${version}`;

        if (platform === 'win32') subDir   = `${SEP}monero-x86_64-w64-mingw32-v${version}`;
        if (platform === 'linux') subDir   = `${SEP}monero-x86_64-linux-gnu-v${version}`;
        if (platform === 'darwin') subDir  = `${SEP}monero-x86_64-apple-darwin11-v${version}`;
        if (platform === 'freebsd') subDir = `${SEP}monero-x86_64-unknown-freebsd-v${version}`;

        if (! fullnodeName)  throw { message: `Install script not completed` };
        if (! fullnodeTitle) throw { message: `Install script not completed` };
        if (! lastVersion)   throw { message: `Install script not completed` };

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://downloads.getmonero.org/cli/linux64`,
            'win32':   `https://downloads.getmonero.org/cli/win64`,
            'darwin':  `https://downloads.getmonero.org/cli/mac64`,
            'freebsd': `https://downloads.getmonero.org/cli/freebsd64`,
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
        fs.mkdirSync(aliasDir, {recursive: true});
        fs.rmSync(aliasDir, { recursive: true, force: true });
        fs.renameSync( `${tempDir}${SEP}unzipped${subDir}${SEP}`, aliasDir);

        // Write report files
        this.writeReport(version, fullnodeAlias, dlUrl, aliasDir, fullnodeDir, setAsDefaultAlias);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`${now()} [INFO] [NODE] Install complete into ${aliasDir}`);
    }
};



export const fullnodeCommands: t.fullnodeCommandInfos = {
    ...baseFullnode.fullnodeCommands,

    p2pPort: 18080, // default = 18080
    rpcPort: 18081, // default = 18081
    command: 'monerod', // the filename of the executable (without .exe extension)
    managed: false, // set true when the getInfos() script is ready


    getCommandArgs(config, params) {
        const args: string[] = [
            `--data-dir`, `${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
            `--non-interactive`,
        ];

        if (this.p2pPort > 0) {
            args.push( `--p2p-bind-ip` );
            args.push( `127.0.0.1` );
            args.push( `--p2p-bind-port` );
            args.push( `${this.p2pPort}` );
        }

        if (this.rpcPort > 0) {
            args.push( `--rpc-bind-ip` );
            args.push( `127.0.0.1` );
            args.push( `--rpc-bind-port` );
            args.push( `${this.rpcPort}` );
            args.push( `--rpc-login` );
            args.push( `user:pass` );
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


