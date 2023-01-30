
import path from 'path';
//import os from 'os';
//import colors from 'colors/safe';
import type express from 'express';

import { now } from '../../common/utils';
import * as Rig from '../../rig/Rig';
import * as Daemon from '../../core/Daemon';


/* ########## MAIN ######### */

const SEP = path.sep;
const utilFuncs = {
    now,
};


/* ########## FUNCTIONS ######### */

export function registerRigRoutes(app: express.Express, urlPrefix: string='') {

    // RIG homepage => /rig/
    app.get(`${urlPrefix}/`, async (req: express.Request, res: express.Response, next: Function) => {
        const config = Daemon.getConfig();
        const installedMiners = await Rig.getInstalledMiners(config);

        const runningMiners = await Rig.getRunningMiners(config);
        const installableMiners = await Rig.getInstallableMiners(config);
        const runnableMiners = await Rig.getRunnableMiners(config);
        const managedMiners = await Rig.getManagedMiners(config);
        const monitorStatus = await Rig.monitorStatus(config);

        const rigInfos = Rig.getRigInfos();

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Rig Manager`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}rig${SEP}rig.html`,
            rigInfos,
            monitorStatus,
            installedMiners,
            runningMiners,
            installableMiners,
            runnableMiners,
            managedMiners,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });


    // RIG status => /rig/status
    app.get(`${urlPrefix}/status`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const rigInfos = Rig.getRigInfos();
        let html = `Rig status: <pre>${JSON.stringify(rigInfos, null, 4)}</pre>`;
        res.send(html);
    });

    // RIG status JSON => /rig/status.json
    app.get(`${urlPrefix}/status.json`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const rigInfos = Rig.getRigInfos();
        let content = JSON.stringify(rigInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    });


    // RIG monitor start => /rig/monitor-start
    app.get(`${urlPrefix}/monitor-start`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        Rig.monitorStart(config);
        res.send('Rig monitor started');
    });

    // RIG monitor stop => /rig/monitor-stop
    app.get(`${urlPrefix}/monitor-stop`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        Rig.monitorStop(config);
        res.send('Rig monitor stopped');
    });

    // Miner run page => /rig/miners-run
    app.get(`${urlPrefix}/miners-run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const action = req.query.action?.toString() || '';
        const minerName = req.query.miner?.toString() || '';
        const algo = req.query.algo?.toString() || '';
        const poolUrl = req.query.poolUrl?.toString() || '';
        const poolUser = req.query.poolUser?.toString() || '';

        const config = Daemon.getConfig();
        const rigInfos = Rig.getRigInfos();
        const minerInfos = rigInfos.minersInfos[minerName];

        if (action === 'start') {
            if (! minerName || ! algo || ! poolUrl || ! poolUser) {
                res.send(`Error: missing parameters`);
                return;
            }

            const params = {
                fullnode: minerName,
                algo,
                poolUrl,
                poolUser,
            };
            await Rig.minerRunStart(config, params);
            res.send(`OK`);
            return;

        } else if (action === 'stop') {
            if (! minerName) {
                res.send(`Error: missing parameters`);
                return;
            }

            const params = {
                fullnode: minerName,
            };
            await Rig.minerRunStop(config, params);
            res.send(`OK`);
            return;

        } else if (action !== '') {
            res.send(`Error: invalid action`);
        }

        if (! minerInfos) {
            res.send(`Error: miner is not running or is not managed or rig monitor is not started or miner API is not loaded`);
            return;
        }

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Rig Manager - Miner run`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}rig${SEP}miner_run.html`,
            rigInfos,
            minerInfos,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });

}
