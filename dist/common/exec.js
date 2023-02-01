"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exec = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const child_process_1 = tslib_1.__importDefault(require("child_process"));
const utils_1 = require("./utils");
const TEN_MEBIBYTE = 1024 * 1024 * 10;
const exec = (command, args, stdin, cwd, onSpawn, onStdOut, onStdErr, onEnd, argv0) => {
    if (!fs_1.default.existsSync(command)) {
        throw { message: `Command ${command} does not exist` };
    }
    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        const spawnOptions = { maxBuffer: TEN_MEBIBYTE, cwd, argv0 };
        console.debug('DEBUG CMD:', command, args.join(' '));
        const process = child_process_1.default.spawn(command, args, spawnOptions);
        if (typeof onSpawn === 'function') {
            onSpawn(process);
        }
        // All of these handlers can close the Promise, so guard against rejecting it twice.
        let promiseAlreadyRejected = false;
        process.on('close', (code, signal) => {
            if (!promiseAlreadyRejected) {
                promiseAlreadyRejected = true;
                //console.debug('DEBUG SIGNAL:', signal); // null (SIGTERM -15) | SIGKILL (-9) | SIGINT (-2) | SIGQUIT (-3) | ...
                if (typeof onEnd === 'function') {
                    onEnd(code);
                }
                if (code !== 0) {
                    return reject({ code, message: stderr });
                }
                else {
                    return resolve((0, utils_1.stripFinalNewline)(stdout));
                }
            }
        });
        // STDIN
        if (stdin) {
            process.stdin.on('error', (err) => {
                if (!promiseAlreadyRejected) {
                    promiseAlreadyRejected = true;
                    if (typeof onEnd === 'function') {
                        onEnd(1, err);
                    }
                    return reject(err);
                }
            });
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
    });
};
exports.exec = exec;
