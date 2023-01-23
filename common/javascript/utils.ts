
import fs from 'fs';
import colors from 'colors/safe';
import { exec } from 'child_process';


export async function cmdExec(cmd: string, timeout: number | null=null): Promise<string | null> {
    let ret: string | null = null;

    await new Promise((resolve, reject) => {
        let timeouted: any = null;

        if (timeout !== null) {
            timeouted = setTimeout(() => {
                // kill shell process
                //killCmd = `pkill -f ${cmd.split(' ')[0]}`; // TODO: voir si on peut killer tous les fils shell (de agent.ts), si possible en matchant un pattern
                //await cmdExec(killCmd);

                reject();
            }, timeout);
        }

        exec(cmd, (error: any, stdout: string, stderr: string) => {
            if (timeouted) {
                clearTimeout(timeouted);
            }

            if (error) {
                //console.error(`${now()} [${colors.red('ERROR')}] Error while running exec command : ${error.message.trim()}`);
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
        console.error(`${now()} [${colors.red('ERROR')}] catched while running exec command => ${colors.red(err.message)}`)
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



export function applyHtmlLayout(content: string, opts: any={}, layoutPath: string='', currentUrl: string=''): string | null {
    opts = opts || {};
    opts.currentUrl = currentUrl;

    opts.meta = opts.meta || {};
    opts.meta.title = opts.meta.title || ''; // set page title
    opts.meta.noIndex = opts.meta.noIndex || false;

    opts.body = opts.body || {};
    opts.body.content = opts.body.content || content; // set page content

    const layoutTemplate = fs.readFileSync(layoutPath).toString();
    let pageContent = stringTemplate(layoutTemplate, opts);

    return pageContent;
}


//export function loadTemplate(templatesDir: string, tplFile: string, data: any={}): string | null {
//    const tplPath = `${templatesDir}/${tplFile}`;
//
//    if (! fs.existsSync(tplPath)) {
//        return null;
//    }
//    const layoutTemplate = fs.readFileSync(tplPath).toString();
//    let tplContent = stringTemplate(layoutTemplate, data);
//
//    return tplContent;
//}
