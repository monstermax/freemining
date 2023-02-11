
import fs from 'fs';
import path from 'path';
import os from 'os';

import { now, getOpt, downloadFile } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';
import * as baseFullnode from './_baseFullnode';


import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website : https://dogecoin.com/
Github  : https://github.com/dogecoin/dogecoin
Download: https://github.com/dogecoin/dogecoin/releases

*/
/* ########## CONFIG ######### */

const fullnodeName  = 'dogecoin';
const fullnodeTitle = 'Dogecoin';
const github        = 'dogecoin/dogecoin';
const lastVersion   = '1.14.6';

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
        let subDir = `${SEP}dogecoin-${version}`;

        if (! fullnodeName)  throw { message: `Install script not completed` };
        if (! fullnodeTitle) throw { message: `Install script not completed` };
        if (! lastVersion)   throw { message: `Install script not completed` };

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/dogecoin/dogecoin/releases/download/v${version}/dogecoin-${version}-x86_64-linux-gnu.tar.gz`,
            'win32':   `https://github.com/dogecoin/dogecoin/releases/download/v${version}/dogecoin-${version}-win64.zip`,
            'darwin':  ``, // https://github.com/dogecoin/dogecoin/releases/download/v${version}/dogecoin-${version}-osx-signed.dmg
            'freebsd': ``,
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
    }
};




export const fullnodeCommands: t.fullnodeCommandInfos = {
    ...baseFullnode.fullnodeCommands,

    p2pPort: 22556, // default = 22556
    rpcPort: 22555, // default = 22555
    command: 'bin/dogecoind',
    managed: true,


    getCommandArgs(config, params) {
        const args: string[] = [
            `-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
            `-printtoconsole`,
        ];

        if (this.p2pPort > 0) {
            args.push( `-server` );
            args.push( `-port=${this.p2pPort.toString()}` );
        }

        if (this.rpcPort !== -1) {
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
        //const getaddressesbylabel: any = await this.rpcRequest(fullnodeName, 'getaddressesbylabel', ['']); // method not found
        const getaccountaddress: any = await this.rpcRequest(fullnodeName, 'getaccountaddress', ['']) || '';

        // EDIT THESE VALUES - START //
        const coin = 'DOGE';

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

dogecoin-cli -rpcuser=user -rpcpassword=pass help
dogecoin-cli -rpcuser=user -rpcpassword=pass dumpwallet /tmp/wall.tmp

#curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "createwallet", "params": {"wallet_name": "descriptors", "avoid_reuse": true, "descriptors": true, "load_on_startup": true}}' -H 'content-type: text/plain;' http://127.0.0.1:22555/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getwalletinfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:22555/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getaddressesbylabel", "params": [""]}' -H 'content-type: text/plain;' http://127.0.0.1:22555/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getnewaddress", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:22555/

curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getblockchaininfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:22555/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getnetworkinfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:22555/

*/
