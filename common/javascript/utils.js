"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyHtmlLayout = exports.now = exports.formatNumber = exports.stringTemplate = exports.cmdExec = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const child_process_1 = require("child_process");
function cmdExec(cmd, timeout = null) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let ret = null;
        yield new Promise((resolve, reject) => {
            let timeouted = null;
            if (timeout !== null) {
                timeouted = setTimeout(() => {
                    // kill shell process
                    //killCmd = `pkill -f ${cmd.split(' ')[0]}`; // TODO: voir si on peut killer tous les fils shell (de agent.ts), si possible en matchant un pattern
                    //await cmdExec(killCmd);
                    reject();
                }, timeout);
            }
            (0, child_process_1.exec)(cmd, (error, stdout, stderr) => {
                if (timeouted) {
                    clearTimeout(timeouted);
                }
                if (error) {
                    //console.error(`${now()} [${colors.red('ERROR')}] Error while running exec command : ${error.message.trim()}`);
                    reject(error);
                    return;
                }
                if (stderr) {
                    reject({ message: stderr, code: 500 });
                    return;
                }
                resolve(stdout);
            });
        }).then((result) => {
            ret = result;
        }).catch((err) => {
            console.error(`${now()} [${safe_1.default.red('ERROR')}] catched while running exec command => ${safe_1.default.red(err.message)}`);
        });
        return ret;
    });
}
exports.cmdExec = cmdExec;
function stringTemplate(text, params, ignoreErrors = false, recursive = true, expandTild = false, maxDepth = 50) {
    const HOME = process.env.HOME;
    params.formatNumber = formatNumber;
    try {
        const names = Object.keys(params);
        const vals = Object.values(params);
        let result = new Function(...names, `return \`${text}\`;`)(...vals);
        if (recursive && maxDepth > 0 && result && result.includes('${')) {
            result = stringTemplate(result, params, ignoreErrors, recursive, expandTild, maxDepth - 1);
        }
        if (result && expandTild && result.startsWith('~')) {
            result = `${HOME}${result.slice(1)}`;
        }
        return result;
    }
    catch (err) {
        if (ignoreErrors) {
            return null;
        }
        throw err;
    }
}
exports.stringTemplate = stringTemplate;
function fixedRound(precision = 0) {
    return function (val) {
        return Math.round(val * 10 ** precision) / 10 ** precision;
    };
}
function formatNumber(n, type = '') {
    let ret = '';
    const round = fixedRound(1);
    if (type === 'seconds') {
        if (n > 24 * 60 * 60) {
            ret = round(n / (24 * 60 * 60)).toString() + ' day';
        }
        else if (n > 60 * 60) {
            ret = round(n / (60 * 60)).toString() + ' hour';
        }
        else if (n > 60) {
            ret = round(n / 60).toString() + ' min';
        }
        else {
            ret = round(n).toString() + ' sec';
        }
    }
    else if (type === 'size') {
        if (n > 10 ** 21) {
            ret = round(n / 10 ** 21).toString() + ' Y';
        }
        else if (n > 10 ** 18) {
            ret = round(n / 10 ** 18).toString() + ' Z';
        }
        else if (n > 10 ** 15) {
            ret = round(n / 10 ** 15).toString() + ' E';
        }
        else if (n > 10 ** 12) {
            ret = round(n / 10 ** 12).toString() + ' T';
        }
        else if (n > 10 ** 9) {
            ret = round(n / 10 ** 9).toString() + ' G';
        }
        else if (n > 10 ** 6) {
            ret = round(n / 10 ** 6).toString() + ' M';
        }
        else if (n > 10 ** 3) {
            ret = round(n / 10 ** 3).toString() + ' K';
        }
        else {
            ret = round(n).toString() + ' ';
        }
    }
    else {
        ret = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format(n);
    }
    return ret;
}
exports.formatNumber = formatNumber;
function now() {
    const options = {
        /* year: "numeric", month: "2-digit", day: "2-digit", */
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    };
    return new Date().toLocaleTimeString("fr-FR", options);
}
exports.now = now;
function applyHtmlLayout(content, opts = {}, layoutPath = '', currentUrl = '') {
    opts = opts || {};
    opts.currentUrl = currentUrl;
    opts.meta = opts.meta || {};
    opts.meta.title = opts.meta.title || ''; // set page title
    opts.meta.noIndex = opts.meta.noIndex || false;
    opts.body = opts.body || {};
    opts.body.content = opts.body.content || content; // set page content
    const layoutTemplate = fs_1.default.readFileSync(layoutPath).toString();
    let pageContent = stringTemplate(layoutTemplate, opts);
    return pageContent;
}
exports.applyHtmlLayout = applyHtmlLayout;
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
