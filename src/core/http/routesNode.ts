
import path from 'path';
//import os from 'os';
//import colors from 'colors/safe';
import type express from 'express';

import { now } from '../../common/utils';
import * as Node from '../../node/Node';
import * as Daemon from '../../core/Daemon';


/* ########## MAIN ######### */

const SEP = path.sep;
const utilFuncs = {
    now,
};


/* ########## FUNCTIONS ######### */

export function registerNodeRoutes(app: express.Express, urlPrefix: string='') {

    // NODE homepage => /node/
    app.get(`${urlPrefix}/`, async (req: express.Request, res: express.Response, next: Function) => {
        const config = Daemon.getConfig();
        const monitorStatus = Node.monitorStatus(config);
        const allFullnodes = await Node.getAllFullnodes(config);
        const nodeInfos = Node.getNodeInfos();

        // variables à ne plus utiliser... (utiliser allFullnodes à la place)
        const runningFullnodes = Object.entries(allFullnodes).filter((entry: [string, any]) => entry[1].running).map(entry => entry[0]);
        const installedFullnodes = Object.entries(allFullnodes).filter((entry: [string, any]) => entry[1].installed).map(entry => entry[0]);
        const installableFullnodes = Object.entries(allFullnodes).filter((entry: [string, any]) => entry[1].installable).map(entry => entry[0]);
        const runnableFullnodes = Object.entries(allFullnodes).filter((entry: [string, any]) => entry[1].runnable).map(entry => entry[0]);
        const managedFullnodes = Object.entries(allFullnodes).filter((entry: [string, any]) => entry[1].managed).map(entry => entry[0]);


        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Node Manager`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}node${SEP}node.html`,
            nodeInfos,
            monitorStatus,
            allFullnodes,
            installedFullnodes,
            runningFullnodes,
            installableFullnodes,
            runnableFullnodes,
            managedFullnodes,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });


    // NODE status => /node/status
    app.get(`${urlPrefix}/status`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const nodeInfos = Node.getNodeInfos();

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Node Manager - Node Status`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}node${SEP}node_status.html`,
            nodeInfos,
            //monitorStatus,
            //installedFullnodes,
            //runningFullnodes,
            //installableFullnodes,
            //runnableFullnodes,
            //managedFullnodes,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });

    // NODE status JSON => /node/status.json
    app.get(`${urlPrefix}/status.json`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const nodeInfos = Node.getNodeInfos();
        let content = JSON.stringify(nodeInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    });


    // NODE monitor start => /node/monitor-start
    app.get(`${urlPrefix}/monitor-start`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        Node.monitorStart(config);
        res.send('Node monitor started');
    });

    // NODE monitor stop => /node/monitor-stop
    app.get(`${urlPrefix}/monitor-stop`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        Node.monitorStop(config);
        res.send('Node monitor stopped');
    });


    // GET Fullnode install page => /node/fullnodes/{fullnodeName}/install
    app.get(`${urlPrefix}/fullnodes/:fullnodeName/install`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const fullnodeName = req.params.fullnodeName;
        //const action = req.query.action?.toString() || '';

        const config = Daemon.getConfig();
        const nodeInfos = Node.getNodeInfos();
        const fullnodeInfos = nodeInfos.fullnodesInfos[fullnodeName];
        const fullnodeStatus = Node.fullnodeRunStatus(config, { fullnode: fullnodeName });
        const allFullnodes = await Node.getAllFullnodes(config);

        const installStatus = false;
        const uninstallStatus = false;

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Node Manager - Fullnode install`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}node${SEP}fullnode_install.html`,
            nodeInfos,
            fullnode: fullnodeName,
            fullnodeStatus,
            fullnodeInfos,
            allFullnodes,
            installStatus,
            uninstallStatus,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });

    // POST Fullnode install page => /node/fullnodes/{fullnodeName}/install
    app.post(`${urlPrefix}/fullnodes/:fullnodeName/install`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const fullnodeName = req.params.fullnodeName;
        const action = req.body.action?.toString() || '';

        const config = Daemon.getConfig();
        //const nodeInfos = Node.getNodeInfos();
        //const fullnodeInfos = nodeInfos.fullnodesInfos[fullnodeName];
        const fullnodeStatus = Node.fullnodeRunStatus(config, { fullnode: fullnodeName });

        if (action === 'start') {
            if (! fullnodeName) {
                res.send(`Error: missing 'fullnode' parameter`);
                return;
            }

            if (fullnodeStatus) {
                res.send(`Error: cannot start fullnode install while it is running`);
                return;
            }

            const params = {
                fullnode: fullnodeName,
            };

            try {
                await Node.fullnodeInstallStart(config, params);
                res.send(`OK: fullnode install started`);

            } catch (err: any) {
                res.send(`Error: cannot start fullnode install => ${err.message}`);
            }
            return;
        }

        res.send(`Error: invalid action`);
    });


    // GET Fullnode run page => /node/fullnodes/{fullnodeName}/run
    app.get(`${urlPrefix}/fullnodes/:fullnodeName/run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const fullnodeName = req.params.fullnodeName;
        const action = req.query.action?.toString() || '';

        const config = Daemon.getConfig();
        const nodeStatus = Node.monitorStatus();
        const nodeInfos = Node.getNodeInfos();
        const fullnodeInfos = nodeInfos.fullnodesInfos[fullnodeName];
        const fullnodeStatus = Node.fullnodeRunStatus(config, { fullnode: fullnodeName });
        const allFullnodes = await Node.getAllFullnodes(config);

        if (action === 'log') {
            // TODO
            res.send( `not yet available` );
            return;

        } else if (action === 'status') {
            if (! nodeStatus) {
                res.send( `Warning: JSON status requires node monitor to be started. Click here to <a href="/node/monitor-start">start monitor</a>` );
                return;
            }
            res.header('Content-Type', 'application/json');
            res.send( JSON.stringify(fullnodeInfos) );
            return;
        }

        //if (! fullnodeName) {
        //    res.send(`Error: missing 'fullnode' parameter`);
        //    return;
        //}

        //if (! fullnodeInfos) {
        //    res.send(`Error: fullnode is not running or is not managed or node monitor is not started or fullnode API is not loaded`);
        //    return;
        //}

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Node Manager - Fullnode run`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}node${SEP}fullnode_run.html`,
            nodeStatus,
            nodeInfos,
            fullnode: fullnodeName,
            fullnodeStatus,
            fullnodeInfos,
            allFullnodes,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });

    // POST Fullnode run page => /node/fullnodes/{fullnodeName}/run
    app.post(`${urlPrefix}/fullnodes/:fullnodeName/run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const fullnodeName = req.params.fullnodeName;
        const action = req.body.action?.toString() || '';

        const config = Daemon.getConfig();
        //const nodeInfos = Node.getNodeInfos();
        //const fullnodeInfos = nodeInfos.fullnodesInfos[fullnodeName];
        const fullnodeStatus = Node.fullnodeRunStatus(config, { fullnode: fullnodeName });

        if (action === 'start') {
            if (! fullnodeName) {
                res.send(`Error: missing parameters`);
                return;
            }

            if (fullnodeStatus) {
                res.send(`Error: cannot start fullnode run while it is already running`);
                return;
            }

            const params = {
                fullnode: fullnodeName,
            };

            try {
                await Node.fullnodeRunStart(config, params);
                res.send(`OK: fullnode run started`);

            } catch (err: any) {
                res.send(`Error: cannot start fullnode run => ${err.message}`);
            }
            return;

        } else if (action === 'stop') {
            if (! fullnodeName) {
                res.send(`Error: missing parameters`);
                return;
            }

            if (!fullnodeStatus) {
                res.send(`Error: cannot stop fullnode run while it is not running`);
                return;
            }

            const params = {
                fullnode: fullnodeName,
            };

            try {
                Node.fullnodeRunStop(config, params);
                res.send(`OK: fullnode run stopped`);

            } catch (err: any) {
                res.send(`Error: cannot stop fullnode run => ${err.message}`);
            }
            return;
        }

        res.send(`Error: invalid action`);
    });

}
