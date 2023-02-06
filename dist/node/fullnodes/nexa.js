"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fullnodeCommands = exports.fullnodeInstall = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
const utils_1 = require("../../common/utils");
const baseFullnode = tslib_1.__importStar(require("./_baseFullnode"));
/* ########## DESCRIPTION ######### */
/*

Website   : https://nexa.org/
Github    :
Downnload : https://www.bitcoinunlimited.info/nexa/

*/
/* ########## CONFIG ######### */
const fullnodeName = 'nexa';
const fullnodeTitle = 'Nexa';
const github = '';
const lastVersion = '1.1.0.0';
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
            let subDir = `${SEP}nexa-${version}`;
            if (!fullnodeName)
                throw { message: `Install script not completed` };
            if (!fullnodeTitle)
                throw { message: `Install script not completed` };
            if (!lastVersion)
                throw { message: `Install script not completed` };
            // Download url selection
            const dlUrls = {
                'linux': `https://www.bitcoinunlimited.info/nexa/1.1.0/nexa-1.1.0-linux64.tar.gz`,
                'win32': `https://www.bitcoinunlimited.info/nexa/1.1.0/nexa-1.1.0-win64.zip`,
                'darwin': `https://www.bitcoinunlimited.info/nexa/1.1.0/nexa-1.1.0.0-osx.tar.gz`,
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
exports.fullnodeCommands = Object.assign(Object.assign({}, baseFullnode.fullnodeCommands), { p2pPort: 7228, rpcPort: 7227, command: 'bin/nexad', managed: true, getCommandArgs(config, params) {
        const args = [
            `-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
            `-printtoconsole`,
            //`-zmqpubrawblock=tcp://127.0.0.1:27228`,
            //`-zmqpubrawtx=tcp://127.0.0.1:27228`,
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
            // RPC REQUESTS
            const getblockchaininfo = (yield this.rpcRequest(fullnodeName, 'getblockchaininfo', [])) || {};
            const getnetworkinfo = (yield this.rpcRequest(fullnodeName, 'getnetworkinfo', [])) || {};
            const getwalletinfo = (yield this.rpcRequest(fullnodeName, 'getwalletinfo', [])) || {};
            //const getaddressesbylabel: any = await this.rpcRequest(fullnodeName, 'getaddressesbylabel', ['']) || {}; // method not found
            const getaccountaddress = (yield this.rpcRequest(fullnodeName, 'getaccountaddress', [''])) || '';
            // EDIT THESE VALUES - START //
            const coin = 'NEXA';
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
                wallet: {
                    address: walletAddress,
                    balance: walletBalance,
                    txcount: walletTxCount,
                }
            };
            return infos;
        });
    } });
/*


nexa-cli -rpcuser=user -rpcpassword=pass help
nexa-cli -rpcuser=user -rpcpassword=pass dumpwallet /tmp/wall.tmp
nexa-cli -rpcuser=user -rpcpassword=pass getaccountaddress ""
nexa-cli -rpcuser=user -rpcpassword=pass getaddressesbyaccount ""
nexa-cli -rpcuser=user -rpcpassword=pass listactiveaddresses
nexa-cli -rpcuser=user -rpcpassword=pass dumpprivkey "nexa:qzfwp7me6crmm93jazx8p9afqzf7gpyqeq745mn86d"
nexa-cli -rpcuser=user -rpcpassword=pass getrawchangeaddress
nexa-cli -rpcuser=user -rpcpassword=pass dumpprivkey "nexa:qr8f4klfk45tre7s6g8ehyqfmpmzsxly5yyjtvs50p"

curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "dumpwallet", "params": ["/tmp/wall.tmp"]}' -H 'content-type: text/plain;' http://127.0.0.1:7227/

curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "createwallet", "params": {"wallet_name": "fullnode", "avoid_reuse": true, "descriptors": false, "load_on_startup": true}}' -H 'content-type: text/plain;' http://127.0.0.1:7227/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getwalletinfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:7227/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getaddressesbylabel", "params": [""]}' -H 'content-type: text/plain;' http://127.0.0.1:7227/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getnewaddress", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:7227/

curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getblockchaininfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:7227/
curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getnetworkinfo", "params": []}' -H 'content-type: text/plain;' http://127.0.0.1:7227/

curl --user user:pass --data-binary '{"jsonrpc": "1.0", "id": "curltest", "method": "getaccountaddress", "params": [""]}' -H 'content-type: text/plain;' http://127.0.0.1:7227/

*/
