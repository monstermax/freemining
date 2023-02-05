
import fs from 'fs';
import path from 'path';
//import os from 'os';
//import colors from 'colors/safe';
import type express from 'express';

import { now, formatNumber } from '../../common/utils';
import * as Rig from '../../rig/Rig';
import * as Daemon from '../../core/Daemon';

import type * as t from '../../common/types';
import { config } from 'process';



/* ########## MAIN ######### */

const SEP = path.sep;
const utilFuncs = {
    now,
    formatNumber,
};


/* ########## FUNCTIONS ######### */


async function getRigData(): Promise<t.RigData> {
    const config = Daemon.getConfig();

    const rigData: t.RigData = {
        config,
        rigInfos: await Rig.getRigInfos(config),
        monitorStatus: Rig.monitorGetStatus(),
        allMiners: await Rig.getAllMiners(config),
        //farmAgentStatus: Rig.farmAgentGetStatus(),
        //farmAgentHostPort: `*hardcoded*`, // TODO: `${wsServerHost}:${wsServerPort}`
        //runningMinersAliases: Rig.getRunningMinersAliases(config),
        //rigConfig: { // TODO
        //    farmAgent: {
        //        host: '0.0.0.0',
        //        port: 0,
        //    },
        //},
    };
    return rigData;
}



/* ############################# */


export async function rigHomepage(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    //const config = Daemon.getConfig();
    const { config, monitorStatus, allMiners, rigInfos } = rigData;
    //const runningMinersAliases = rigInfos.status?.runningMinersAliases;

    // variables à ne plus utiliser... (utiliser allMiners à la place)
    const runningMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].running).map(entry => entry[0]);
    const installedMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].installed).map(entry => entry[0]);
    const installableMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].installable).map(entry => entry[0]);
    const runnableMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].runnable).map(entry => entry[0]);
    const managedMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].managed).map(entry => entry[0]);

    // installableMiners = rigInfos.

    const data = {
        ...utilFuncs,
        meta: {
            title: `Freemining - Rig Manager`,
            noIndex: false,
        },
        contentTemplate: `..${SEP}rig${SEP}rig.html`,
        ...rigData,
        installedMiners, // a supprimer
        runningMiners, // a supprimer
        installableMiners, // a supprimer
        runnableMiners, // a supprimer
        managedMiners, // a supprimer
    };
    res.render(`.${SEP}core${SEP}layout.html`, data);
}


export async function rigStatus(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const { config, monitorStatus, allMiners, rigInfos } = rigData;
    //const runningMinersAliases = rigInfos.status?.runningMinersAliases;

    const data = {
        ...utilFuncs,
        meta: {
            title: `Freemining - Rig Manager - Rig Status`,
            noIndex: false,
        },
        contentTemplate: `..${SEP}rig${SEP}rig_status.html`,
        rigInfos,
        //monitorStatus,
        //runningMinersAliases,
        //allMiners,
        //installedMiners,
        //runningMiners,
        //installableMiners,
        //runnableMiners,
        //managedMiners,
    };
    res.render(`.${SEP}core${SEP}layout.html`, data);
};


export function registerRigRoutes(app: express.Express, urlPrefix: string='') {

    // GET Rig homepage => /rig/
    app.get(`${urlPrefix}/`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        rigHomepage(await getRigData(), req, res, next);
    });


    // GET Rig status => /rig/status
    app.get(`${urlPrefix}/status`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        rigStatus(await getRigData(), req, res, next);
    });


    // GET Rig status JSON => /rig/status.json
    app.get(`${urlPrefix}/status.json`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        const rigInfos = await Rig.getRigInfos(config);
        let content = JSON.stringify(rigInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    });


    // GET Rig farm-agent start => /rig/farm-agent/run
    app.get(`${urlPrefix}/farm-agent/run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        const action = req.query.action?.toString() || '';

        if (action === 'start') {
            Rig.farmAgentStart(config);
            res.send('Rig farm-agent started [TODO]');
            return;

        } else if (action === 'stop') {
            Rig.farmAgentStop();
            res.send('Rig farm-agent started [TODO]');
            return;
        }

        res.send(`try action start/stop`);

        // TODO: afficher page html
    });

    // POST Rig farm-agent start => /rig/farm-agent/run
    app.post(`${urlPrefix}/farm-agent/run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        const action = req.body.action?.toString() || '';
        const farmAgentStatus = Rig.farmAgentGetStatus();

        if (action === 'start') {
            if (farmAgentStatus) {
                res.send('OK: Farm agent is running');

            } else {
                Rig.farmAgentStart(config);
                res.send('OK: Farm agent started');
            }
            return;

        } else if (action === 'stop') {
            if (farmAgentStatus) {
                Rig.farmAgentStop();
                res.send('OK: Farm agent stopped');

            } else {
                res.send('OK: Farm agent is not running');
            }
            return;
        }
    });


    // GET Rig monitor run => /rig/monitor-run
    app.get(`${urlPrefix}/monitor-run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        //const config = Daemon.getConfig();
        const monitorStatus = Rig.monitorGetStatus();

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Rig Manager - Monitor run`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}rig${SEP}monitor_run.html`,
            monitorStatus,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });

    // POST Rig monitor run => /rig/monitor-run
    app.post(`${urlPrefix}/monitor-run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        const action = req.body.action?.toString() || '';
        const monitorStatus = Rig.monitorGetStatus();

        if (action === 'start') {
            if (monitorStatus) {
                res.send('OK: Rig monitor is running');

            } else {
                Rig.monitorStart(config);
                res.send('OK: Rig monitor started');
            }
            return;

        } else if (action === 'stop') {
            if (monitorStatus) {
                Rig.monitorStop();
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
        const minerConfig = Rig.getInstalledMinerConfiguration(config, minerName);
        const minerAlias = req.query.alias?.toString() || minerConfig.defaultAlias;
        const minerFullName = `${minerName}-${minerAlias}`;

        const rigInfos = await Rig.getRigInfos(config);
        const minerInfos = rigInfos.status?.minersStats[minerFullName];
        const minerStatus = Rig.minerRunGetStatus(config, { miner: minerName });
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
            minerAlias,
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
        const minerAlias = req.body.alias?.toString() || '';
        const minerDefault = req.body.default?.toString() || '';
        const version = req.body.version?.toString() || '';

        const config = Daemon.getConfig();
        const minerStatus = Rig.minerRunGetStatus(config, { miner: minerName });

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
                alias: minerAlias,
                default: (minerDefault === '1'),
                version,
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
        const minerConfig = Rig.getInstalledMinerConfiguration(config, minerName);
        const minerAlias = req.query.alias?.toString() || minerConfig.defaultAlias;
        const minerFullName = `${minerName}-${minerAlias}`;

        const monitorStatus = Rig.monitorGetStatus();
        const rigInfos = await Rig.getRigInfos(config);
        const minerInfos = rigInfos.status?.minersStats[minerFullName];
        const minerStatus = Rig.minerRunGetStatus(config, { miner: minerName });
        const allMiners = await Rig.getAllMiners(config);

        if (action === 'log') {
            //res.send( `not yet available` );
            res.header('Content-Type', 'text/plain');
            const log = await Rig.minerRunGetLog(config, { miner: minerName, lines: 50 });
            res.send(log);
            return;

        } else if (action === 'status') {
            if (! monitorStatus) {
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
            monitorStatus,
            rigInfos,
            miner: minerName,
            minerAlias,
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
        const minerStatus = Rig.minerRunGetStatus(config, { miner: minerName });

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
        const minerConfig = Rig.getInstalledMinerConfiguration(config, minerName);
        const minerAlias = req.query.alias?.toString() || minerConfig.defaultAlias;

        const rigInfos = await Rig.getRigInfos(config);
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
            rigName: config.rig.name || rigInfos.rig.name || 'anonymous-rig',
            rigInfos,
            miners: allMiners,
            runnableMiners,
            runningMiners,
            installedMiners,
            presets,
            miner: minerName,
            minerAlias,
        };
        res.render(`.${SEP}rig${SEP}run_miner_modal.html`, data);
    });


}
