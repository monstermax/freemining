
import fs from 'fs';
import path from 'path';
import os from 'os';


import { now, getOpt, downloadFile } from '../../common/utils';
import * as baseFullnode from './_baseFullnode';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website  : https://dynexcoin.org/
Github   : https://github.com/dynexcoin/Dynex
Download : https://github.com/dynexcoin/Dynex/releases

requirements:
 sudo apt-get install libboost-all-dev libcurl4-openssl-dev
 sudo apt-get install libevent-dev python3-zmq python3-dev libboost-python-dev libboost-system-dev libboost-filesystem-dev libboost-test-dev libboost-thread-dev libminiupnpc-dev libzmq3-dev

*/
/* ########## CONFIG ######### */

const fullnodeName  = 'dynex';
const fullnodeTitle = 'Dynex';
const github        = 'dynexcoin/Dynex';
const lastVersion   = '2.2.2';
const versionLinux  = 'a518f5c';
const versionDarwin = '93222e3';

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
        let subDir = `${SEP}Dynex-main-*`;

        if (platform === 'linux') subDir = `${SEP}Dynex-main-${versionLinux}`;
        if (platform === 'win32') subDir = ``; // none
        if (platform === 'darwin') subDir = `${SEP}Dynex-main-${versionDarwin}`;

        if (! fullnodeName)  throw { message: `Install script not completed` };
        if (! fullnodeTitle) throw { message: `Install script not completed` };
        if (! lastVersion)   throw { message: `Install script not completed` };

        let installFileName = 'dynexd';

        if (platform === 'win32') {
            installFileName = 'dynexd.exe';
        }

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/dynexcoin/Dynex/releases/download/Dynex_${version}/Dynex-main-${versionLinux}-ubuntu-22.04-linux-x64-nocona.zip`,
            'win32':   `https://github.com/dynexcoin/Dynex/releases/download/Dynex_${version}/Dynex_v${version}_windows.7z`,
            'darwin':  `https://github.com/dynexcoin/Dynex/releases/download/Dynex_${version}/Dynex-main-${versionDarwin}-macos-12.zip`,
            'freebsd': ``,
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
        //fs.renameSync( `${tempDir}${SEP}unzipped${subDir}${SEP}`, aliasDir);
        fs.cpSync( `${tempDir}${SEP}unzipped${subDir}${SEP}`, `${aliasDir}${SEP}`, { recursive: true } );
        fs.chmodSync(`${aliasDir}/${installFileName}`, 0o755);

        // Write report files
        this.writeReport(version, fullnodeAlias, dlUrl, aliasDir, fullnodeDir, setAsDefaultAlias);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`${now()} [INFO] [NODE] Install complete into ${aliasDir}`);
    }
};



export const fullnodeCommands: t.fullnodeCommandInfos = {
    ...baseFullnode.fullnodeCommands,

    p2pPort: 17336, // default = 17336
    rpcPort: 18333, // default = 18333
    command: 'dynexd',
    managed: false, // set true when the getInfos() script is ready


    getCommandArgs(config, params) {
        const args: string[] = [
            `-edit-me-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
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


