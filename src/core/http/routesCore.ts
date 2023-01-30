
import path from 'path';
//import os from 'os';
//import colors from 'colors/safe';
import type express from 'express';

import { now } from '../../common/utils';
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

}
