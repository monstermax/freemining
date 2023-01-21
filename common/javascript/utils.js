"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTemplate = exports.applyHtmlLayout = exports.now = exports.formatNumber = exports.stringTemplate = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
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
function formatNumber(n) {
    return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format(n);
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
function loadTemplate(templatesDir, tplFile, data = {}) {
    const tplPath = `${templatesDir}/${tplFile}`;
    if (!fs_1.default.existsSync(tplPath)) {
        return null;
    }
    const layoutTemplate = fs_1.default.readFileSync(tplPath).toString();
    let tplContent = stringTemplate(layoutTemplate, data);
    return tplContent;
}
exports.loadTemplate = loadTemplate;
