
import * as Cli from './core/Cli';
import type *  as t from './common/types';




/* ################# MAIN ################# */


const args = process.argv.slice(2) as (t.CliParams & t.CommonParams & string)[];

Cli.run(args);
