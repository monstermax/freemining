"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fullnodeCommands = exports.fullnodeInstall = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
/* ########## MAIN ######### */
const SEP = path_1.default.sep;
/* ########## FUNCTIONS ######### */
exports.fullnodeInstall = {
    version: '',
    github: '',
    install(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // EXTENDS ME
        });
    },
    getLastVersion() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.github)
                return '';
            const url = `https://api.github.com/repos/${this.github}/releases/latest`;
            const response = yield (0, node_fetch_1.default)(url);
            const releaseInfos = yield response.json();
            let version = releaseInfos.tag_name;
            if (version.startsWith('v')) {
                version = version.slice(1);
            }
            return version;
        });
    },
    getAllVersions() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.github)
                return [];
            const url = `https://api.github.com/repos/${this.github}/releases`;
            const response = yield (0, node_fetch_1.default)(url);
            const releaseVersions = yield response.json();
            return releaseVersions.map((release) => {
                let version = release.tag_name;
                if (version.startsWith('v')) {
                    version = version.slice(1);
                }
                return version;
            });
        });
    }
};
exports.fullnodeCommands = {
    p2pPort: -1,
    rpcPort: -1,
    command: '',
    getCommandFile(config, params) {
        return this.command + (os_1.default.platform() === 'linux' ? '' : '.exe');
    },
    getCommandArgs(config, params) {
        // EXTENDS ME
        return [];
    },
    getInfos(config, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // EXTENDS ME
            const fullnodeName = 'edit-me';
            const coin = 'edit-me';
            const blocks = -1; // edit-me
            const blockHeaders = -1; // edit-me
            let infos = {
                infos: {
                    name: fullnodeName,
                    coin,
                },
                blockchain: {
                    blocks,
                    headers: blockHeaders,
                },
            };
            return infos;
        });
    }
};
