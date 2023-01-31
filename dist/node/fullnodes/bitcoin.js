"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fullnodeCommands = exports.fullnodeInstall = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
const tar_1 = tslib_1.__importDefault(require("tar"));
const adm_zip_1 = tslib_1.__importDefault(require("adm-zip"));
const utils_1 = require("../../common/utils");
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
const SEP = path_1.default.sep;
/* ########## FUNCTIONS ######### */
exports.fullnodeInstall = {
    version: '24.0.1',
    versionBitcoinOrg: '22.0',
    install(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // install bitcoincore from bitcoincore.org OR bitcoin.org
            const targetAlias = params.alias || params.fullnode;
            const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), `frm-tmp.fullnode-install-${params.fullnode}-${targetAlias}-`), {});
            const targetDir = `${config === null || config === void 0 ? void 0 : config.appDir}${SEP}node${SEP}fullnodes${SEP}${targetAlias}`;
            let version = this.version;
            const platform = (0, utils_1.getOpt)('--platform', config._args) || os_1.default.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
            let dlUrl;
            if (platform === 'linux') {
                if ((0, utils_1.hasOpt)('--bitcoin.org')) {
                    version = this.versionBitcoinOrg;
                    dlUrl = `https://bitcoin.org/bin/bitcoin-core-${version}/bitcoin-${version}-x86_64-linux-gnu.tar.gz`;
                }
                else {
                    dlUrl = `https://bitcoincore.org/bin/bitcoin-core-${version}/bitcoin-${version}-x86_64-linux-gnu.tar.gz`;
                }
            }
            else if (platform === 'win32') {
                if ((0, utils_1.hasOpt)('--bitcoin.org')) {
                    version = this.versionBitcoinOrg;
                    dlUrl = `https://bitcoin.org/bin/bitcoin-core-${version}/bitcoin-${version}-win64.zip`;
                }
                else {
                    dlUrl = `https://bitcoincore.org/bin/bitcoin-core-${version}/bitcoin-${version}-win64.zip`;
                }
            }
            else if (platform === 'darwin') {
                if ((0, utils_1.hasOpt)('--bitcoin.org')) {
                    version = this.versionBitcoinOrg;
                    dlUrl = `https://bitcoin.org/bin/bitcoin-core-${version}/bitcoin-${version}-osx64.tar.gz`;
                }
                else {
                    dlUrl = `https://bitcoincore.org/bin/bitcoin-core-${version}/bitcoin-${version}-x86_64-apple-darwin.tar.gz`;
                }
            }
            else {
                throw { message: `No installation script available for the platform ${platform}` };
            }
            if (dlUrl === 'edit-me')
                throw { message: `No installation script available for the platform ${platform}` };
            // Downloading
            const dlFileName = path_1.default.basename(dlUrl);
            const dlFilePath = `${tempDir}${SEP}${dlFileName}`;
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Downloading file ${dlUrl}`);
            yield (0, utils_1.downloadFile)(dlUrl, dlFilePath);
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Download complete`);
            // Extracting
            fs_1.default.mkdirSync(`${tempDir}${SEP}unzipped`);
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Extracting file ${dlFilePath}`);
            if (path_1.default.extname(dlFilePath) === '.gz') {
                yield tar_1.default.extract({
                    file: dlFilePath,
                    cwd: `${tempDir}${SEP}unzipped`,
                }).catch((err) => {
                    throw { message: err.message };
                });
            }
            else {
                const zipFile = new adm_zip_1.default(dlFilePath);
                yield new Promise((resolve, reject) => {
                    zipFile.extractAllToAsync(`${tempDir}${SEP}unzipped`, true, true, (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(null);
                    });
                }).catch((err) => {
                    throw { message: err.message };
                });
            }
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Extract complete`);
            // Install to target dir
            fs_1.default.mkdirSync(targetDir, { recursive: true });
            fs_1.default.rmSync(targetDir, { recursive: true, force: true });
            fs_1.default.renameSync(`${tempDir}${SEP}unzipped${SEP}bitcoin-${version}${SEP}`, targetDir);
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Install complete into ${targetDir}`);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        });
    }
};
exports.fullnodeCommands = {
    p2pPort: 8333,
    rpcPort: -1,
    command: 'bin/bitcoind',
    getCommandFile(config, params) {
        return this.command + (os_1.default.platform() === 'linux' ? '' : '.exe');
    },
    getCommandArgs(config, params) {
        const args = [
            `-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
            `-server`,
            `-port=${this.p2pPort.toString()}`,
            `-printtoconsole`,
            `-maxmempool=100`,
            `-zmqpubrawblock=tcp://127.0.0.1:28332`,
            `-zmqpubrawtx=tcp://127.0.0.1:28333`,
        ];
        if (this.rpcPort !== -1) {
            args.push(`-rpcport=${this.rpcPort.toString()}`);
            args.push(`-rpcbind=0.0.0.0`);
            args.push(`-rpcuser=user`);
            args.push(`-rpcpassword=pass`);
            args.push(`-rpcallowip=127.0.0.1`);
        }
        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }
        return args;
    },
    getInfos(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const apiUrl = `http://127.0.0.1:${this.rpcPort}`;
            const headers = {};
            // TODO: RPC REQUEST
            //const fullnodeSummaryRes = await fetch(`${apiUrl}/`, {headers}); // EDIT API URL
            //const fullnodeSummary: any = await fullnodeSummaryRes.json();
            // EDIT THESE VALUES - START //
            const fullnodeName = 'edit-me';
            const coin = 'edit-me';
            const blocks = 0; // edit-me
            const blockHeaders = 0; // edit-me
            const cpus = [];
            // EDIT THESE VALUES - END //
            let infos = {
                infos: {
                    name: fullnodeName,
                    coin,
                    blocks,
                    headers: blockHeaders,
                },
                devices: {
                    cpus,
                }
            };
            return infos;
        });
    }
};
