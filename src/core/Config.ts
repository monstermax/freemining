
import os from 'os';
import fs from 'fs';
import path from 'path';

import { now, hasOpt, getOpt, stringTemplate, getLocalIpAddresses } from '../common/utils';

import type *  as t from '../common/types';


/* ########## MAIN ######### */

const SEP = (os.platform() === 'win32') ? path.sep.repeat(2) : path.sep;

// daemon options
const defaultWssConnTimeout: number = 10_000;
const defaultListenAddress: string = '0.0.0.0';
const defaultListenPort: number = 1234;

const defaultHttpStaticDir: string = `${__dirname}${SEP}..${SEP}web${SEP}public`;
const defaultHttpTemplatesDir: string = `${__dirname}${SEP}..${SEP}web${SEP}templates`;

const userHomeDir: string = os.userInfo().homedir;
const defaultUserFrmDirUnix: string = `${userHomeDir}${SEP}.freemining-beta`;
const defaultUserFrmDirWin: string = `${userHomeDir}${SEP}AppData${SEP}Local${SEP}freemining-beta`;
const defaultUserFrmDir = (os.platform() === 'win32') ? defaultUserFrmDirWin : defaultUserFrmDirUnix;
console.debug(`DEBUG defaultUserFrmDir =`, defaultUserFrmDir);

// cli options
const defaultCliWssConnTimeout: number = 5_000;
const defaultCliWssServerAddress: string = '127.0.0.1';



/* ########## FUNCTIONS ######### */


export function loadConfig(args: (t.DaemonParams & t.CliParams & t.CommonParams & string)[]): t.Config {
    let wssConnTimeout = defaultWssConnTimeout;
    let listenAddress = defaultListenAddress;
    let listenPort = defaultListenPort;

    let httpStaticDir = defaultHttpStaticDir;
    let httpTemplatesDir = defaultHttpTemplatesDir;
    let userFrmDir =  defaultUserFrmDir;

    let cliWssConnTimeout = defaultCliWssConnTimeout;
    let cliWssServerAddress = defaultCliWssServerAddress;

    // set userFrmDir
    if (hasOpt('--user-dir', args)) {
        userFrmDir = getOpt('--user-dir', args) || '';
    }
    if (userFrmDir === '') {
        console.error(`${now()} [ERROR] missing user-dir`);
        process.exit(1);
    }

    userFrmDir = stringTemplate(userFrmDir, {}, false, false, true) || '';
    //userFrmDir = stringTemplate(userFrmDir.replaceAll('\\', '\\\\'), {}, false, false, true) || ''; // TEST for windows

    if (! fs.existsSync(userFrmDir)) {
        try {
            fs.mkdirSync(userFrmDir);
            console.error(`${now()} [INFO] user-dir created : ${userFrmDir}`);

        } catch (err: any) {
            console.error(`${now()} [ERROR] cannot create user-dir ${userFrmDir}`);
            process.exit(1);
        }
    }


    // set appDir
    let appDir = `${userFrmDir}${SEP}app`;

    // set confDir
    let confDir = `${userFrmDir}${SEP}config`;
    /*
    if (hasOpt('--conf-dir', args)) {
        confDir = getOpt('--conf-dir', args) || '';
    }
    if (confDir === '') {
        console.error(`${now()} [ERROR] missing conf-dir`);
        process.exit(1);
    }
    */
    if (! fs.existsSync(confDir)) {
        try {
            fs.mkdirSync(confDir);
            console.error(`${now()} [INFO] conf-dir created : ${confDir}`);

        } catch (err: any) {
            console.error(`${now()} [ERROR] cannot create conf-dir ${confDir}`);
            process.exit(1);
        }
    }


    // set dataDir
    let dataDir = `${userFrmDir}${SEP}data`;
    /*
    if (hasOpt('--data-dir', args)) {
        dataDir = getOpt('--data-dir', args) || '';
    }
    if (dataDir === '') {
        console.error(`${now()} [ERROR] missing data-dir`);
        process.exit(1);
    }
    */
    if (! fs.existsSync(dataDir)) {
        try {
            fs.mkdirSync(dataDir);
            console.error(`${now()} [INFO] data-dir created : ${dataDir}`);

        } catch (err: any) {
            console.error(`${now()} [ERROR] cannot create data-dir ${dataDir}`);
            process.exit(1);
        }
    }


    // set logDir
    let logDir = `${userFrmDir}${SEP}log`;
    /*
    if (hasOpt('--log-dir', args)) {
        logDir = getOpt('--log-dir', args) || '';
    }
    if (logDir === '') {
        console.error(`${now()} [ERROR] missing log-dir`);
        process.exit(1);
    }
    */
    if (! fs.existsSync(logDir)) {
        try {
            fs.mkdirSync(logDir);
            console.error(`${now()} [INFO] log-dir created : ${logDir}`);

        } catch (err: any) {
            console.error(`${now()} [ERROR] cannot create log-dir ${logDir}`);
            process.exit(1);
        }
    }


    // set pidDir
    let pidDir = `${userFrmDir}${SEP}run`;
    /*
    if (hasOpt('--pid-dir', args)) {
        pidDir = getOpt('--pid-dir', args) || '';
    }
    if (pidDir === '') {
        console.error(`${now()} [ERROR] missing pid-dir`);
        process.exit(1);
    }
    */
    if (! fs.existsSync(pidDir)) {
        try {
            fs.mkdirSync(pidDir);
            console.error(`${now()} [INFO] pid-dir created : ${pidDir}`);

        } catch (err: any) {
            console.error(`${now()} [ERROR] cannot create pid-dir ${pidDir}`);
            process.exit(1);
        }
    }


    // set listenAddress
    if (hasOpt('--listen-address', args)) {
        listenAddress = getOpt('--listen-address', args) || '';
    }
    if (listenAddress === '') {
        console.error(`${now()} [ERROR] missing listen-address`);
        process.exit(1);
    }
    if (listenAddress !== '0.0.0.0') {
        const localIpAddresses = getLocalIpAddresses();
        if (! localIpAddresses.includes(listenAddress)) {
            console.error(`${now()} [ERROR] invalid listen-address`);
            process.exit(1);
        }
    }

    // set listenPort
    if (hasOpt('--listen-port', args)) {
        listenPort = Number(getOpt('--listen-port', args) || '');
    }
    if (listenPort === 0 || Number.isNaN(listenPort)) {
        console.error(`${now()} [ERROR] invalid listen-port`);
        process.exit(1);
    }


    // set wssConnTimeout
    if (hasOpt('--wss-conn-timeout', args)) {
        wssConnTimeout = Number(getOpt('--wss-conn-timeout', args) || '');
    }
    if (wssConnTimeout === 0 || Number.isNaN(wssConnTimeout)) {
        console.error(`${now()} [ERROR] invalid wss-conn-timeout`);
        process.exit(1);
    }

    // set cliWssConnTimeout
    if (hasOpt('--cli-wss-conn-timeout', args)) {
        cliWssConnTimeout = Number(getOpt('--cli-wss-conn-timeout', args) || '');
    }
    if (cliWssConnTimeout === 0 || Number.isNaN(cliWssConnTimeout)) {
        console.error(`${now()} [ERROR] invalid cli-wss-conn-timeout`);
        process.exit(1);
    }

    // set cliWssServerAddress
    if (hasOpt('--cli-wss-server-address', args)) {
        cliWssServerAddress = getOpt('--cli-wss-server-address', args) || '';
    }
    if (cliWssServerAddress === '') {
        console.error(`${now()} [ERROR] invalid cli-wss-server-address`);
        process.exit(1);
    }


    return {
        listenAddress,
        listenPort,
        appDir,
        confDir,
        dataDir,
        logDir,
        pidDir,
        httpTemplatesDir,
        httpStaticDir,
        wssConnTimeout,
        cliWssConnTimeout,
        cliWssServerAddress,
        _args: args,
    } as t.Config;
}

