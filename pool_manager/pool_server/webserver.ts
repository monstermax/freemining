
import fs from 'fs';
import express from 'express';
import * as http from 'http';
import colors from 'colors/safe';

import { now, stringTemplate, applyHtmlLayout } from '../../common/javascript/utils';


const app = express();
const server = http.createServer(app);

const configPool: any = require('../pool_manager.json');
const configFrm: any = require('../../freemining.json');

const httpServerHost: string = configPool.poolServer?.host || '0.0.0.0';
const httpServerPort: number = Number(configPool.poolServer?.port || 4100);

let staticDir: string = configPool.poolServer?.root || `${__dirname}/web/public`;
let templatesDir: string = configPool.poolServer?.templates || `${__dirname}/web/templates`;
let engineWebsiteDir: string = configPool.poolServer?.poolsSiteDir || `${__dirname}/web/public`;


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
    app.use(express.static(staticDir));
}


app.get('/', (req: express.Request, res: express.Response, next: Function) => {
    const content = "Pool management";
    const pageContent = applyLayout(req, content, {});

    res.send( pageContent );
    res.end();
});


app.use('/pools', express.static(engineWebsiteDir));


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

