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

Website   :
Github    : https://github.com/kaspanet/kaspad
Downnload : https://github.com/kaspanet/kaspad/releases

*/
/* ########## CONFIG ######### */
const fullnodeName = 'kaspa';
const fullnodeTitle = 'kaspa';
const github = 'kaspanet/kaspad';
const lastVersion = '0.12.11';
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
/* ########## FUNCTIONS ######### */
exports.fullnodeInstall = Object.assign(Object.assign({}, baseFullnode.fullnodeInstall), { fullnodeName,
    fullnodeTitle,
    //lastVersion,   // uncomment me when install script is ready
    github,
    install(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const platform = (0, utils_1.getOpt)('--platform', config._args) || os_1.default.platform(); // aix | android | darwin | freebsd | linux | openbsd | sunos | win32 | android (experimental)
            const setAsDefaultAlias = params.default || false;
            let version = params.version || this.lastVersion;
            let subDir = ``; // none
            // Download url selection
            const dlUrls = {
                'linux': `https://github.com/kaspanet/kaspad/releases/download/v${version}/kaspad-v${version}-linux.zip`,
                'win32': `https://github.com/kaspanet/kaspad/releases/download/v${version}/kaspad-v${version}-win64.zip`,
                'darwin': `https://github.com/kaspanet/kaspad/releases/download/v${version}/kaspad-v${version}-osx.zip`,
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
            if (platform === 'win32') {
                fs_1.default.mkdirSync(`${aliasDir}/bin`, { recursive: true });
                fs_1.default.renameSync(`${tempDir}${SEP}unzipped${subDir}${SEP}`, `${aliasDir}/bin`);
            }
            else {
                fs_1.default.renameSync(`${tempDir}${SEP}unzipped${subDir}${SEP}`, aliasDir);
            }
            // Write report files
            this.writeReport(version, fullnodeAlias, dlUrl, aliasDir, fullnodeDir, setAsDefaultAlias);
            // Cleaning
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            console.log(`${(0, utils_1.now)()} [INFO] [NODE] Install complete into ${aliasDir}`);
        });
    } });
exports.fullnodeCommands = Object.assign(Object.assign({}, baseFullnode.fullnodeCommands), { p2pPort: -1, rpcPort: -1, command: 'bin/kaspad', managed: false, // set true when the getInfos() script is ready
    getCommandArgs(config, params) {
        const args = [
            `-edit-me-datadir=${config.dataDir}${SEP}node${SEP}fullnodes${SEP}${params.fullnode}`,
        ];
        if (this.p2pPort > 0) {
        }
        if (this.rpcPort > 0) {
            args.push(`-edit-me-rpcport=${this.rpcPort.toString()}`);
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
            const fullnodeName = ''; // edit-me
            const coin = ''; // edit-me
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
