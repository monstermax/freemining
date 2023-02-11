
import path from 'path';
//import os from 'os';
//import colors from 'colors/safe';
import type express from 'express';

import { now, formatNumber } from '../../common/utils';
import * as Node from '../../node/Node';
import * as Daemon from '../../core/Daemon';


/* ########## MAIN ######### */

const SEP = path.sep;
const utilFuncs = {
    now,
    formatNumber,
};


/* ########## FUNCTIONS ######### */

export function registerNodeRoutes(app: express.Express, urlPrefix: string='') {

    // NODE homepage => /node/
    app.get(`${urlPrefix}/`, async (req: express.Request, res: express.Response, next: Function) => {
        const config = Daemon.getConfig();
        const monitorStatus = Node.monitorGetStatus();
        const allFullnodes = await Node.getAllFullnodes(config);
        const nodeInfos = await Node.getNodeInfos(config);

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
        const config = Daemon.getConfig();
        const monitorStatus = Node.monitorGetStatus();
        const nodeInfos = await Node.getNodeInfos(config);

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Node Manager - Node Status`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}node${SEP}node_status.html`,
            monitorStatus,
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
        const config = Daemon.getConfig();
        const nodeInfos = await Node.getNodeInfos(config);
        let content = JSON.stringify(nodeInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    });



    // GET Node monitor run => /node/monitor-run
    app.get(`${urlPrefix}/monitor-run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        //const config = Daemon.getConfig();
        const monitorStatus = Node.monitorGetStatus();

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Node Manager - Monitor run`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}node${SEP}monitor_run.html`,
            monitorStatus,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });

    // POST Node monitor run => /node/monitor-run
    app.post(`${urlPrefix}/monitor-run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        const action = req.body.action?.toString() || '';
        const monitorStatus = Node.monitorGetStatus();

        if (action === 'start') {
            if (monitorStatus) {
                res.send('OK: Node monitor is running');

            } else {
                Node.monitorStart(config);
                res.send('OK: Node monitor started');
            }
            return;

        } else if (action === 'stop') {
            if (monitorStatus) {
                Node.monitorStop();
                res.send('OK: Node monitor stopped');

            } else {
                res.send('OK: Node monitor is not running');
            }
            return;
        }

        res.send(`Error: invalid action`);
    });



    // GET Fullnode install page => /node/fullnodes/{fullnodeName}/install
    app.get(`${urlPrefix}/fullnodes/:fullnodeName/install`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const fullnodeName = req.params.fullnodeName;
        //const action = req.query.action?.toString() || '';

        const config = Daemon.getConfig();
        const fullnodeConfig = Node.getInstalledFullnodeConfiguration(config, fullnodeName);
        const fullnodeAlias = req.query.alias?.toString() || fullnodeConfig.defaultAlias;
        const fullnodeFullName = `${fullnodeName}-${fullnodeAlias}`;

        const nodeInfos = await Node.getNodeInfos(config);
        const fullnodeInfos = nodeInfos.status?.fullnodesStats[fullnodeFullName];
        const fullnodeStatus = Node.fullnodeRunGetStatus(config, { fullnode: fullnodeName });
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
        const fullnodeConfig = Node.getInstalledFullnodeConfiguration(config, fullnodeName);
        const fullnodeAlias = req.query.alias?.toString() || fullnodeConfig.defaultAlias;
        const fullnodeFullName = `${fullnodeName}-${fullnodeAlias}`;

        //const nodeInfos = await Node.getNodeInfos(config);
        //const fullnodeInfos = nodeInfos.status?.fullnodesStats[fullnodeFullName];
        const fullnodeStatus = Node.fullnodeRunGetStatus(config, { fullnode: fullnodeName });

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
        const fullnodeConfig = Node.getInstalledFullnodeConfiguration(config, fullnodeName);
        const fullnodeAlias = req.query.alias?.toString() || fullnodeConfig.defaultAlias;
        const fullnodeFullName = `${fullnodeName}-${fullnodeAlias}`;

        const monitorStatus = Node.monitorGetStatus();
        const nodeInfos = await Node.getNodeInfos(config);
        const fullnodeInfos = nodeInfos.status?.fullnodesStats[fullnodeFullName];
        const fullnodeStatus = Node.fullnodeRunGetStatus(config, { fullnode: fullnodeName });
        const allFullnodes = await Node.getAllFullnodes(config);

        if (action === 'log') {
            //res.send( `not yet available` );
            res.header('Content-Type', 'text/plain');
            const log = await Node.fullnodeRunGetLog(config, { fullnode: fullnodeName, lines: 50 });
            res.send(log);
            return;

        } else if (action === 'status') {
            if (! monitorStatus) {
                res.send( `Warning: JSON status requires node monitor to be started. Click here to <a href="/node/monitor-start">start monitor</a>` );
                return;
            }
            if (! allFullnodes[fullnodeName]) {
                res.send( `Warning: invalid fullnode` );
                return;
            }
            if (! fullnodeStatus) {
                res.send( `Warning: this fullnode is not running` );
                return;
            }
            if (! allFullnodes[fullnodeName].managed) {
                res.send( `Warning: this fullnode is not managed` );
                return;
            }
            if (! fullnodeInfos) {
                res.send( `Warning: data not yet available` );
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
            monitorStatus,
            nodeInfos,
            fullnode: fullnodeName,
            fullnodeAlias,
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
        const fullnodeConfig = Node.getInstalledFullnodeConfiguration(config, fullnodeName);
        const fullnodeAlias = req.query.alias?.toString() || fullnodeConfig.defaultAlias;
        const fullnodeFullName = `${fullnodeName}-${fullnodeAlias}`;

        const fullnodeStatus = Node.fullnodeRunGetStatus(config, { fullnode: fullnodeName });

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
                Node.fullnodeRunStart(config, params);
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
