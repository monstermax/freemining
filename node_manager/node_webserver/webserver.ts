
import fs from 'fs';
import express from 'express';
import * as http from 'http';
import colors from 'colors/safe';

import { now, stringTemplate, applyHtmlLayout } from './common/utils';


/* ############################## MAIN ###################################### */


const app = express();
const server = http.createServer(app);

const configNode: any = require('../node_manager.json');
const configFrm: any = require('../../freemining.json');

const httpServerHost: string = configNode.nodeServer?.host || '0.0.0.0';
const httpServerPort: number = Number(configNode.nodeServer?.port || 4400);

let staticDir: string = configNode.nodeServer?.root || `${__dirname}/web/public`;
let templatesDir: string = configNode.nodeServer?.templates || `${__dirname}/web/templates`;


const nodeAppDir = __dirname + '/..'; // configFrm.frmDataDir + '/node';
const ctx: any = {
    ...configFrm,
    ...configNode,
    nodeAppDir,
};
templatesDir = stringTemplate(templatesDir, ctx, false, true, true) || '';
staticDir = stringTemplate(staticDir, ctx, false, true, true) || '';

const layoutPath = `${templatesDir}/layout_node_webserver.html`;


app.use(express.urlencoded({ extended: true }));


if (staticDir) {
    console.log(`${now()} [${colors.blue('INFO')}] Using static folder ${staticDir}`);
    console.log(`${now()} [${colors.blue('INFO')}] Using templates folder ${templatesDir}`);
    app.use(express.static(staticDir));
}


app.get('/', (req: express.Request, res: express.Response, next: Function) => {
    const opts = {
        configNode,
    };
    const pageContent = loadTemplate('index.html', opts, req.url);
    res.send( pageContent );
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

