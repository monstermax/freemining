
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

    p2pPort: 8338, // edit-me // default = 8338
    rpcPort: 8339, // edit-me // default = 8339
    command: 'fennecd',
    managed: false, // set true when the getInfos() script is ready


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
        // TODO: RPC REQUEST

        // EDIT THESE VALUES - START //
        const fullnodeName = ''; // edit-me
        const coin = ''; // edit-me
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


