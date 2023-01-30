
import path from 'path';
import colors from 'colors/safe';
import type express from 'express';

import { now } from '../../common/utils';

import type *  as t from '../../common/types';


export function registerCoreRoutes(app: express.Express, urlPrefix: string='') {
    app.get(urlPrefix + path.sep, async (req: express.Request, res: express.Response, next: Function) => {
        const data = {
            now,
            contentTemplate: `.${path.sep}homepage.html`,
        };
        res.render(`core${path.sep}layout.html`, data);
    });

}
