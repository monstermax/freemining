
import fs from 'fs';
import express from 'express';
import * as http from 'http';
import colors from 'colors/safe';

import { now, cmdExec, stringTemplate, applyHtmlLayout } from './common/utils';


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

const nodeManagerCmd = `${__dirname}/../node_manager.sh ps`;

const installablesFullnodes = (process.env.INSTALLABLE_FULLNODES || '').split(' ');
const installedFullnodes = (process.env.INSTALLED_FULLNODES || '').split(' ');
const configuredFullnodes = (process.env.CONFIGURED_FULLNODES || '').split(' ');




app.use(express.urlencoded({ extended: true }));


if (staticDir) {
    console.log(`${now()} [${colors.blue('INFO')}] Using static folder ${staticDir}`);
    console.log(`${now()} [${colors.blue('INFO')}] Using templates folder ${templatesDir}`);
    app.use(express.static(staticDir));
}


app.get('/', async (req: express.Request, res: express.Response, next: Function) => {
    const installablesFullnodes = (process.env.INSTALLABLE_FULLNODES || '').split(' ');
    const installedFullnodes = (process.env.INSTALLED_FULLNODES || '').split(' ');
    const activeProcesses: string = await getNodeProcesses();

    const opts = {
        configNode,
        activeProcesses,
        installablesFullnodes,
        installedFullnodes,
    };
    const pageContent = loadTemplate('index.html', opts, req.url);
    res.send( pageContent );
    res.end();
});





app.get('/fullnodes/fullnode-install', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';

    const fullnodeStatus = null; // TODO

    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
    };
    const pageContent = loadTemplate('fullnode_install.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


app.get('/fullnodes/fullnode-uninstall', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';

    const fullnodeStatus = null; // TODO

    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
    };
    const pageContent = loadTemplate('fullnode_uninstall.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


app.get('/fullnodes/fullnode', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';

    const fullnodeStatus = null; // TODO

    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
    };
    const pageContent = loadTemplate('fullnode.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


app.get('/fullnodes/fullnode-status', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';
    const asJson = req.query.json === "1";
    const rawOutput = req.query.raw === "1";

    const fullnodeStatus = null; // TODO

    if (rawOutput) {
        if (asJson) {
            res.header( {"Content-Type": "application/json"} );
        } else {
            res.header( {"Content-Type": "text/plain"} );
        }
        res.send( fullnodeStatus );
        res.end();
        return;
    }

    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
    };
    const pageContent = loadTemplate('fullnode_status.html', opts, req.url);
    res.send( pageContent );
    res.end();
});




app.get('/fullnodes/node', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain;

    const fullnodeStatus = null; // TODO

    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
    };
    const pageContent = loadTemplate('fullnode.html', opts, req.url);
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

    let content = '';
    try {
        const layoutTemplate = fs.readFileSync(tplPath).toString();
        content = stringTemplate(layoutTemplate, data) || '';

    } catch (err: any) {
        content = `Error: ${err.message}`;
    }

    const pageContent = applyHtmlLayout(content, data, layoutPath, currentUrl);
    return pageContent;
}


async function getNodeProcesses(): Promise<string> {
    const cmd = nodeManagerCmd;
    const result = await cmdExec(cmd);
    return result || '';
}

