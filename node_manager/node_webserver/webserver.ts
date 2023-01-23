
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

const toolsDir = `${__dirname}/../tools`;
const cmdFullnode = `${toolsDir}/fullnode.sh`;
const cmdInstallFullnode = `${toolsDir}/install_fullnode.sh`;
const cmdUninstallFullnode = `${toolsDir}/uninstall_fullnode.sh`; // not available


app.use(function (req: express.Request, res: express.Response, next: Function) {
    // Log http request
    console.log(`${now()} [${colors.blue('INFO')}] ${req.method.toLocaleUpperCase()} ${req.url}`);

    next();
});

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
    const action = req.query.action as string || '';

    const fullnodeStatus = await getFullnodeStatus(fullnodeName);

    if (action === 'log') {
        // TODO: show install log
        res.send(`Error: log is not available`);
        res.end();
        return;
    }

    const installStatus = await getFullnodeInstallStatus(fullnodeName);

    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
        installStatus,
    };
    const pageContent = loadTemplate('fullnode_install.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


app.post('/fullnodes/fullnode-install', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';
    const action = req.body.action as string || '';

    const fullnodeStatus = await getFullnodeStatus(fullnodeName);

    if (action === 'start') {
        if (fullnodeStatus) {
            res.send("Error: cannot re-intall a running fullnode");
            res.end();
            return;
        }

        const ok = await startFullnodeInstall(fullnodeName);

        if (ok) {
            res.send(`OK: install started`);

        } else {
            res.send(`ERROR: cannot start install`);
        }

        res.end();
        return;

    } else if (action === 'stop') {
        // TODO: stop install
        res.send(`Error: stop is not available`);
        res.end();
        return;

    } else {
        res.send(`Error: unknown action`);
        res.end();
        return;
    }
});


app.get('/fullnodes/fullnode-uninstall', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';
    const action = req.query.action as string || '';

    const fullnodeStatus = await getFullnodeStatus(fullnodeName);

    if (action === 'log') {
        // TODO: show uninstall log
        res.send(`Error: log is not available`);
        res.end();
        return;

    }

    const uninstallStatus = await getFullnodeUninstallStatus(fullnodeName);

    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
        uninstallStatus,
    };
    const pageContent = loadTemplate('fullnode_uninstall.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


app.post('/fullnodes/fullnode-uninstall', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';
    const action = req.body.action as string || '';

    const fullnodeStatus = await getFullnodeStatus(fullnodeName);

    if (action === 'start') {
        if (fullnodeStatus) {
            res.send("Error: cannot uninstall a running fullnode");
            res.end();
            return;
        }

        const ok = await startFullnodeUninstall(fullnodeName);

        if (ok) {
            res.send(`OK: uninstall started`);

        } else {
            res.send(`ERROR: cannot start uninstall`);
        }

        res.end();
        return;

    } else if (action === 'stop') {
        // TODO: stop uninstall
        res.send(`Error: stop is not available`);
        res.end();
        return;

    } else {
        res.send(`Error: unknown action`);
        res.end();
        return;
    }
});


app.get('/fullnodes/fullnode', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';

    const fullnodeStatus = await getFullnodeStatus(fullnodeName);

    const installStatus = await getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = await getFullnodeUninstallStatus(fullnodeName);

    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
        installStatus,
        uninstallStatus,
    };
    const pageContent = loadTemplate('fullnode.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


app.get('/fullnodes/fullnode-status', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';
    const asJson = req.query.json === "1";
    const rawOutput = req.query.raw === "1";

    const fullnodeStatus = await getFullnodeStatus(fullnodeName);

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



async function getFullnodeStatus(fullnodeName: string): Promise<boolean> {
    const cmd = `${cmdFullnode} ${fullnodeName} status`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return !!ret;
}



async function startFullnodeInstall(fullnodeName: string): Promise<boolean> {
    const cmd = `${cmdInstallFullnode} ${fullnodeName} --daemon start`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return !!ret;
}


async function stopFullnodeInstall(fullnodeName: string): Promise<boolean> {
    const cmd = `${cmdInstallFullnode} ${fullnodeName} --daemon stop`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return !!ret;
}


async function getFullnodeInstallStatus(fullnodeName: string): Promise<boolean> {
    const cmd = `${cmdInstallFullnode} ${fullnodeName} --daemon status`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return !!ret;
}


async function startFullnodeUninstall(fullnodeName: string): Promise<boolean> {
    const cmd = `${cmdUninstallFullnode} ${fullnodeName} --daemon start`;

    return false;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return !!ret;
}


async function stopFullnodeUninstall(fullnodeName: string): Promise<boolean> {
    const cmd = `${cmdUninstallFullnode} ${fullnodeName} --daemon stop`;

    return false;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return !!ret;
}



async function getFullnodeUninstallStatus(fullnodeName: string): Promise<boolean> {
    const cmd = `${cmdInstallFullnode} ${fullnodeName} --daemon status`;

    return false;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return !!ret;
}
