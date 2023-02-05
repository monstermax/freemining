
import fs from 'fs';
import path from 'path';
import os from 'os';
const RpcClient = require("rpc-client");

import { now, hasOpt, getOpt, downloadFile } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';
import * as baseFullnode from './_baseFullnode';


import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website : https://bitcoincore.org/
Github  : https://github.com/bitcoin/bitcoin
Download: https://bitcoincore.org/en/download/
Download: https://bitcoin.org/en/download

*/
/* ########## CONFIG ######### */

const fullnodeName      = 'bitcoin';
const fullnodeTitle     = 'Bitcoin';
const github            = ''; // bitcoin/bitcoin
const lastVersion       = '24.0.1'; // for bitcoincore.org
const versionBitcoinOrg = '22.0';   // for bitcoin.org

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
        let subDir = `${SEP}bitcoin-${version}`;

        // Download url selection
        let dlUrls: any = {
            'linux':   `https://bitcoincore.org/bin/bitcoin-core-${version}/bitcoin-${version}-x86_64-linux-gnu.tar.gz`,
            'win32':   `https://bitcoincore.org/bin/bitcoin-core-${version}/bitcoin-${version}-win64.zip`,
            'darwin':  `https://bitcoincore.org/bin/bitcoin-core-${version}/bitcoin-${version}-x86_64-apple-darwin.tar.gz`,
            'freebsd': ``,
        }

        if (hasOpt('--bitcoin.org')) {
            version = params.version || versionBitcoinOrg;

            dlUrls = {
                'linux':   `https://bitcoin.org/bin/bitcoin-core-${version}/bitcoin-${version}-x86_64-linux-gnu.tar.gz`,
                'win32':   `https://bitcoin.org/bin/bitcoin-core-${version}/bitcoin-${version}-win64.zip`,
                'darwin':  `https://bitcoin.org/bin/bitcoin-core-${version}/bitcoin-${version}-osx64.tar.gz`,
                'freebsd': ``,
            }
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


    async getLastVersion(): Promise<string> {
        if (hasOpt('--bitcoin.org')) {
            return baseFullnode.fullnodeInstall.getLastVersion();
        }

        // no script available for bitcoincore.org => TODO
        return '';
    }

};




export const fullnodeCommands: t.fullnodeCommandInfos = {
    ...baseFullnode.fullnodeCommands,

    p2pPort: 8333, // default = 8333
    rpcPort: 8332, // default = 8332
    command: 'bin/bitcoind', // the filename of the executable (without .exe extension)
    managed: true, // set true when the getInfos() script is ready


    getCommandArgs(config, params) {
        const args: string[] = [
            `-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
            `-printtoconsole`,
            `-maxmempool=100`,
            `-zmqpubrawblock=tcp://127.0.0.1:28332`,
            `-zmqpubrawtx=tcp://127.0.0.1:28333`,
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
        // RPC REQUEST
        // curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getblockchaininfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8332/
        // curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getnetworkinfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8332/

        const rpcClient = new RpcClient( { host:"127.0.0.1", port:this.rpcPort, protocol:"http" } );
        rpcClient.setBasicAuth("user", "pass");

        const getblockchaininfo: any = await new Promise((resolve, reject) => {
            rpcClient.call("getblockchaininfo", [], function(err: any, result: any){
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });

        }).catch((err: any) => {
            console.warn(`${now()} [WARNING] [NODE] Cannot get getblockchaininfo ${fullnodeName} : ${err.message}`);
        });

        const getnetworkinfo: any = await new Promise((resolve, reject) => {
            rpcClient.call("getnetworkinfo", [], function(err: any, result: any){
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });

        }).catch((err: any) => {
            console.warn(`${now()} [WARNING] [NODE] Cannot get getnetworkinfo ${fullnodeName} : ${err.message}`);
        });

        // EDIT THESE VALUES - START //
        const coin = 'BTC';
        const blocks = getblockchaininfo.blocks || -1;
        const blockHeaders = getblockchaininfo.headers || -1;
        const bestBlockHash = getblockchaininfo.bestblockhash || '';
        const bestBlockTime = getblockchaininfo.time || -1;
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
        };

        return infos;
    }
};


