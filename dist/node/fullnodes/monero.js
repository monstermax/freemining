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

Website   : https://www.getmonero.org
Github    : https://github.com/monero-project/monero
Downnload : https://www.getmonero.org/downloads/

*/
/* ########## CONFIG ######### */
const fullnodeName = 'monero';
const fullnodeTitle = 'Monero';
const github = ''; // monero-project/monero
const lastVersion = '0.18.1.2'; // 0.18.1.2
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
            let subDir = `${SEP}monero-x86_64-*-v${version}`;
            if (platform === 'win32')
                subDir = `${SEP}monero-x86_64-w64-mingw32-v${version}`;
            if (platform === 'linux')
                subDir = `${SEP}monero-x86_64-linux-gnu-v${version}`;
            if (platform === 'darwin')
                subDir = `${SEP}monero-x86_64-apple-darwin11-v${version}`;
            if (platform === 'freebsd')
                subDir = `${SEP}monero-x86_64-unknown-freebsd-v${version}`;
            if (!fullnodeName)
                throw { message: `Install script not completed` };
            if (!fullnodeTitle)
                throw { message: `Install script not completed` };
            if (!lastVersion)
                throw { message: `Install script not completed` };
            // Download url selection
            const dlUrls = {
                'linux': `https://downloads.getmonero.org/cli/linux64`,
                'win32': `https://downloads.getmonero.org/cli/win64`,
                'darwin': `https://downloads.getmonero.org/cli/mac64`,
                'freebsd': `https://downloads.getmonero.org/cli/freebsd64`,
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
exports.fullnodeCommands = Object.assign(Object.assign({}, baseFullnode.fullnodeCommands), { p2pPort: 18080, rpcPort: 18081, command: 'monerod', managed: false, // set true when the getInfos() script is ready
    getCommandArgs(config, params) {
        const args = [
            `--data-dir`, `${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
            `--non-interactive`,
        ];
        if (this.p2pPort > 0) {
            args.push(`--p2p-bind-ip`);
            args.push(`127.0.0.1`);
            args.push(`--p2p-bind-port`);
            args.push(`${this.p2pPort}`);
        }
        if (this.rpcPort > 0) {
            args.push(`--rpc-bind-ip`);
            args.push(`127.0.0.1`);
            args.push(`--rpc-bind-port`);
            args.push(`${this.rpcPort}`);
            args.push(`--rpc-login`);
            args.push(`user:pass`);
        }
        if (params.extraArgs && params.extraArgs.length > 0) {
            args.push(...params.extraArgs);
        }
        return args;
    },
    getInfos(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // TODO: RPC REQUEST
            // EDIT THESE VALUES - START //
            const coin = ''; // edit-me
            const blocks = -1; // edit-me
            const blockHeaders = -1; // edit-me
            const peers = -1; // edit-me
            const bestBlockHash = ''; // edit-me
            const bestBlockTime = -1; // edit-me
            const sizeOnDisk = -1; // edit-me
            const walletAddress = ''; // edit-me
            const walletBalance = -1; // edit-me
            const walletTxCount = -1; // edit-me
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
