
import fs from 'fs';
import path from 'path';
import os from 'os';
import tar from 'tar';
import * as baseFullnode from './_baseFullnode';

import admZip from 'adm-zip'; //

import { now, hasOpt, getOpt, downloadFile } from '../../common/utils';

import type *  as t from '../../common/types';


/* ########## DESCRIPTION ######### */
/*

Website : https://bitcoincore.org/
Github  : https://github.com/bitcoin/bitcoin
Download: https://bitcoincore.org/en/download/
Download: https://bitcoin.org/en/download

Alternative: btcd
=================
Github  : https://github.com/btcsuite/btcd/
Download: https://github.com/btcsuite/btcd/releases
version : 0.23.3
- https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-linux-amd64-v${version}.tar.gz
- https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-windows-amd64-v${version}.zip
- https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-darwin-amd64-v${version}.tar.gz
- https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-freebsd-amd64-v${version}.tar.gz

*/
/* ########## MAIN ######### */

const SEP = path.sep;


/* ########## FUNCTIONS ######### */

export const fullnodeInstall: t.fullnodeInstallInfos = {
    ...baseFullnode.fullnodeInstall,

    version: '24.0.1',
    versionBitcoinOrg: '22.0',

    async install(config, params) {
        // install bitcoincore from bitcoincore.org OR bitcoin.org
        const targetAlias: string = params.alias || params.fullnode;
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `frm-tmp.fullnode-install-${params.fullnode}-${targetAlias}-`), {});
        const targetDir = `${config?.appDir}${SEP}node${SEP}fullnodes${SEP}${targetAlias}`
        let version = params.version || this.version;

        if (hasOpt('--bitcoin.org')) {
            version = params.version || this.versionBitcoinOrg;
        }

        let subDir = `${SEP}bitcoin-${version}`;

        const platform = getOpt('--platform', config._args) || os.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
        let dlUrl: string;

        if (platform === 'linux') {
            if (hasOpt('--bitcoin.org')) {
                dlUrl = `https://bitcoin.org/bin/bitcoin-core-${version}/bitcoin-${version}-x86_64-linux-gnu.tar.gz`;

            } else {
                dlUrl = `https://bitcoincore.org/bin/bitcoin-core-${version}/bitcoin-${version}-x86_64-linux-gnu.tar.gz`;
            }

        } else if (platform === 'win32') {
            if (hasOpt('--bitcoin.org')) {
                dlUrl = `https://bitcoin.org/bin/bitcoin-core-${version}/bitcoin-${version}-win64.zip`;

            } else {
                dlUrl = `https://bitcoincore.org/bin/bitcoin-core-${version}/bitcoin-${version}-win64.zip`;
            }

        } else if (platform === 'darwin') {
            if (hasOpt('--bitcoin.org')) {
                dlUrl = `https://bitcoin.org/bin/bitcoin-core-${version}/bitcoin-${version}-osx64.tar.gz`;

            } else {
                dlUrl = `https://bitcoincore.org/bin/bitcoin-core-${version}/bitcoin-${version}-x86_64-apple-darwin.tar.gz`;
            }

        } else {
            throw { message: `No installation script available for the platform ${platform}` };
        }

        if (dlUrl === 'edit-me') throw { message: `No installation script available for the platform ${platform}` };

        // Downloading
        const dlFileName = path.basename(dlUrl);
        const dlFilePath = `${tempDir}${SEP}${dlFileName}`;
        console.log(`${now()} [INFO] [NODE] Downloading file ${dlUrl}`);
        await downloadFile(dlUrl, dlFilePath);
        console.log(`${now()} [INFO] [NODE] Download complete`);

        // Extracting
        fs.mkdirSync(`${tempDir}${SEP}unzipped`);
        console.log(`${now()} [INFO] [NODE] Extracting file ${dlFilePath}`);
        if (path.extname(dlFilePath) === '.gz') {
            await tar.extract(
                {
                    file: dlFilePath,
                    cwd: `${tempDir}${SEP}unzipped`,
                }
            ).catch((err: any) => {
                throw { message: err.message };
            });

        } else {
            const zipFile = new admZip(dlFilePath);
            await new Promise((resolve, reject) => {
                zipFile.extractAllToAsync(`${tempDir}${SEP}unzipped`, true, true, (err: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(null);
                });
            }).catch((err:any) => {
                throw { message: err.message };
            });
        }
        console.log(`${now()} [INFO] [NODE] Extract complete`);

        // Install to target dir
        fs.mkdirSync(targetDir, {recursive: true});
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.renameSync( `${tempDir}${SEP}unzipped${subDir}${SEP}`, targetDir);
        console.log(`${now()} [INFO] [NODE] Install complete into ${targetDir}`);

        // Cleaning
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};




export const fullnodeCommands: t.fullnodeCommandInfos = {
    ...baseFullnode.fullnodeCommands,

    p2pPort: 8333, // default = 8333
    rpcPort: -1, // default = 8332

    command: 'bin/bitcoind', // the filename of the executable (without .exe extension)

    getCommandFile(config, params) {
        return this.command + (os.platform() === 'linux' ? '' : '.exe');
    },

    getCommandArgs(config, params) {
        const args: string[] = [
            `-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
            `-server`,
            `-port=${this.p2pPort.toString()}`,
            `-printtoconsole`,
            `-maxmempool=100`,
            `-zmqpubrawblock=tcp://127.0.0.1:28332`,
            `-zmqpubrawtx=tcp://127.0.0.1:28333`,
        ];

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
        const apiUrl = `http://127.0.0.1:${this.rpcPort}`;
        const headers: any = {};

        // TODO: RPC REQUEST

        //const fullnodeSummaryRes = await fetch(`${apiUrl}/`, {headers}); // EDIT API URL
        //const fullnodeSummary: any = await fullnodeSummaryRes.json();

        // EDIT THESE VALUES - START //
        const fullnodeName = 'edit-me';
        const coin = 'edit-me';
        const blocks = -1; // edit-me
        const blockHeaders = -1; // edit-me

        const cpus: any[] = [];
        // EDIT THESE VALUES - END //

        let infos: t.FullnodeStats = {
            fullnode: {
                name: fullnodeName,
                coin,
            },
            blockchain: {
                blocks,
                headers: blockHeaders,
            },
        };

        return infos;
    }
};


