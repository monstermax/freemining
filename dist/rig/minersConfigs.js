"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minersCommands = exports.minersInstalls = void 0;
const tslib_1 = require("tslib");
const minersConfigs = tslib_1.__importStar(require("./miners"));
exports.minersInstalls = Object.fromEntries(Object.entries(minersConfigs).map(entry => {
    const [minerName, minerConfig] = entry;
    return [minerName, minerConfig.minerInstall];
}));
exports.minersCommands = Object.fromEntries(Object.entries(minersConfigs).map(entry => {
    const [minerName, minerConfig] = entry;
    return [minerName, minerConfig.minerCommands];
}));
