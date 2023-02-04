
import path from 'path';
//import os from 'os';
//import colors from 'colors/safe';
import type express from 'express';

import { now } from '../../common/utils';
import { getSystemInfos } from '../../common/sysinfos';
import * as Daemon from '../../core/Daemon';

import type *  as t from '../../common/types';


/* ########## MAIN ######### */

const SEP = path.sep;
const utilFuncs = {
    now,
};


/* ########## FUNCTIONS ######### */

export function registerCoreRoutes(app: express.Express, urlPrefix: string='') {

    // Freemining homepage
    app.get(`${urlPrefix}/`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        //const config = Daemon.getConfig();

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining`,
                noIndex: false,
            },
            contentTemplate: `.${SEP}homepage.html`,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });


    // Sysinfos => /sysinfos.json
    app.get(`${urlPrefix}/sysinfos.json`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const sysInfos = await getSystemInfos();
        let content = JSON.stringify(sysInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    });


    app.get(`${urlPrefix}/quit`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const action = req.query.action as string || '';

        if (action === 'quit') {
            Daemon.safeQuit(0);
        }

        const content = `quitting...`;
        res.send(content);
    });
}
