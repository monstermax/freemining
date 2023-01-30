
import path from 'path';
import os from 'os';
import colors from 'colors/safe';
import type express from 'express';

import { now } from '../../common/utils';

import type *  as t from '../../common/types';


const SEP = path.sep;


export function registerCoreRoutes(app: express.Express, urlPrefix: string='') {
    app.get(`${urlPrefix}${SEP}`, async (req: express.Request, res: express.Response, next: Function) => {
        const data = {
            now,
            contentTemplate: `.${SEP}homepage.html`,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });

}
