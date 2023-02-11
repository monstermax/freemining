
import * as Daemon from './core/Daemon';
import type *  as t from './common/types';


/* ################# MAIN ################# */


const args = process.argv.slice(2) as (t.DaemonParams & t.CommonParams & string)[];

Daemon.run(args);

