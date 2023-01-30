
import path from 'path';
//import os from 'os';
//import colors from 'colors/safe';
import type express from 'express';

import { now } from '../../common/utils';
import * as Daemon from '../../core/Daemon';


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

}
