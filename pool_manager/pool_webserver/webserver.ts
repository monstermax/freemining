
import fs from 'fs';
import express from 'express';
import * as http from 'http';
import colors from 'colors/safe';
import fetch from 'node-fetch';


import { now, cmdExec, stringTemplate, applyHtmlLayout } from './common/utils';



/* ############################## MAIN ###################################### */


const app = express();
const server = http.createServer(app);

const configPool: any = require('../pool_manager.json');
const configFrm: any = require('../../freemining.json');

const engineApiUrl: string = configPool.poolWebserver?.apiProxyUrl || 'http://localhost:4000/api/';
const httpServerHost: string = configPool.poolWebserver?.host || '0.0.0.0';
const httpServerPort: number = Number(configPool.poolWebserver?.port || 4100);

let staticDir: string = configPool.poolWebserver?.root || `${__dirname}/web/public`;
let templatesDir: string = configPool.poolWebserver?.templates || `${__dirname}/web/templates`;
let engineWebsiteDir: string = configPool.poolWebserver?.poolsSiteDir || `${__dirname}/web/public`;

const poolAppDir = __dirname + '/..'; // configFrm.frmDataDir + '/pool';
const ctx: any = {
    ...configFrm,
    ...configPool,
    poolAppDir,
};
templatesDir = stringTemplate(templatesDir, ctx, false, true, true) || '';
staticDir = stringTemplate(staticDir, ctx, false, true, true) || '';
engineWebsiteDir = stringTemplate(engineWebsiteDir, ctx, false, true, true) || '';

const layoutPath = `${templatesDir}/layout_pool_webserver.html`;

const poolManagerCmd = `${__dirname}/../pool_manager.sh ps`;


app.use(express.urlencoded({ extended: true }));


if (staticDir) {
    console.log(`${now()} [${colors.blue('INFO')}] Using static folder ${staticDir}`);
    console.log(`${now()} [${colors.blue('INFO')}] Using templates folder ${templatesDir}`);
    console.log(`${now()} [${colors.blue('INFO')}] Using engineWebsite folder ${engineWebsiteDir}`);
    console.log(`${now()} [${colors.blue('INFO')}] Using engineApiUrl folder ${engineApiUrl}`);
    app.use(express.static(staticDir));
}


app.get('/', async (req: express.Request, res: express.Response, next: Function) => {
    const activeProcesses: string = await getPoolProcesses();

    const opts = {
        configPool,
        activeProcesses,
    };

    const pageContent = loadTemplate('index.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


app.use('/pools', express.static(engineWebsiteDir));


app.use('/api/', async function (req: express.Request, res: express.Response) {
    // Proxy to miningcore API
    try {
        const url = (engineApiUrl.endsWith('/') ? engineApiUrl.slice(0, -1) : engineApiUrl) + req.url
        const response = await fetch(url);
        const content = await response.text();
        res.send(content);

    } catch (err: any) {
        console.log(`ERROR: ${err.message}`);
        res.send('ERROR');
    }

    res.end();
});


app.use(function (req: express.Request, res: express.Response, next: Function) {
    // Error 404
    console.log(`${now()} [${colors.yellow('WARNING')}] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);

    next();
});

server.listen(httpServerPort, httpServerHost, () => {
    console.log(`${now()} [${colors.blue('INFO')}] Server started on ${httpServerHost}:${httpServerPort}`);
});


/* ############################ FUNCTIONS ################################### */



function loadTemplate(tplFile: string, data: any={}, currentUrl:string='') {
    const tplPath = `${templatesDir}/${tplFile}`;

    if (! fs.existsSync(tplPath)) {
        return null;
    }
    const layoutTemplate = fs.readFileSync(tplPath).toString();
    let content = stringTemplate(layoutTemplate, data) || '';

    const pageContent = applyHtmlLayout(content, data, layoutPath, currentUrl);
    return pageContent;
}


async function getPoolProcesses(): Promise<string> {
    const cmd = poolManagerCmd;
    const result = await cmdExec(cmd);
    return result || '';
}

