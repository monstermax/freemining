
import fs from 'fs';
import path from 'path';
import os from 'os';


import { now, getOpt, downloadFile } from '../../common/utils';
import * as baseFullnode from './_baseFullnode';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website   : 
Github    : https://github.com/kaspanet/kaspad
Downnload : https://github.com/kaspanet/kaspad/releases

*/
/* ########## CONFIG ######### */

const fullnodeName  = 'kaspa';
const fullnodeTitle = 'kaspa';
const github        = 'kaspanet/kaspad';
const lastVersion   = '0.12.11';

/* ########## MAIN ######### */

const SEP = path.sep;


/* ########## FUNCTIONS ######### */

export const fullnodeInstall: t.fullnodeInstallInfos = {
    ...baseFullnode.fullnodeInstall,
    fullnodeName,
    fullnodeTitle,
    //lastVersion,   // uncomment me when install script is ready
    github,


    async install(config, params) {
        const platform = getOpt('--platform', config._args) || os.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
        const setAsDefaultAlias = params.default || false;

        let version = params.version || this.lastVersion;
        let subDir = ``; // none

        // Download url selection
        const dlUrls: any = {
            'linux':   `https://github.com/kaspanet/kaspad/releases/download/v${version}/kaspad-v${version}-linux.zip`,
            'win32':   `https://github.com/kaspanet/kaspad/releases/download/v${version}/kaspad-v${version}-win64.zip`,
            'darwin':  `https://github.com/kaspanet/kaspad/releases/download/v${version}/kaspad-v${version}-osx.zip`,
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
        if (platform === 'win32') {
            fs.mkdirSync(`${aliasDir}/bin`, {recursive: true} );
            fs.renameSync(`${tempDir}${SEP}unzipped${subDir}${SEP}`, `${aliasDir}/bin`);

        } else {
            fs.renameSync(`${tempDir}${SEP}unzipped${subDir}${SEP}`, aliasDir);
        }

        // Write report files
        this.writeReport(version, fullnodeAlias, dlUrl, aliasDir, fullnodeDir, setAsDefaultAlias);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`${now()} [INFO] [NODE] Install complete into ${aliasDir}`);
    }
};



export const fullnodeCommands: t.fullnodeCommandInfos = {
    ...baseFullnode.fullnodeCommands,

    p2pPort: -1, // edit-me
    rpcPort: -1, // edit-me
    command: 'bin/kaspad',
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


