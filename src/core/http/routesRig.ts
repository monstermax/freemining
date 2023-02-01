
import fs from 'fs';
import path from 'path';
//import os from 'os';
//import colors from 'colors/safe';
import type express from 'express';

import { now, formatNumber } from '../../common/utils';
import * as Rig from '../../rig/Rig';
import * as Daemon from '../../core/Daemon';


/* ########## MAIN ######### */

const SEP = path.sep;
const utilFuncs = {
    now,
    formatNumber,
};


/* ########## FUNCTIONS ######### */

export function registerRigRoutes(app: express.Express, urlPrefix: string='') {

    // GET Rig homepage => /rig/
    app.get(`${urlPrefix}/`, async (req: express.Request, res: express.Response, next: Function) => {
        const config = Daemon.getConfig();
        const monitorStatus = Rig.monitorStatus(config);
        const allMiners = await Rig.getAllMiners(config);
        const rigInfos = Rig.getRigInfos();

        // variables à ne plus utiliser... (utiliser allMiners à la place)
        const runningMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].running).map(entry => entry[0]);
        const installedMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].installed).map(entry => entry[0]);
        const installableMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].installable).map(entry => entry[0]);
        const runnableMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].runnable).map(entry => entry[0]);
        const managedMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].managed).map(entry => entry[0]);

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Rig Manager`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}rig${SEP}rig.html`,
            rigInfos,
            monitorStatus,
            allMiners,
            installedMiners,
            runningMiners,
            installableMiners,
            runnableMiners,
            managedMiners,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });


    // GET Rig status => /rig/status
    app.get(`${urlPrefix}/status`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const rigStatus = Rig.monitorStatus();
        const rigInfos = Rig.getRigInfos();

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Rig Manager - Rig Status`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}rig${SEP}rig_status.html`,
            rigStatus,
            rigInfos,
            //monitorStatus,
            //installedMiners,
            //runningMiners,
            //installableMiners,
            //runnableMiners,
            //managedMiners,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });

    // GET Rig status JSON => /rig/status.json
    app.get(`${urlPrefix}/status.json`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const rigInfos = Rig.getRigInfos();
        let content = JSON.stringify(rigInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    });


    // GET Rig farm-agent start => /rig/farm-agent-start
    app.get(`${urlPrefix}/farm-agent-start`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        //Rig.farmAgentStart(config);
        res.send('Rig farm-agent started [TODO]');
    });

    // GET Rig farm-agent stop => /rig/farm-agent-stop
    app.get(`${urlPrefix}/farm-agent-stop`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        //Rig.farmAgentStop(config);
        res.send('Rig farm-agent stopped [TODO]');
    });


    // GET Rig monitor run => /rig/monitor-run
    app.get(`${urlPrefix}/monitor-run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        //const config = Daemon.getConfig();
        const rigStatus = Rig.monitorStatus();

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Rig Manager - Monitor run`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}rig${SEP}monitor_run.html`,
            rigStatus,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });

    // POST Rig monitor run => /rig/monitor-run
    app.post(`${urlPrefix}/monitor-run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        const action = req.body.action?.toString() || '';
        const rigStatus = Rig.monitorStatus();

        if (action === 'start') {
            if (rigStatus) {
                res.send('OK: Rig monitor is running');

            } else {
                Rig.monitorStart(config);
                res.send('OK: Rig monitor started');
            }
            return;

        } else if (action === 'stop') {
            if (rigStatus) {
                Rig.monitorStop(config);
                res.send('OK: Rig monitor stopped');

            } else {
                res.send('OK: Rig monitor is not running');
            }
            return;
        }

        res.send(`Error: invalid action`);
    });


    // GET Miner install page => /rig/miners/{minerName}/install
    app.get(`${urlPrefix}/miners/:minerName/install`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const minerName = req.params.minerName;
        //const action = req.query.action?.toString() || '';

        const config = Daemon.getConfig();
        const rigInfos = Rig.getRigInfos();
        const minerInfos = rigInfos.minersInfos[minerName];
        const minerStatus = Rig.minerRunStatus(config, { miner: minerName });
        const allMiners = await Rig.getAllMiners(config);

        const installStatus = false;
        const uninstallStatus = false;

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Rig Manager - Miner install`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}rig${SEP}miner_install.html`,
            rigInfos,
            miner: minerName,
            minerStatus,
            minerInfos,
            allMiners,
            installStatus,
            uninstallStatus,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);

    });

    // POST Miner install page => /rig/miners/{minerName}/install
    app.post(`${urlPrefix}/miners/:minerName/install`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const minerName = req.params.minerName;
        const action = req.body.action?.toString() || '';

        const config = Daemon.getConfig();
        //const rigInfos = Rig.getRigInfos();
        //const minerInfos = rigInfos.minersInfos[minerName];
        const minerStatus = Rig.minerRunStatus(config, { miner: minerName });

        if (action === 'start') {
            if (! minerName) {
                res.send(`Error: missing 'miner' parameter`);
                return;
            }

            if (minerStatus) {
                res.send(`Error: cannot start miner install while it is running`);
                return;
            }

            const params = {
                miner: minerName,
            };

            try {
                await Rig.minerInstallStart(config, params);
                res.send(`OK: miner install started`);

            } catch (err: any) {
                res.send(`Error: cannot start miner install => ${err.message}`);
            }
            return;
        }

        res.send(`Error: invalid action`);
    });


    // GET Miner run page => /rig/miners/{minerName}/run
    app.get(`${urlPrefix}/miners/:minerName/run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const minerName = req.params.minerName;
        const action = req.query.action?.toString() || '';

        const config = Daemon.getConfig();
        const rigStatus = Rig.monitorStatus();
        const rigInfos = Rig.getRigInfos();
        const minerInfos = rigInfos.minersInfos[minerName];
        const minerStatus = Rig.minerRunStatus(config, { miner: minerName });
        const allMiners = await Rig.getAllMiners(config);

        if (action === 'log') {
            //res.send( `not yet available` );
            res.header('Content-Type', 'text/plain');
            const log = await Rig.minerRunLog(config, { miner: minerName, lines: 50 });
            res.send(log);
            return;

        } else if (action === 'status') {
            if (! rigStatus) {
                res.send( `Warning: JSON status requires rig monitor to be started. Click here to <a href="/rig/monitor-start">start monitor</a>` );
                return;
            }
            if (! allMiners[minerName]) {
                res.send( `Warning: invalid miner` );
                return;
            }
            if (! minerStatus) {
                res.send( `Warning: this miner is not running` );
                return;
            }
            if (! allMiners[minerName].managed) {
                res.send( `Warning: this miner is not managed` );
                return;
            }
            if (! minerInfos) {
                res.send( `Warning: data not yet available` );
                return;
            }
            res.header('Content-Type', 'application/json');
            res.send( JSON.stringify(minerInfos) );
            return;
        }

        //if (! minerInfos) {
        //    res.send(`Error: miner is not running or is not managed or rig monitor is not started or miner API is not loaded`);
        //    return;
        //}

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Rig Manager - Miner run`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}rig${SEP}miner_run.html`,
            rigStatus,
            rigInfos,
            miner: minerName,
            minerStatus,
            minerInfos,
            allMiners,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });

    // POST Miner run page => /rig/miners/{minerName}/run
    app.post(`${urlPrefix}/miners/:minerName/run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const minerName = req.params.minerName;
        const action = req.body.action?.toString() || '';

        const config = Daemon.getConfig();
        //const rigInfos = Rig.getRigInfos();
        //const minerInfos = rigInfos.minersInfos[minerName];
        const minerStatus = Rig.minerRunStatus(config, { miner: minerName });

        const algo = req.body.algo?.toString() || '';
        const poolUrl = req.body.poolUrl?.toString() || '';
        const poolUser = req.body.poolUser?.toString() || '';
        const extraArgs = (req.body.extraArgs?.toString() || '').split(' ').filter((arg: string) => !!arg);

        if (action === 'start') {
            if (! minerName || ! algo || ! poolUrl || ! poolUser) {
                res.send(`Error: missing parameters`);
                return;
            }

            const params = {
                miner: minerName,
                algo,
                poolUrl,
                poolUser,
                extraArgs,
            };

            try {
                await Rig.minerRunStart(config, params);
                res.send(`OK: miner run started`);

            } catch (err: any) {
                res.send(`Error: cannot start miner run => ${err.message}`);
            }
            return;

        } else if (action === 'stop') {
            if (! minerName) {
                res.send(`Error: missing parameters`);
                return;
            }

            if (!minerStatus) {
                res.send(`Error: cannot stop miner run while it is not running`);
                return;
            }

            const params = {
                miner: minerName,
            };

            try {
                Rig.minerRunStop(config, params);
                res.send(`OK: miner run stopped`);

            } catch (err: any) {
                res.send(`Error: cannot stop miner run => ${err.message}`);
            }
            return;
        }

        res.send(`Error: invalid action`);
    });


    app.get(`${urlPrefix}/miners-run-modal`, async (req: express.Request, res: express.Response, next: Function) => {
        const minerName = req.query.miner as string || '';

        const config = Daemon.getConfig();
        const rigInfos = Rig.getRigInfos();
        const allMiners = await Rig.getAllMiners(config);
        const runningMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].running).map(entry => entry[0]);
        const runnableMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].runnable).map(entry => entry[0]);
        const installedMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].installed).map(entry => entry[0]);

        if (! rigInfos) {
            res.send(`Rig not initialized`);
            res.end();
            return;
        }

        let presets = {};
        const poolsFilePath = `${config.confDir}${SEP}rig${SEP}pools.json`;
        if (fs.existsSync(poolsFilePath)) {
            presets = require(poolsFilePath);
        }

        const data = {
            ...utilFuncs,
            rigName: rigInfos.infos.name,
            rigInfos,
            miners: allMiners,
            runnableMiners,
            runningMiners,
            installedMiners,
            presets,
            miner: minerName,
        };
        res.render(`.${SEP}rig${SEP}run_miner_modal.html`, data);
    });


}
