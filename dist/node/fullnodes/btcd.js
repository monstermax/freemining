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

Website :
Github  : https://github.com/btcsuite/btcd/
Download: https://github.com/btcsuite/btcd/releases


- https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-linux-amd64-v${version}.tar.gz
-
-
-

*/
/* ########## CONFIG ######### */
const fullnodeName = 'btcd';
const fullnodeTitle = 'Bitcoin BTCd';
const github = 'btcsuite/btcd';
const lastVersion = '0.23.3';
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
            let subDir = `${SEP}btcd-${platform}-amd64-v${version}`;
            if (platform === 'win32')
                subDir = `${SEP}btcd-windows-amd64-v${version}`;
            // Download url selection
            let dlUrls = {
                'linux': `https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-linux-amd64-v${version}.tar.gz`,
                'win32': `https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-windows-amd64-v${version}.zip`,
                'darwin': `https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-darwin-amd64-v${version}.tar.gz`,
                'freebsd': `https://github.com/btcsuite/btcd/releases/download/v${version}/btcd-freebsd-amd64-v${version}.tar.gz`,
            };
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
    } });
exports.fullnodeCommands = Object.assign(Object.assign({}, baseFullnode.fullnodeCommands), { p2pPort: -1, rpcPort: -1, command: 'btcd', managed: false, // set true when the getInfos() script is ready
    getCommandArgs(config, params) {
        const args = [
        //`-EDIT-ME-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
        ];
        if (this.p2pPort > 0) {
            //args.push( `-server` );
            //args.push( `-port=${this.p2pPort.toString()}` );
        }
        if (this.rpcPort !== -1) {
            //args.push( `-rpcport=${this.rpcPort.toString()}` );
            //args.push( `-rpcbind=0.0.0.0` );
            //args.push( `-rpcuser=user` );
            //args.push( `-rpcpassword=pass` );
            //args.push( `-rpcallowip=127.0.0.1` );
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
            const blocks = -1; // edit-me
            const blockHeaders = -1; // edit-me
            const peers = -1; // edit-me
            // EDIT THESE VALUES - END //
            let infos = {
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
        });
    } });
