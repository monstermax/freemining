
import fs from 'fs';
import path from 'path';
import os from 'os';


import { now, getOpt, downloadFile } from '../../common/utils';
import * as baseFullnode from './_baseFullnode';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website  : 
Github   : https://github.com/Raptor3um/raptoreum
Download : https://github.com/Raptor3um/raptoreum/releases

*/
/* ########## CONFIG ######### */

const fullnodeName  = 'raptoreum';
const fullnodeTitle = 'Raptoreum';
const github        = 'Raptor3um/raptoreum';
const lastVersion   = '1.3.17.01';

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
        let subDir = ``; // none

        if (! fullnodeName)  throw { message: `Install script not completed` };
        if (! fullnodeTitle) throw { message: `Install script not completed` };
        if (! lastVersion)   throw { message: `Install script not completed` };

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/Raptor3um/raptoreum/releases/download/${version}/raptoreum-ubuntu20-${version}.tar.gz`,
            'win32':   `https://github.com/Raptor3um/raptoreum/releases/download/${version}/raptoreum-win-${version}.zip`,
            'darwin':  `https://github.com/Raptor3um/raptoreum/releases/download/${version}/raptoreum-macos-${version}.tar.gz`,
            'freebsd': ``,
        }
        let dlUrl = dlUrls[platform] || '';

        if (! dlUrl) throw { message: `No installation script available for the platform ${platform}` };

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

    p2pPort: 10226,
    rpcPort: 10225,
    command: 'raptoreumd',
    managed: true,


    getCommandArgs(config, params) {
        const args: string[] = [
            `-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
            `-printtoconsole`,
            //`-zmqpubrawblock=tcp://127.0.0.1:20225`,
            //`-zmqpubrawtx=tcp://127.0.0.1:20226`,
        ];

        if (this.p2pPort > 0) {
            args.push( `-server` );
            args.push( `-port=${this.p2pPort.toString()}` );
        }

        if (this.rpcPort > 0) {
            args.push( `-rpcport=${this.rpcPort.toString()}` );
            args.push( `-rpcbind=0.0.0.0` );
            args.push( `-rpcuser=user` );
            args.push( `-rpcpassword=pass` );
            args.push( `-rpcallowip=127.0.0.1` );
        }

        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }

        return args;
    },


    async getInfos(config, params) {
        // RPC REQUESTS
        const getblockchaininfo: any = await this.rpcRequest(fullnodeName, 'getblockchaininfo', []) || {};
        const getnetworkinfo: any = await this.rpcRequest(fullnodeName, 'getnetworkinfo', []) || {};
        const getwalletinfo: any = await this.rpcRequest(fullnodeName, 'getwalletinfo', []) || {};
        const getaddressesbylabel: any = await this.rpcRequest(fullnodeName, 'getaddressesbylabel', ['fullnode']) || {};
        //const getaccountaddress: any = await this.rpcRequest(fullnodeName, 'getaccountaddress', ['']) || ''; // method deprecated
        let getaccountaddress = '';

        if (getaddressesbylabel) {
            getaccountaddress = Object.keys(getaddressesbylabel).pop() || '';

        } else {
            getaccountaddress = await this.rpcRequest(fullnodeName, 'getnewaddress', ['fullnode']) || {};
        }

        // EDIT THESE VALUES - START //
        const coin = 'RTM';

        const blocks = Number(getblockchaininfo.blocks);
        const blockHeaders = Number(getblockchaininfo.headers);
        const bestBlockHash = getblockchaininfo.bestblockhash || '-';
        const bestBlockTime = Number(getblockchaininfo.mediantime);
        const sizeOnDisk = Number(getblockchaininfo.size_on_disk);
        const peers = Number(getnetworkinfo.connections);

        const walletAddress = getaccountaddress || '-';
        const walletBalance = Number(getwalletinfo.balance);
        const walletTxCount = Number(getwalletinfo.txcount);
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



/*

raptoreum-cli -rpcuser=user -rpcpassword=pass getwalletinfo
raptoreum-cli -rpcuser=user -rpcpassword=pass getrawchangeaddress => RGNqQftC43xKmyPEV2Dyb9treztY5a6JFy
raptoreum-cli -rpcuser=user -rpcpassword=pass dumpwallet /tmp/wall.tmp
raptoreum-cli -rpcuser=user -rpcpassword=pass dumpprivkey RGNqQftC43xKmyPEV2Dyb9treztY5a6JFy
raptoreum-cli -rpcuser=user -rpcpassword=pass getnewaddress fullnode => RAv7soKof4nE1fmF4bywGPYrRXDaDTptsj
raptoreum-cli -rpcuser=user -rpcpassword=pass dumpprivkey RAv7soKof4nE1fmF4bywGPYrRXDaDTptsj
raptoreum-cli -rpcuser=user -rpcpassword=pass getaddressesbylabel fullnode => { "RAv7soKof4nE1fmF4bywGPYrRXDaDTptsj": { purpose: "receive" } }

*/
