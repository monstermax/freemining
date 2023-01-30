"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = exports.sleep = exports.stripFinalNewline = exports.buildRpcError = exports.buildRpcResponse = exports.buildRpcRequest = exports.getLocalIpAddresses = exports.createLruCache = exports.now = exports.formatNumber = exports.stringTemplate = exports.cmdExec = exports.getOpts = exports.getOpt = exports.hasOpt = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const os_1 = tslib_1.__importDefault(require("os"));
const safe_1 = tslib_1.__importDefault(require("colors/safe"));
const child_process_1 = require("child_process");
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
function hasOpt(keyName, argv = null) {
    argv = argv || process.argv;
    var keyNames = (typeof (keyName) == 'object') ? keyName : [keyName];
    for (var i = 0; i < keyNames.length; i++) {
        var keyName = keyNames[i];
        if (argv.indexOf(keyName) > -1) {
            return true;
        }
    }
    return false;
}
exports.hasOpt = hasOpt;
function getOpt(keyName, argv = null) {
    argv = argv || process.argv;
    var keyNames = (typeof (keyName) == 'object') ? keyName : [keyName];
    for (var i = 0; i < keyNames.length; i++) {
        var keyName = keyNames[i];
        var idx = argv.indexOf(keyName);
        if (idx > -1) {
            return (argv.length > idx + 1) ? argv[idx + 1] : null;
        }
    }
    return null;
}
exports.getOpt = getOpt;
function getOpts(keyName, followCount = 0, argv = null) {
    argv = argv || process.argv;
    var keyNames = (typeof (keyName) == 'object') ? keyName : [keyName];
    for (var i = 0; i < keyNames.length; i++) {
        var keyName = keyNames[i];
        var idx = argv.indexOf(keyName);
        if (idx > -1) {
            if (followCount === 0)
                return true;
            const values = [];
            for (let j = 0; j < followCount; j++) {
                let value = argv.slice(idx + j + 1, idx + j + 2).pop() || '';
                values.push(value);
            }
            return values;
        }
    }
    return null;
}
exports.getOpts = getOpts;
function cmdExec(cmd, timeout = null) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let ret = null;
        yield new Promise((resolve, reject) => {
            let timeouted = null;
            if (timeout !== null) {
                timeouted = setTimeout(() => {
                    // kill shell process
                    //killCmd = `pkill -f ${cmd.split(' ')[0]}`; // TODO: voir si on peut killer tous les fils shell (de script.ts), si possible en matchant un pattern
                    //await cmdExec(killCmd);
                    reject({ message: `command timeouted (${Math.round(10 * timeout / 1000) / 10}) sec.` });
                }, timeout);
            }
            (0, child_process_1.exec)(cmd, (error, stdout, stderr) => {
                if (timeouted) {
                    clearTimeout(timeouted);
                }
                if (error) {
                    //console.error(`${now()} [${colors.red('ERROR')}] [cmdExec] Error while running exec command : ${error.message.trim()}`);
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
            console.error(`${now()} [${safe_1.default.red('ERROR')}] [cmdExec] catched while running exec command => ${safe_1.default.red(err.message)}`);
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
function createLruCache(maxEntries = 20, store = new Map()) {
    // source: https://gist.github.com/dherges/86012049be7b1263b2e594134ff5816a
    function put(key, value) {
        if (store.size >= maxEntries) {
            const keyToDelete = store.keys().next().value;
            store.delete(keyToDelete);
        }
        store.set(key, value);
    }
    function get(key) {
        const hasKey = store.has(key);
        if (!hasKey)
            return undefined;
        const entry = store.get(key);
        store.delete(key);
        store.set(key, entry);
        return entry;
    }
    return {
        put,
        get,
        maxEntries,
        store,
    };
}
exports.createLruCache = createLruCache;
function getLocalIpAddresses() {
    const interfaces = os_1.default.networkInterfaces();
    let ifName;
    const addresses = [];
    for (ifName in interfaces) {
        let interfaceInfos = interfaces[ifName];
        interfaceInfos = (interfaceInfos || []).filter(interfaceInfo => interfaceInfo.family === 'IPv4');
        const interfaceAddresses = interfaceInfos.map(interfaceInfo => interfaceInfo.address);
        addresses.push(...interfaceAddresses);
    }
    return addresses;
}
exports.getLocalIpAddresses = getLocalIpAddresses;
function buildRpcRequest(id, method, params = []) {
    const req = {
        jsonrpc: "2.0",
        id,
        method,
        params
    };
    return req;
}
exports.buildRpcRequest = buildRpcRequest;
function buildRpcResponse(id, result = null) {
    //if (typeof result === 'object') {
    //    result = JSON.stringify(result);
    //}
    const res = {
        jsonrpc: "2.0",
        id,
        result
    };
    return res;
}
exports.buildRpcResponse = buildRpcResponse;
function buildRpcError(id, err) {
    const res = {
        jsonrpc: "2.0",
        id,
        error: {
            code: err.code || -1,
            message: err.message || '',
        }
    };
    return res;
}
exports.buildRpcError = buildRpcError;
function stripFinalNewline(input) {
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
exports.stripFinalNewline = stripFinalNewline;
function sleep(delay) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, delay);
        });
    });
}
exports.sleep = sleep;
function downloadFile(url, targetFile) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield (0, node_fetch_1.default)(url);
        const fileStream = fs_1.default.createWriteStream(targetFile);
        return new Promise((resolve, reject) => {
            res.body.pipe(fileStream);
            res.body.on("error", reject);
            //res.body.on('read', .....) // show progress ?
            fileStream.on("finish", resolve);
        });
    });
}
exports.downloadFile = downloadFile;
;
