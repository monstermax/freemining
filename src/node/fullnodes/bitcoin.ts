
import fs from 'fs';
import path from 'path';
import os from 'os';

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

        if (! fullnodeName)  throw { message: `Install script not completed` };
        if (! fullnodeTitle) throw { message: `Install script not completed` };
        if (! lastVersion)   throw { message: `Install script not completed` };

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
    managed: true,


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
        // RPC REQUESTS

        const getblockchaininfo: any = await this.rpcRequest(fullnodeName, 'getblockchaininfo', []) || {};
        const getnetworkinfo: any = await this.rpcRequest(fullnodeName, 'getnetworkinfo', []) || {};
        const getwalletinfo: any = {}; //await this.rpcRequest(fullnodeName, 'getwalletinfo', []); // requires -rpcwallet=...
        const getaddressesbylabel: any = {}; //await this.rpcRequest(fullnodeName, 'getaddressesbylabel', ['']); // requires -rpcwallet=...

        // EDIT THESE VALUES - START //
        const coin = 'BTC';

        const blocks = Number(getblockchaininfo.blocks);
        const blockHeaders = Number(getblockchaininfo.headers);
        const bestBlockHash = getblockchaininfo.bestblockhash || '-';
        const bestBlockTime = Number(getblockchaininfo.time);
        const sizeOnDisk = Number(getblockchaininfo.size_on_disk);
        const peers = Number(getnetworkinfo.connections);

        const walletAddress = Object.keys(getaddressesbylabel || {}).shift() || '-';
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


bitcoin-cli -rpcuser=user -rpcpassword=pass help

bitcoin-cli -rpcuser=user -rpcpassword=pass loadwallet $HOME/.freemining-beta/data/node/fullnodes/bitcoin/fullnode
bitcoin-cli -rpcuser=user -rpcpassword=pass getwalletinfo
bitcoin-cli -rpcwallet=$HOME/.freemining-beta/data/node/fullnodes/bitcoin/fullnode/wallet.dat getwalletinfo => KO: Requested wallet does not exist or is not loaded
bitcoin-cli -rpcwallet=$HOME/.freemining-beta/data/node/fullnodes/bitcoin/fullnode/wallet.dat getaddressesbylabel => KO: Requested wallet does not exist or is not loaded
bitcoin-cli -rpcuser=user -rpcpassword=pass dumpprivkey $ADDRESS

curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "createwallet", "params": {"wallet_name": "fullnode", "avoid_reuse": true, "descriptors": false, "load_on_startup": true}}' -H 'content-type: text/plain;' http://127.0.0.1:8332/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getwalletinfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8332/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getaddressesbylabel", "params": [""]}' -H 'content-type: text/plain;' http://127.0.0.1:8332/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getnewaddress", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8332/

curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getblockchaininfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8332/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getnetworkinfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8332/

*/

