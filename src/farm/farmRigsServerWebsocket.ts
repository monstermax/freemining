

import type *  as t from '../common/types';


let active = false;


export function start(config?: t.Config) {
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

