

import type *  as t from '../common/types';


let active = false;


// TODO: A DEPLACER DANS Farm.ts


export function start(config?: t.DaemonConfigAll) {
    if (active) return;

    active = true;

    // TODO

    //console.log(`${now()} [INFO] [FARM] Rigs server started`);
}


export function stop() {
    //if (! active) return;

    active = false;
    // TODO

    //console.log(`${now()} [INFO] [FARM] Rigs server stopped`);
}


export function status() {
    return active;
}

