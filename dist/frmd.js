"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Daemon = tslib_1.__importStar(require("./core/Daemon"));
/* ################# MAIN ################# */
const args = process.argv.slice(2);
Daemon.run(args);
