"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fullnodesCommands = exports.fullnodesInstalls = void 0;
const tslib_1 = require("tslib");
const fullnodesConfigs = tslib_1.__importStar(require("./fullnodes"));
/* ########## FUNCTIONS ######### */
exports.fullnodesInstalls = Object.fromEntries(Object.entries(fullnodesConfigs).map(entry => {
    const [fullnodeName, fullnodeConfig] = entry;
    return [fullnodeName, fullnodeConfig.fullnodeInstall];
}));
exports.fullnodesCommands = Object.fromEntries(Object.entries(fullnodesConfigs).map(entry => {
    const [fullnodeName, fullnodeConfig] = entry;
    return [fullnodeName, fullnodeConfig.fullnodeCommands];
}));
