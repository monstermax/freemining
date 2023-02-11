
import fs from 'fs';
import childProcess from 'child_process';
import { stripFinalNewline } from './utils';

import type *  as t from './types';

const TEN_MEBIBYTE = 1024 * 1024 * 10;


export const exec = (command: string, args: string[], stdin: string, cwd?: string, onSpawn?: t.ExecOnSpawn, onStdOut?: Function, onStdErr?: Function, onEnd?: Function, argv0?: string): Promise<string> => {

    if (! fs.existsSync(command)) {
        throw { message: `Command ${command} does not exist` };
    }

    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        const spawnOptions = { maxBuffer: TEN_MEBIBYTE, cwd, argv0 };

        console.debug('DEBUG CMD:', command, args.join(' '));

        const process = childProcess.spawn(command, args, spawnOptions);

        if (typeof onSpawn === 'function') {
            onSpawn(process);
        }

        // All of these handlers can close the Promise, so guard against rejecting it twice.
        let promiseAlreadyRejected = false;

        process.on('close', (code: number, signal: string | null) => {
            if (!promiseAlreadyRejected) {
                promiseAlreadyRejected = true;
                //console.debug('DEBUG SIGNAL:', signal); // null (SIGTERM -15) | SIGKILL (-9) | SIGINT (-2) | SIGQUIT (-3) | ...

                if (typeof onEnd === 'function') {
                    onEnd(code);
                }

                if (code !== 0) {
                    return reject( { code, message: stderr } )

                } else {
                    return resolve(stripFinalNewline(stdout))
                }
            }
        });


        // STDIN
        if (stdin) {
            process.stdin.on('error', (err: any) => {
                if (!promiseAlreadyRejected) {
                    promiseAlreadyRejected = true;

                    if (typeof onEnd === 'function') {
                        onEnd(1, err);
                    }

                    return reject(err);
                }
            })
            process.stdin.setDefaultEncoding('utf-8');
            process.stdin.write(stdin);
            process.stdin.end();
        }


        // STDOUT
        process.stdout.setEncoding('utf-8');

        process.stdout.on('data', data => {
            stdout += data;
            if (typeof onStdOut === 'function') {
                onStdOut(data);
            }
        });


        // STDERR
        process.stderr.on('data', data => {
            stderr += data;
            if (typeof onStdErr === 'function') {
                onStdErr(data);
            }
        });
    })
};
