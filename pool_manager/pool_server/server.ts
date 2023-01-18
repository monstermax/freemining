
import fs from 'fs';
import express from 'express';
import * as http from 'http';
import colors from 'colors/safe';


const app = express();
const server = http.createServer(app);

const config: any = require('../pool_manager.json');

const httpServerHost: string = config.poolServer?.host || '0.0.0.0';
const httpServerPort: number = Number(config.poolServer?.port || 4100);
let httpServerRoot: string = config.poolServer?.root || `${__dirname}/web/public`;

if (httpServerRoot.startsWith('~')) {
    const HOME = process.env.HOME;
    httpServerRoot = `${HOME}${httpServerRoot.slice(1)}`
}

app.use(express.urlencoded());


if (httpServerRoot) {
    console.log(`${now()} [${colors.blue('INFO')}] Using root folder ${httpServerRoot}`);
    app.use(express.static(httpServerRoot));
}

app.use(function (req: express.Request, res: express.Response, next: Function) {
    // Error 404
    console.log(`${now()} [${colors.yellow('WARNING')}] Error 404: ${req.method.toLocaleUpperCase()} ${req.url}`);

    next();
});

server.listen(httpServerPort, httpServerHost, () => {
    console.log(`${now()} [${colors.blue('INFO')}] Server started on ${httpServerHost}:${httpServerPort}`);
});



function formatNumber(n: number) {
    return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format(n);
}



function now(): string {
    const options: {hour:string|any, minute:string|any, second:string|any} = {
        /* year: "numeric", month: "2-digit", day: "2-digit", */
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    }
    return new Date().toLocaleTimeString("fr-FR", options);
}

