
import fs from 'fs';
import path from 'path';
import os from 'os';


import { now, getOpt, downloadFile } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';
import * as baseFullnode from './_baseFullnode';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website   : https://nexa.org/
Github    : 
Downnload : https://www.bitcoinunlimited.info/nexa/

*/
/* ########## CONFIG ######### */

const fullnodeName  = 'nexa';
const fullnodeTitle = 'Nexa';
const github        = '';
const lastVersion   = '1.1.0.0';

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
        let subDir = `${SEP}nexa-${version}`;

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://www.bitcoinunlimited.info/nexa/1.1.0/nexa-1.1.0-linux64.tar.gz`,
            'win32':   `https://www.bitcoinunlimited.info/nexa/1.1.0/nexa-1.1.0-win64.zip`,
            'darwin':  `https://www.bitcoinunlimited.info/nexa/1.1.0/nexa-1.1.0.0-osx.tar.gz`,
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

    p2pPort: 7228, // default = 7228
    rpcPort: 7227, // default = 7227
    command: 'bin/nexad',
    managed: true,


    getCommandArgs(config, params) {
        const args: string[] = [
            `-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
            `-printtoconsole`,
            //`-zmqpubrawblock=tcp://127.0.0.1:27228`,
            //`-zmqpubrawtx=tcp://127.0.0.1:27228`,
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
        const getblockchaininfo: any = await this.rpcRequest(fullnodeName, 'getblockchaininfo', []);
        const getnetworkinfo: any = await this.rpcRequest(fullnodeName, 'getnetworkinfo', []);
        const getwalletinfo: any = await this.rpcRequest(fullnodeName, 'getwalletinfo', []);
        const getaddressesbylabel: any = null; //await this.rpcRequest(fullnodeName, 'getaddressesbylabel', ['']);


        // EDIT THESE VALUES - START //
        const coin = 'NEXA';
        const blocks = getblockchaininfo.blocks || -1;
        const blockHeaders = getblockchaininfo.headers || -1;
        const bestBlockHash = getblockchaininfo.bestblockhash || '';
        const bestBlockTime = getblockchaininfo.mediantime || -1;
        const sizeOnDisk = getblockchaininfo.size_on_disk || -1;
        const peers = getnetworkinfo.connections || -1;
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
                address: Object.keys(getaddressesbylabel || {}).shift() || '',
                balance: getwalletinfo?.balance || -1,
                txcount: getwalletinfo?.txcount || -1,
            }
        };

        return infos;
    }
};


