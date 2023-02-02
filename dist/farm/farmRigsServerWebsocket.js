"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.status = exports.stop = exports.start = void 0;
let active = false;
function start(config) {
    if (active)
        return;
    active = true;
    // TODO
    //console.log(`${now()} [INFO] [FARM] Rigs server started`);
}
exports.start = start;
function stop() {
    //if (! active) return;
    active = false;
    // TODO
    //console.log(`${now()} [INFO] [FARM] Rigs server stopped`);
}
exports.stop = stop;
function status() {
    return active;
}
exports.status = status;
