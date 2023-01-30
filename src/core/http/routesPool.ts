
import colors from 'colors/safe';
import type express from 'express';

import { now } from '../../common/utils';



export function registerPoolRoutes(app: express.Express, urlPrefix: string='') {
    app.get(urlPrefix + '/', async (req: express.Request, res: express.Response, next: Function) => {
        res.render('pool/pool.html');
    });
}
