
import path from 'path';
//import os from 'os';
//import colors from 'colors/safe';
import type express from 'express';

import { now } from '../../common/utils';
import * as Daemon from '../../core/Daemon';
import * as Farm from '../../farm/Farm';


/* ########## MAIN ######### */

const SEP = path.sep;
const utilFuncs = {
    now,
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
        const farmInfos = Farm.getFarmInfos();
        let content = JSON.stringify(farmInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    });


    app.get(`${urlPrefix}/rigs/`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        const farmInfos = Farm.getFarmInfos();
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

}
