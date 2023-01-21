
import fs from 'fs';
import express from 'express';
import * as http from 'http';
import colors from 'colors/safe';
import fetch from 'node-fetch';


import { now, stringTemplate, applyHtmlLayout } from './common/utils';


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
templatesDir = stringTemplate(templatesDir, ctx, false, true, true);
staticDir = stringTemplate(staticDir, ctx, false, true, true);
engineWebsiteDir = stringTemplate(engineWebsiteDir, ctx, false, true, true);


/* ############################## MAIN ###################################### */


app.use(express.urlencoded({ extended: true }));


if (staticDir) {
    console.log(`${now()} [${colors.blue('INFO')}] Using static folder ${staticDir}`);
    console.log(`${now()} [${colors.blue('INFO')}] Using templates folder ${templatesDir}`);
    console.log(`${now()} [${colors.blue('INFO')}] Using engineWebsite folder ${engineWebsiteDir}`);
    console.log(`${now()} [${colors.blue('INFO')}] Using engineApiUrl folder ${engineApiUrl}`);
    app.use(express.static(staticDir));
}


app.get('/', (req: express.Request, res: express.Response, next: Function) => {
    const content = "Pool management";
    const pageContent = applyLayout(req, content, {});

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

function applyLayout(req: express.Request, content: string, opts: any={}) {
    const layoutPath = `${templatesDir}/layout_pool_webserver.html`;

    opts = opts || {};
    opts.body = opts.body || {};
    opts.body.content = content;
    opts.currentUrl = req.url;

    return applyHtmlLayout(layoutPath, opts);
}

