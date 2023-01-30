
import fs from 'fs';
import os from 'os';
import colors from 'colors/safe';
import { exec } from 'child_process';
import fetch from 'node-fetch';

import type *  as t from './types';


export function hasOpt(keyName: string, argv: string[] | null=null): boolean {
    argv = argv || process.argv;
    var keyNames = (typeof(keyName) == 'object') ? keyName : [keyName];

    for (var i=0; i<keyNames.length; i++) {
        var keyName = keyNames[i];
        if (argv.indexOf(keyName) > -1) {
            return true;
        }
    }
    return false;
}


export function getOpt(keyName: string, argv: string[] | null=null): string | null {
    argv = argv || process.argv;
    var keyNames = (typeof(keyName) == 'object') ? keyName : [keyName];

    for (var i=0; i<keyNames.length; i++) {
        var keyName = keyNames[i];
        var idx = argv.indexOf(keyName);
        if (idx > -1) {
            return (argv.length > idx+1) ? argv[idx+1] : null;
        }
    }
    return null;
}


export function getOpts(keyName: string, followCount: number=0, argv: string[] | null=null): null | boolean | string[] {
    argv = argv || process.argv;
    var keyNames = (typeof(keyName) == 'object') ? keyName : [keyName];

    for (var i=0; i<keyNames.length; i++) {
        var keyName = keyNames[i];
        var idx = argv.indexOf(keyName);
        if (idx > -1) {
            if (followCount === 0) return true;
            if (followCount === -1) followCount = argv.length - idx - 1;
            const values: string[] = [];
            for (let j=0; j<followCount; j++) {
                let value = argv.slice(idx+j+1, idx+j+2).pop() || '';
                values.push(value);
            }
            return values;
        }
    }
    return null;
}




export async function cmdExec(cmd: string, timeout: number | null=null): Promise<string | null> {
    let ret: string | null = null;

    await new Promise((resolve, reject) => {
        let timeouted: any = null;

        if (timeout !== null) {
            timeouted = setTimeout(() => {
                // kill shell process
                //killCmd = `pkill -f ${cmd.split(' ')[0]}`; // TODO: voir si on peut killer tous les fils shell (de script.ts), si possible en matchant un pattern
                //await cmdExec(killCmd);

                reject( { message: `command timeouted (${Math.round(10 * timeout/1000) / 10}) sec.` } );
            }, timeout);
        }

        exec(cmd, (error: any, stdout: string, stderr: string) => {
            if (timeouted) {
                clearTimeout(timeouted);
            }

            if (error) {
                //console.error(`${now()} [${colors.red('ERROR')}] [cmdExec] Error while running exec command : ${error.message.trim()}`);
                reject( error );
                return;
            }

            if (stderr) {
                reject( { message: stderr, code: 500 } );
                return;
            }
            resolve(stdout);
        });

    }).then((result: any) => {
        ret = result;

    }).catch((err: any) => {
        console.error(`${now()} [${colors.red('ERROR')}] [cmdExec] catched while running exec command => ${colors.red(err.message)}`)
    });

    return ret;
}


export function stringTemplate(text: string, params: any, ignoreErrors=false, recursive=true, expandTild=false, maxDepth=50): string | null {
    const HOME = process.env.HOME;
    params.formatNumber = formatNumber;

    try {
        const names = Object.keys(params);
        const vals = Object.values(params);
        let result = new Function(...names, `return \`${text}\`;`)(...vals);

        if (recursive && maxDepth > 0 && result && result.includes('${')) {
            result = stringTemplate(result, params, ignoreErrors, recursive, expandTild, maxDepth-1);
        }

        if (result && expandTild && result.startsWith('~')) {
            result = `${HOME}${result.slice(1)}`;
        }

        return result;

    } catch (err) {
        if (ignoreErrors) {
            return null;
        }
        throw err;
    }
}


function fixedRound(precision: number=0) {
    return function (val: number) {
        return Math.round(val * 10 ** precision) / 10 ** precision;
    }
}


export function formatNumber(n: number, type:string=''): string {
    let ret = '';

    const round = fixedRound(1);

    if (type === 'seconds') {
        if (n > 24 * 60 * 60) {
            ret = round(n / (24 * 60 * 60)).toString() + ' day';
        } else if (n > 60 * 60) {
            ret = round(n / (60 * 60)).toString() + ' hour';
        } else if (n > 60) {
            ret = round(n / 60).toString() + ' min';
        } else {
            ret = round(n).toString() + ' sec';
        }

    } else if (type === 'size') {
        if (n > 10 ** 21) {
            ret = round(n / 10 ** 21).toString() + ' Y';
        } else if (n > 10 ** 18) {
            ret = round(n / 10 ** 18).toString() + ' Z';
        } else if (n > 10 ** 15) {
            ret = round(n / 10 ** 15).toString() + ' E';
        } else if (n > 10 ** 12) {
            ret = round(n / 10 ** 12).toString() + ' T';
        } else if (n > 10 ** 9) {
            ret = round(n / 10 ** 9).toString() + ' G';
        } else if (n > 10 ** 6) {
            ret = round(n / 10 ** 6).toString() + ' M';
        } else if (n > 10 ** 3) {
            ret = round(n / 10 ** 3).toString() + ' K';
        } else {
            ret = round(n).toString() + ' ';
        }

    } else {
        ret = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format(n);
    }
    return ret;
}



export function now(): string {
    const options: {hour:string|any, minute:string|any, second:string|any} = {
        /* year: "numeric", month: "2-digit", day: "2-digit", */
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    }
    return new Date().toLocaleTimeString("fr-FR", options);
}


export function createLruCache<T>(maxEntries: number = 20, store: Map<string, T> = new Map<string, T>()): t.LruCache<T> {
    // source: https://gist.github.com/dherges/86012049be7b1263b2e594134ff5816a

    function put(key: string, value: T) {
      if (store.size >= maxEntries) {
        const keyToDelete = store.keys().next().value
        store.delete(keyToDelete)
      }
      store.set(key, value)
    }

    function get(key: string): T | undefined {
      const hasKey = store.has(key)
      if (!hasKey) return undefined

      const entry = store.get(key)!
      store.delete(key)
      store.set(key, entry)
      return entry
    }

    return {
      put,
      get,
      maxEntries,
      store,
    } as t.LruCache<T>;
}



export function getLocalIpAddresses(): string[] {
    const interfaces = os.networkInterfaces();
    let ifName: string;
    const addresses: string[] = [];


    for (ifName in interfaces) {
        let interfaceInfos = interfaces[ifName];
        interfaceInfos = (interfaceInfos || []).filter(interfaceInfo => interfaceInfo.family === 'IPv4');

        const interfaceAddresses = interfaceInfos.map(interfaceInfo => interfaceInfo.address);
        addresses.push(...interfaceAddresses);
    }

    return addresses;
}




export function buildRpcRequest(id: number, method: string, params: any=[]): t.RpcRequest {
    const req: t.RpcRequest = {
        jsonrpc: "2.0",
        id,
        method,
        params
    };
    return req;
}


export function buildRpcResponse(id: number, result: any=null): t.RpcResponse {
    //if (typeof result === 'object') {
    //    result = JSON.stringify(result);
    //}
    const res: t.RpcResponse = {
        jsonrpc: "2.0",
        id,
        result
    };
    return res;
}


export function buildRpcError(id: number, err: any): t.RpcError {
    const res: t.RpcError = {
        jsonrpc: "2.0",
        id,
        error: {
            code: err.code || -1,
            message: err.message || '',
        }
    };
    return res;
}


export function stripFinalNewline(input: string): string {
	const LF = typeof input === 'string' ? '\n' : '\n'.charCodeAt(0);
	const CR = typeof input === 'string' ? '\r' : '\r'.charCodeAt(0);

	if (input[input.length - 1] === LF) {
		input = input.slice(0, -1);
	}

	if (input[input.length - 1] === CR) {
		input = input.slice(0, -1);
	}

	return input;
}


export async function sleep(delay: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, delay);
    });
}


export async function downloadFile(url: string, targetFile: string): Promise<void> {
    const res = await fetch(url);
    const fileStream = fs.createWriteStream(targetFile);
    return new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        //res.body.on('read', .....) // show progress ?
        fileStream.on("finish", resolve);
    });
};

