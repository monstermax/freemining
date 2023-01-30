"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Cli = tslib_1.__importStar(require("./core/Cli"));
/* ################# MAIN ################# */
const args = process.argv.slice(2);
Cli.run(args);
