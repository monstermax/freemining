
import colors from 'colors/safe';
import type express from 'express';

import { now } from '../../common/utils';



export function registerRigRoutes(app: express.Express, urlPrefix: string='') {
    app.get(urlPrefix + '/', async (req: express.Request, res: express.Response, next: Function) => {
        res.render('rig/rig.html');
    });

    app.get(urlPrefix + '/start', async (req: express.Request, res: express.Response, next: Function) => {
        res.send('rig started');
    });

    app.get(urlPrefix + '/status', async (req: express.Request, res: express.Response, next: Function) => {
        res.send('rig status:');
    });

    app.get(urlPrefix + '/stop', async (req: express.Request, res: express.Response, next: Function) => {
        res.send('rig stopped');
    });

}
