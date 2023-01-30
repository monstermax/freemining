
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
        const installedFullnodes = await Node.getInstalledFullnodes(config);

        const runningFullnodes = await Node.getRunningFullnodes(config);
        const installableFullnodes = await Node.getInstallableFullnodes(config);
        const runnableFullnodes = await Node.getRunnableFullnodes(config);
        const managedFullnodes = await Node.getManagedFullnodes(config);
        const monitorStatus = await Node.monitorStatus(config);

        const nodeInfos = Node.getNodeInfos();

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Node Manager`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}node${SEP}node.html`,
            nodeInfos,
            monitorStatus,
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
        let html = `Node status: <pre>${JSON.stringify(nodeInfos, null, 4)}</pre>`;
        res.send(html);
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

    // Fullnode run page => /node/fullnodes-run
    app.get(`${urlPrefix}/fullnodes-run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const action = req.query.action?.toString() || '';
        const fullnodeName = req.query.fullnode?.toString() || '';

        const config = Daemon.getConfig();
        const nodeInfos = Node.getNodeInfos();
        const fullnodeInfos = nodeInfos.fullnodesInfos[fullnodeName];

        if (action === 'start') {
            if (! fullnodeName) {
                res.send(`Error: missing parameters`);
                return;
            }

            const params = {
                fullnode: fullnodeName,
            };
            await Node.fullnodeRunStart(config, params);
            res.send(`OK`);
            return;

        } else if (action === 'stop') {
            if (! fullnodeName) {
                res.send(`Error: missing parameters`);
                return;
            }

            const params = {
                fullnode: fullnodeName,
            };
            await Node.fullnodeRunStop(config, params);
            res.send(`OK`);
            return;

        } else if (action !== '') {
            res.send(`Error: invalid action`);
        }

        if (! fullnodeInfos) {
            res.send(`Error: fullnode is not running or is not managed or node monitor is not started or fullnode API is not loaded`);
            return;
        }

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Node Manager - Fullnode run`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}node${SEP}fullnode_run.html`,
            nodeInfos,
            fullnodeInfos,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });

}
