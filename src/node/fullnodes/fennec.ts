
import fs from 'fs';
import path from 'path';
import os from 'os';


import { now, getOpt, downloadFile } from '../../common/utils';
import { decompressFile } from '../../common/decompress_archive';
import * as baseFullnode from './_baseFullnode';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website   : https://www.fennecblockchain.com/
Github    : https://github.com/FennecBlockchain/Fennec
Downnload : https://github.com/FennecBlockchain/Fennec/releases

*/
/* ########## CONFIG ######### */

const fullnodeName  = 'fennec';
const fullnodeTitle = 'Fennec';
const github        = 'FennecBlockchain/Fennec';
const lastVersion   = '1.0.3';

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
            'linux':   `https://github.com/FennecBlockchain/Fennec/releases/download/v${version}/Fennec-Linux.tar.gz`,
            'win32':   `https://github.com/FennecBlockchain/Fennec/releases/download/v${version}/Fennec-Win.zip`,
            'darwin':  ``,
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

    p2pPort: 8338, // default = 8338
    rpcPort: 8339, // default = 8339
    command: 'fennecd',
    managed: true,


    getCommandArgs(config, params) {
        const args: string[] = [
            `-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
            `-printtoconsole`,
            `-maxmempool=100`,
            //`-zmqpubrawblock=tcp://127.0.0.1:28339`,
            //`-zmqpubrawtx=tcp://127.0.0.1:28338`,
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
        const getaddressesbylabel: any = await this.rpcRequest(fullnodeName, 'getaddressesbylabel', ['']) || {};
        //const getaccountaddress: any = await this.rpcRequest(fullnodeName, 'getaccountaddress', ['']) || ''; // method not found

        // EDIT THESE VALUES - START //
        const coin = 'FNNC';

        const blocks = getblockchaininfo.blocks || -1;
        const blockHeaders = getblockchaininfo.headers || -1;
        const bestBlockHash = getblockchaininfo.bestblockhash || '';
        const bestBlockTime = getblockchaininfo.mediantime || -1;
        const sizeOnDisk = getblockchaininfo.size_on_disk || -1;
        const peers = getnetworkinfo.connections || -1;

        const walletAddress = Object.keys(getaddressesbylabel || {}).shift() || '';
        const walletBalance = getwalletinfo?.balance || -1;
        const walletTxCount = getwalletinfo?.txcount || -1;
        // EDIT THESE VALUES - END //

        let infos: t.FullnodeStats = {
            fullnode: {
                name: fullnodeName,
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


fennec-cli -rpcuser=user -rpcpassword=pass help
fennec-cli -rpcuser=user -rpcpassword=pass dumpwallet /tmp/wall.tmp

#curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "createwallet", "params": {"wallet_name": "fullnode", "avoid_reuse": true, "descriptors": false, "load_on_startup": true}}' -H 'content-type: text/plain;' http://127.0.0.1:8339/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getwalletinfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8339/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getaddressesbylabel", "params": [""]}' -H 'content-type: text/plain;' http://127.0.0.1:8339/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getnewaddress", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8339/

curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getblockchaininfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8339/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getnetworkinfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8339/

*/

