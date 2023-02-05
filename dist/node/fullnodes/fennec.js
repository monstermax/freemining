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

Website   : https://www.fennecblockchain.com/
Github    : https://github.com/FennecBlockchain/Fennec
Downnload : https://github.com/FennecBlockchain/Fennec/releases

*/
/* ########## CONFIG ######### */
const fullnodeName = 'fennec';
const fullnodeTitle = 'Fennec';
const github = 'FennecBlockchain/Fennec';
const lastVersion = '1.0.3';
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
/* ########## FUNCTIONS ######### */
exports.fullnodeInstall = Object.assign(Object.assign({}, baseFullnode.fullnodeInstall), { fullnodeName,
    fullnodeTitle,
    lastVersion,
    github,
    install(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const platform = (0, utils_1.getOpt)('--platform', config._args) || os_1.default.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
            const setAsDefaultAlias = params.default || false;
            let version = params.version || this.lastVersion;
            let subDir = ``; // none
            // Download url selection
            const dlUrls = {
                'linux': `https://github.com/FennecBlockchain/Fennec/releases/download/v${version}/Fennec-Linux.tar.gz`,
                'win32': `https://github.com/FennecBlockchain/Fennec/releases/download/v${version}/Fennec-Win.zip`,
                'darwin': ``,
                'freebsd': ``,
            };
            let dlUrl = dlUrls[platform] || '';
            if (dlUrl === '')
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
    } });
exports.fullnodeCommands = Object.assign(Object.assign({}, baseFullnode.fullnodeCommands), { p2pPort: 8338, rpcPort: 8339, command: 'fennecd', managed: true, getCommandArgs(config, params) {
        const args = [
            `-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
            `-printtoconsole`,
            `-maxmempool=100`,
            //`-zmqpubrawblock=tcp://127.0.0.1:28339`,
            //`-zmqpubrawtx=tcp://127.0.0.1:28338`,
        ];
        if (this.p2pPort > 0) {
            args.push(`-server`);
            args.push(`-port=${this.p2pPort.toString()}`);
        }
        if (this.rpcPort > 0) {
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
            // fennec-cli -rpcuser=user -rpcpassword=pass help
            // fennec-cli -rpcuser=user -rpcpassword=pass dumpwallet /tmp/wall.tmp
            // #curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "createwallet", "params": {"wallet_name": "fullnode", "avoid_reuse": true, "descriptors": false, "load_on_startup": true}}' -H 'content-type: text/plain;' http://127.0.0.1:8339/
            // curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getwalletinfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8339/
            // curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getaddressesbylabel", "params": [""]}' -H 'content-type: text/plain;' http://127.0.0.1:8339/
            // curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getnewaddress", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8339/
            // curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getblockchaininfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8339/
            // curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getnetworkinfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:8339/
            const getblockchaininfo = yield this.rpcRequest(fullnodeName, 'getblockchaininfo', []);
            const getnetworkinfo = yield this.rpcRequest(fullnodeName, 'getnetworkinfo', []);
            const getwalletinfo = yield this.rpcRequest(fullnodeName, 'getwalletinfo', []);
            const getaddressesbylabel = yield this.rpcRequest(fullnodeName, 'getaddressesbylabel', ['']);
            // EDIT THESE VALUES - START //
            const coin = 'FNNC';
            const blocks = getblockchaininfo.blocks || -1;
            const blockHeaders = getblockchaininfo.headers || -1;
            const bestBlockHash = getblockchaininfo.bestblockhash || '';
            const bestBlockTime = getblockchaininfo.mediantime || -1;
            const sizeOnDisk = getblockchaininfo.size_on_disk || -1;
            const peers = getnetworkinfo.connections || -1;
            // EDIT THESE VALUES - END //
            let infos = {
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
                    address: Object.keys(getaddressesbylabel || {}).shift() || '',
                    balance: (getwalletinfo === null || getwalletinfo === void 0 ? void 0 : getwalletinfo.balance) || -1,
                    txcount: (getwalletinfo === null || getwalletinfo === void 0 ? void 0 : getwalletinfo.txcount) || -1,
                }
            };
            return infos;
        });
    } });
