
import fs from 'fs';
import colors from 'colors/safe';
const { exec } = require('child_process');


export async function cmdExec(cmd: string): Promise<string | null> {
    let ret: string | null = null;

    await new Promise((resolve, reject) => {
        exec(cmd, (error: any, stdout: string, stderr: string) => {
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


export function formatNumber(n: number): string {
    return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format(n);
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
