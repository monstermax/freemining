"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fullnodeCommands = exports.fullnodeInstall = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
const RpcClient = require("rpc-client");
const utils_1 = require("../../common/utils");
const baseFullnode = tslib_1.__importStar(require("./_baseFullnode"));
/* ########## DESCRIPTION ######### */
/*

Website : https://bitcoincore.org/
Github  : https://github.com/bitcoin/bitcoin
Download: https://bitcoincore.org/en/download/
Download: https://bitcoin.org/en/download

*/
/* ########## CONFIG ######### */
const fullnodeName = 'bitcoin';
const fullnodeTitle = 'Bitcoin';
const github = ''; // bitcoin/bitcoin
const lastVersion = '24.0.1'; // for bitcoincore.org
const versionBitcoinOrg = '22.0'; // for bitcoin.org
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
/* ########## FUNCTIONS ######### */
exports.fullnodeInstall = Object.assign(Object.assign({}, baseFullnode.fullnodeInstall), { fullnodeName,
    fullnodeTitle,
    lastVersion,
    github,
    install(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // install bitcoincore from bitcoincore.org OR bitcoin.org
            const platform = (0, utils_1.getOpt)('--platform', config._args) || os_1.default.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
            const setAsDefaultAlias = params.default || false;
            let version = params.version || this.lastVersion;
            let subDir = `${SEP}bitcoin-${version}`;
            // Download url selection
            let dlUrls = {
                'linux': `https://bitcoincore.org/bin/bitcoin-core-${version}/bitcoin-${version}-x86_64-linux-gnu.tar.gz`,
                'win32': `https://bitcoincore.org/bin/bitcoin-core-${version}/bitcoin-${version}-win64.zip`,
                'darwin': `https://bitcoincore.org/bin/bitcoin-core-${version}/bitcoin-${version}-x86_64-apple-darwin.tar.gz`,
                'freebsd': ``,
            };
            if ((0, utils_1.hasOpt)('--bitcoin.org')) {
                version = params.version || versionBitcoinOrg;
                dlUrls = {
                    'linux': `https://bitcoin.org/bin/bitcoin-core-${version}/bitcoin-${version}-x86_64-linux-gnu.tar.gz`,
                    'win32': `https://bitcoin.org/bin/bitcoin-core-${version}/bitcoin-${version}-win64.zip`,
                    'darwin': `https://bitcoin.org/bin/bitcoin-core-${version}/bitcoin-${version}-osx64.tar.gz`,
                    'freebsd': ``,
                };
            }
            let dlUrl = dlUrls[platform] || '';
            if (dlUrl === 'edit-me')
                throw { message: `No installation script available for the platform ${platform}` };
            // Some common install options
            const { fullnodeAlias, tempDir, fullnodeDir, aliasDir } = this.getInstallOptions(config, params, version);
            // Downloading
            const dlFileName = path_1.default.basename(dlUrl);
            const dlFilePath = `${tempDir}${SEP}${dlFileName}`;
            yield this.downloadFile(dlUrl, dlFilePath);
            // Extracting
            yield this.extractFile(tempDir, dlFilePath);
            // Install to target dir
            fs_1.default.mkdirSync(aliasDir, { recursive: true });
            fs_1.default.rmSync(aliasDir, { recursive: true, force: true });
            fs_1.default.renameSync(`${tempDir}${SEP}unzipped${subDir}${SEP}`, aliasDir);
            // Write report files
            this.writeReport(version, fullnodeAlias, dlUrl, aliasDir, fullnodeDir, setAsDefaultAlias);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Install complete into ${aliasDir}`);
        });
    },
    getLastVersion() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if ((0, utils_1.hasOpt)('--bitcoin.org')) {
                return baseFullnode.fullnodeInstall.getLastVersion();
            }
            // no script available for bitcoincore.org => TODO
            return '';
        });
    } });
exports.fullnodeCommands = Object.assign(Object.assign({}, baseFullnode.fullnodeCommands), { p2pPort: 8333, rpcPort: 8332, command: 'bin/bitcoind', managed: true, // set true when the getInfos() script is ready
    getCommandArgs(config, params) {
        const args = [
            `-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
            `-printtoconsole`,
            `-maxmempool=100`,
            `-zmqpubrawblock=tcp://127.0.0.1:28332`,
            `-zmqpubrawtx=tcp://127.0.0.1:28333`,
        ];
        if (this.p2pPort > 0) {
            args.push(`-server`);
            args.push(`-port=${this.p2pPort.toString()}`);
        }
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
            // RPC REQUEST
            // curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getblockchaininfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8332/
            // curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getnetworkinfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8332/
            const rpcClient = new RpcClient({ host: "127.0.0.1", port: this.rpcPort, protocol: "http" });
            rpcClient.setBasicAuth("user", "pass");
            const getblockchaininfo = yield new Promise((resolve, reject) => {
                rpcClient.call("getblockchaininfo", [], function (err, result) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(result);
                });
            }).catch((err) => {
                console.warn(`${(0, utils_1.now)()} [WARNING] [NODE] Cannot get getblockchaininfo ${fullnodeName} : ${err.message}`);
            });
            const getnetworkinfo = yield new Promise((resolve, reject) => {
                rpcClient.call("getnetworkinfo", [], function (err, result) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(result);
                });
            }).catch((err) => {
                console.warn(`${(0, utils_1.now)()} [WARNING] [NODE] Cannot get getnetworkinfo ${fullnodeName} : ${err.message}`);
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
            let infos = {
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
        });
    } });
