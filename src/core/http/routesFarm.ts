
import path from 'path';
//import os from 'os';
//import colors from 'colors/safe';
import type express from 'express';

import { now, formatNumber } from '../../common/utils';
import * as Daemon from '../../core/Daemon';
import * as Farm from '../../farm/Farm';
import * as routesRig from './routesRig';

import * as t from '../../common/types';


/* ########## MAIN ######### */

const SEP = path.sep;
const utilFuncs = {
    now,
    formatNumber,
};


/* ########## FUNCTIONS ######### */

export function registerFarmRoutes(app: express.Express, urlPrefix: string='') {

    // FARM homepage => /farm/
    app.get(`${urlPrefix}/`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Farm Manager`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}farm${SEP}farm.html`,
            //farmInfos,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });


    // GET Farm status JSON => /farm/status.json
    app.get(`${urlPrefix}/status.json`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        const farmInfos = Farm.getFarmInfos(config);
        let content = JSON.stringify(farmInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    });


    app.get(`${urlPrefix}/rigs/`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        const farmInfos = Farm.getFarmInfos(config);
        const rigsInfos = farmInfos.rigsInfos;

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Farm Manager`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}farm${SEP}farm_rigs.html`,
            //farmInfos,
            rigsInfos,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });


    app.get(`${urlPrefix}/rigs/:rigName/`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);

        if (! rigData || ! rigData.rigInfos) {
            res.send(`Error: invalid rig`);
            return;
        }

        routesRig.rigHomepage(rigData, req, res, next);
    });



    app.get(`${urlPrefix}/rigs/:rigName/status`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);

        if (! rigData?.rigInfos) {
            res.send(`Error: invalid rig`);
            return;
        }

        routesRig.rigStatus(rigData, req, res, next);
    });


    app.get(`${urlPrefix}/rigs/:rigName/status.json`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);

        if (! rigData?.rigInfos) {
            res.send(`Error: invalid rig`);
            return;
        }

        let content = JSON.stringify(rigData.rigInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    });


    app.get(`${urlPrefix}/rigs/:rigName/config.json`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);

        if (! rigData?.rigInfos) {
            res.send(`Error: invalid rig`);
            return;
        }

        let content = JSON.stringify(rigData.config, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    });


    app.get(`${urlPrefix}/rigs/:rigName/rig/miners-run-modal`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const rigName = req.params.rigName;
        const rigData = getRigData(rigName);
        routesRig.rigMinerRunModal(rigData, req, res, next);
    });
}



function getRigData(rigName: string): t.RigData {
    const config = Daemon.getConfig();

    const farmInfos = Farm.getFarmInfos(config);
    const rigInfos = farmInfos.rigsInfos[rigName];

    const rigConfig = Farm.getRigConfig(rigName);

    const allMiners = getRigAllMiners(rigInfos);

    const rigData: t.RigData = {
        config: rigConfig,
        rigInfos,
        monitorStatus: rigInfos.status?.monitorStatus || false,
        allMiners,
        //rigConfig: { // TODO
        //    farmAgent: {
        //        host: '0.0.0.0',
        //        port: 0,
        //    },
        //},
    };

    return rigData;
}



function getRigAllMiners(rigInfos: t.RigInfos): t.AllMiners {
    let installedMiners: string[] = [];
    let runningMinersAliases: t.RunningMinerProcess[] = [];
    let installableMiners: string[] = [];
    let runnableMiners: string[] = [];
    let managedMiners: string[] = [];
    let installedMinersAliases: t.InstalledMinerConfig[] = [];

    if (rigInfos) {
        installedMiners = rigInfos.status?.installableMiners || [];
        runningMinersAliases = rigInfos.status?.runningMinersAliases || [];
        installableMiners = rigInfos.status?.installableMiners || [];
        runnableMiners = rigInfos.status?.runnableMiners || [];
        managedMiners = rigInfos.status?.managedMiners || [];
        installedMinersAliases = rigInfos.status?.installedMinersAliases || [];
    }

    const minersNames = Array.from(
        new Set( [
            ...installedMiners,
            ...runningMinersAliases.map(runningMiner => runningMiner.miner),
            ...installableMiners,
            ...runnableMiners,
            ...managedMiners,
        ])
    );

    const miners: t.AllMiners = Object.fromEntries(
        minersNames.map(minerName => {
            return [
                minerName,
                {
                    installable: installableMiners.includes(minerName),
                    installed: installedMiners.includes(minerName),
                    installedAliases: installedMinersAliases,
                    runnable: runnableMiners.includes(minerName),
                    running: runningMinersAliases.map(runningMiner => runningMiner.miner).includes(minerName),
                    runningAlias: runningMinersAliases,
                    managed: managedMiners.includes(minerName),
                }
            ]
        })
    );

    /*
    // result: 
    miners = {
        miner1: {
            installed: boolean,
            running: boolean,
            installable: boolean,
            runnable: boolean,
            managed: boolean,
        },
        ...
    }
    */

    return miners;
}
