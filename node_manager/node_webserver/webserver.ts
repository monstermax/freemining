
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
let installedFullnodes = (process.env.INSTALLED_FULLNODES || '').split(' ');
const configuredFullnodes = (process.env.CONFIGURED_FULLNODES || '').split(' ');

const toolsDir = `${__dirname}/../tools`;
const cmdFullnode = `${toolsDir}/run_fullnode.sh`;
const cmdInstallFullnode = `${toolsDir}/install_fullnode.sh`;
const cmdUninstallFullnode = `${toolsDir}/uninstall_fullnode.sh`;


// LOG HTTP REQUEST
app.use(function (req: express.Request, res: express.Response, next: Function) {
    console.log(`${now()} [${colors.blue('INFO')}] ${req.method.toLocaleUpperCase()} ${req.url}`);

    next();
});

app.use(express.urlencoded({ extended: true })); // parse POST body


// STATIC DIR
if (staticDir) {
    console.log(`${now()} [${colors.blue('INFO')}] Using static folder ${staticDir}`);
    console.log(`${now()} [${colors.blue('INFO')}] Using templates folder ${templatesDir}`);
    app.use(express.static(staticDir));
}


// HOMEPAGE
app.get('/', async (req: express.Request, res: express.Response, next: Function) => {
    const installablesFullnodes = (process.env.INSTALLABLE_FULLNODES || '').split(' ');
    const installedFullnodes = await getInstalledFullnodes();
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



// GET FULLNODE
app.get('/fullnodes/fullnode', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';

    if (! fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }

    const fullnodeStatus = await getFullnodeStatus(fullnodeName);
    const installStatus = await getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = await getFullnodeUninstallStatus(fullnodeName);
    const installedFullnodes = await getInstalledFullnodes();

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


// GET FULLNODE-STATUS
app.get('/fullnodes/fullnode-status', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';
    const asJson = req.query.json === "1";
    const rawOutput = req.query.raw === "1";

    if (! fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }

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


// GET FULLNODE-RUN
app.get('/fullnodes/fullnode-run', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';
    const action = req.query.action as string || '';

    if (! fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }

    const fullnodeStatus = await getFullnodeStatus(fullnodeName);

    if (action === 'log') {
        const logs = await getFullnodeLogs(fullnodeName);

        res.header({'Content-Type': 'text/plain'});
        res.send(logs);
        res.end();
        return;
    }

    const installStatus = await getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = await getFullnodeUninstallStatus(fullnodeName);
    const installedFullnodes = await getInstalledFullnodes();

    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installStatus,
        uninstallStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
    };
    const pageContent = loadTemplate('fullnode_run.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


// POST FULLNODE-RUN
app.post('/fullnodes/fullnode-run', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';
    const action = req.body.action as string || '';

    if (! fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }

    const fullnodeStatus = await getFullnodeStatus(fullnodeName);
    const installStatus = await getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = await getFullnodeUninstallStatus(fullnodeName);

    if (action === 'start') {
        if (fullnodeStatus) {
            res.send("Error: cannot start a running fullnode");
            res.end();
            return;
        }
        if (installStatus) {
            res.send("Error: cannot start a fullnode while an install is running");
            res.end();
            return;
        }
        if (uninstallStatus) {
            res.send("Error: cannot start a fullnode while an uninstall is running");
            res.end();
            return;
        }

        const ok = await startFullnode(fullnodeName);

        if (ok) {
            res.send(`OK: fullnode started`);

        } else {
            res.send(`ERROR: cannot start fullnode`);
        }

        res.end();
        return;

    } else if (action === 'stop') {
        if (! fullnodeStatus) {
            res.send("Error: cannot stop a non-running fullnode");
            res.end();
            return;
        }

        const ok = await stopFullnode(fullnodeName);

        if (ok) {
            res.send(`OK: fullnode stopped`);

        } else {
            res.send(`ERROR: cannot stop fullnode`);
        }

        res.end();
        return;

    } else {
        res.send(`Error: unknown action`);
        res.end();
        return;
    }
});



// GET FULLNODE-INSTALL
app.get('/fullnodes/fullnode-install', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';
    const action = req.query.action as string || '';

    if (! fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }

    const fullnodeStatus = await getFullnodeStatus(fullnodeName);

    if (action === 'log') {
        const logs = await getFullnodeInstallLogs(fullnodeName);

        res.header({'Content-Type': 'text/plain'});
        res.send(logs);
        res.end();
        return;
    }

    const installStatus = await getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = await getFullnodeUninstallStatus(fullnodeName);
    const installedFullnodes = await getInstalledFullnodes();

    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installStatus,
        uninstallStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
    };
    const pageContent = loadTemplate('fullnode_install.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


// POST FULLNODE-INSTALL
app.post('/fullnodes/fullnode-install', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';
    const action = req.body.action as string || '';

    if (! fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }

    const fullnodeStatus = await getFullnodeStatus(fullnodeName);
    const installStatus = await getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = await getFullnodeUninstallStatus(fullnodeName);

    if (action === 'start') {
        if (fullnodeStatus) {
            res.send("Error: cannot install a running fullnode");
            res.end();
            return;
        }
        if (installStatus) {
            res.send("Error: cannot install a fullnode while another install is running");
            res.end();
            return;
        }
        if (uninstallStatus) {
            res.send("Error: cannot install a fullnode while an uninstall is running");
            res.end();
            return;
        }

        const ok = await startFullnodeInstall(fullnodeName);

        // TODO: voir pour raffraichir la liste installedFullnodes (mettre à null pour provoquer un rechargement au prochain getInstalledFullnodes)

        if (ok) {
            res.send(`OK: install started`);

        } else {
            res.send(`ERROR: cannot start install`);
        }

        res.end();
        return;

    } else if (action === 'stop') {
        if (! installStatus) {
            res.send("Error: cannot stop a non-running install");
            res.end();
            return;
        }

        const ok = await stopFullnodeInstall(fullnodeName);

        if (ok) {
            res.send(`OK: install stopped`);

        } else {
            res.send(`ERROR: cannot stop install`);
        }

        res.end();
        return;

    } else {
        res.send(`Error: unknown action`);
        res.end();
        return;
    }
});


// GET FULLNODE-UNINSTALL
app.get('/fullnodes/fullnode-uninstall', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';
    const action = req.query.action as string || '';

    if (! fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }

    const fullnodeStatus = await getFullnodeStatus(fullnodeName);

    if (action === 'log') {
        const logs = await getFullnodeUninstallLogs(fullnodeName);

        res.header({'Content-Type': 'text/plain'});
        res.send(logs);
        res.end();
        return;
    }

    const installStatus = await getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = await getFullnodeUninstallStatus(fullnodeName);
    const installedFullnodes = await getInstalledFullnodes();

    const opts = {
        configNode,
        chain: fullnodeName,
        fullnodeStatus,
        installStatus,
        uninstallStatus,
        installablesFullnodes,
        installedFullnodes,
        configuredFullnodes,
    };
    const pageContent = loadTemplate('fullnode_uninstall.html', opts, req.url);
    res.send( pageContent );
    res.end();
});


// POST FULLNODE-UNINSTALL
app.post('/fullnodes/fullnode-uninstall', async (req: express.Request, res: express.Response, next: Function) => {
    const fullnodeName = req.query.chain as string || '';
    const action = req.body.action as string || '';

    if (! fullnodeName) {
        res.send(`Error: missing {chain} parameter`);
        res.end();
        return;
    }

    const fullnodeStatus = await getFullnodeStatus(fullnodeName);
    const installStatus = await getFullnodeInstallStatus(fullnodeName);
    const uninstallStatus = await getFullnodeUninstallStatus(fullnodeName);

    if (action === 'start') {
        if (fullnodeStatus) {
            res.send("Error: cannot uninstall a running fullnode");
            res.end();
            return;
        }
        if (installStatus) {
            res.send("Error: cannot uninstall a fullnode while an install is running");
            res.end();
            return;
        }
        if (uninstallStatus) {
            res.send("Error: cannot uninstall a fullnode while another uninstall is running");
            res.end();
            return;
        }

        const ok = await startFullnodeUninstall(fullnodeName);

        // TODO: voir pour raffraichir la liste installedFullnodes (mettre à null pour provoquer un rechargement au prochain getInstalledFullnodes)

        if (ok) {
            res.send(`OK: uninstall started`);

        } else {
            res.send(`ERROR: cannot start uninstall`);
        }

        res.end();
        return;

    } else if (action === 'stop') {
        if (! uninstallStatus) {
            res.send("Error: cannot stop a non-running uninstall");
            res.end();
            return;
        }

        const ok = await stopFullnodeUninstall(fullnodeName);

        if (ok) {
            res.send(`OK: uninstall stopped`);

        } else {
            res.send(`ERROR: cannot stop uninstall`);
        }

        res.end();
        return;

    } else {
        res.send(`Error: unknown action`);
        res.end();
        return;
    }
});



// ERROR 404
app.use(function (req: express.Request, res: express.Response, next: Function) {
    console.log(`${now()} [${colors.yellow('WARNING')}] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);

    next();
});


// LISTEN
server.listen(httpServerPort, httpServerHost, () => {
    console.log(`${now()} [${colors.blue('INFO')}] Server started on ${httpServerHost}:${httpServerPort}`);
});


/* ############################ FUNCTIONS ################################### */



// FULLNODE RUN
async function startFullnode(fullnodeName: string) {
    const cmd = `${cmdFullnode} ${fullnodeName} start`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return !!ret;
}


async function stopFullnode(fullnodeName: string) {
    const cmd = `${cmdFullnode} ${fullnodeName} stop`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return !!ret;
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


async function getFullnodeLogs(fullnodeName: string): Promise<string> {
    const cmd = `${cmdFullnode} ${fullnodeName} log -n 50`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return ret || '';
}



// FULLNODE INSTALL
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


async function getFullnodeInstallLogs(fullnodeName: string): Promise<string> {
    const cmd = `${cmdInstallFullnode} ${fullnodeName} --daemon log -n 50`;

    console.log(`${now()} [DEBUG] executing command: ${cmd}`);
    const ret = await cmdExec(cmd, 10_000);

    if (ret) {
        console.log(`${now()} [DEBUG] command result: ${ret}`);

    } else {
        console.log(`${now()} [DEBUG] command result: ERROR`);
    }

    return ret || '';
}


// FULLNODE UNINSTALL
async function startFullnodeUninstall(fullnodeName: string): Promise<boolean> {
    const cmd = `${cmdUninstallFullnode} ${fullnodeName} -y`;

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
    //const cmd = `${cmdUninstallFullnode} ${fullnodeName} --daemon stop`;
    return false;
}


async function getFullnodeUninstallStatus(fullnodeName: string): Promise<boolean> {
    //const cmd = `${cmdUninstallFullnode} ${fullnodeName} --daemon status`;
    return false;
}


async function getFullnodeUninstallLogs(fullnodeName: string): Promise<string> {
    //const cmd = `${cmdUninstallFullnode} ${fullnodeName} log -n 50`;
    return '';
}



// MISC
function loadTemplate(tplFile: string, data: any={}, currentUrl:string=''): string | null {
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


async function getInstalledFullnodes(): Promise<string[]> {
    //if (installedFullnodes === null) {
    //    installedFullnodes = (process.env.INSTALLED_FULLNODES || '').split(' ');
    //}

    const cmd = `bash -c "source /home/karma/dev/perso/freemining/node_manager/node_manager.sh; echo \\$INSTALLED_FULLNODES"`;
    const installedFullnodesList = await cmdExec(cmd);
    installedFullnodes = (installedFullnodesList || '').split(' ');

    return installedFullnodes;
}

