
import fs from 'fs';
import path from 'path';
//import os from 'os';
//import colors from 'colors/safe';
import type express from 'express';

import { now, formatNumber, getDirFilesSync } from '../../common/utils';
import * as Rig from '../../rig/Rig';
import * as Farm from '../../farm/Farm';
import * as Daemon from '../../core/Daemon';
import { minersInstalls, minersCommands } from '../../rig/minersConfigs';

import { saveDaemonRigCoinsConfig, saveDaemonRigCoinsMinersConfig, saveDaemonRigCoinsPoolsConfig, saveDaemonRigCoinsWalletsConfig, saveDaemonRigMinersConfig } from '../Config';

import type * as t from '../../common/types';



/* ########## MAIN ######### */

const SEP = path.sep;
const utilFuncs = {
    now,
    formatNumber,
};


/* ########## FUNCTIONS ######### */


async function getRigData(): Promise<t.RigData> {
    const config = Daemon.getConfig();
    const rigInfos = await Rig.getRigInfos(config);
    const rigName = config.rig.name || rigInfos.rig.name || 'anonymous-rig';

    const rigData: t.RigData = {
        rigName,
        isFarm: false,
        config,
        rigInfos,
        monitorStatus: Rig.monitorGetStatus(),
        allMiners: await Rig.getAllMiners(config),
        //farmAgentStatus: Rig.farmAgentGetStatus(),
        //farmAgentHostPort: `*hardcoded*`, // TODO: `${wsServerHost}:${wsServerPort}`
        //runningMinersAliases: Rig.getRunningMinersAliases(config),
        //rigConfig: { // TODO
        //    farmAgent: {
        //        host: '0.0.0.0',
        //        port: 0,
        //    },
        //},
    };
    return rigData;
}



/* ############################# */


export async function rigHomepage(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const { allMiners } = rigData;
    const runningMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].running).map(entry => entry[0]);
    const installedMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].installed).map(entry => entry[0]);
    const installableMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].installable).map(entry => entry[0]);
    const runnableMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].runnable).map(entry => entry[0]);
    const managedMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].managed).map(entry => entry[0]);

    const data = {
        ...utilFuncs,
        meta: {
            title: `Freemining - Rig Manager`,
            noIndex: false,
        },
        contentTemplate: `..${SEP}rig${SEP}rig.html`,
        ...rigData,
        allMiners,
        installedMiners, // a supprimer ?
        runningMiners, // a supprimer ?
        installableMiners, // a supprimer ?
        runnableMiners, // a supprimer ?
        managedMiners, // a supprimer ?
    };
    res.render(`.${SEP}core${SEP}layout.html`, data);
}


export async function rigConfig(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const data = {
        ...utilFuncs,
        meta: {
            title: `Freemining - Rig Manager`,
            noIndex: false,
        },
        contentTemplate: `..${SEP}rig${SEP}config.html`,
        ...rigData,
    };
    res.render(`.${SEP}core${SEP}layout.html`, data);
}


export async function rigConfigRig(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const data = {
        ...utilFuncs,
        meta: {
            title: `Freemining - Rig Manager`,
            noIndex: false,
        },
        contentTemplate: `..${SEP}rig${SEP}config_rig.html`,
        ...rigData,
    };
    res.render(`.${SEP}core${SEP}layout.html`, data);
}


export async function rigConfigCoins(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const data = {
        ...utilFuncs,
        meta: {
            title: `Freemining - Rig Manager`,
            noIndex: false,
        },
        contentTemplate: `..${SEP}rig${SEP}config_coins.html`,
        ...rigData,
    };
    res.render(`.${SEP}core${SEP}layout.html`, data);
}


export async function rigConfigMiners(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const data = {
        ...utilFuncs,
        meta: {
            title: `Freemining - Rig Manager`,
            noIndex: false,
        },
        contentTemplate: `..${SEP}rig${SEP}config_miners.html`,
        ...rigData,
    };
    res.render(`.${SEP}core${SEP}layout.html`, data);
}


export async function rigConfigCoinsWallets(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const data = {
        ...utilFuncs,
        meta: {
            title: `Freemining - Rig Manager`,
            noIndex: false,
        },
        contentTemplate: `..${SEP}rig${SEP}config_coins_wallets.html`,
        ...rigData,
    };
    res.render(`.${SEP}core${SEP}layout.html`, data);
}


export async function rigConfigCoinsPools(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const data = {
        ...utilFuncs,
        meta: {
            title: `Freemining - Rig Manager`,
            noIndex: false,
        },
        contentTemplate: `..${SEP}rig${SEP}config_coins_pools.html`,
        ...rigData,
    };
    res.render(`.${SEP}core${SEP}layout.html`, data);
}


export async function rigConfigCoinsMiners(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const data = {
        ...utilFuncs,
        meta: {
            title: `Freemining - Rig Manager`,
            noIndex: false,
        },
        contentTemplate: `..${SEP}rig${SEP}config_coins_miners.html`,
        ...rigData,
    };
    res.render(`.${SEP}core${SEP}layout.html`, data);
}


export async function rigConfigGetInstallableVersions(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const minerName = req.params.minerName?.toString();

    const minerInstall = minersInstalls[minerName];
    const installableVersions = minerInstall ? await minerInstall.getAllVersions() : '';

    res.json(installableVersions);
}




export async function rigStatus(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const data = {
        ...utilFuncs,
        meta: {
            title: `Freemining - Rig Manager - Rig Status`,
            noIndex: false,
        },
        contentTemplate: `..${SEP}rig${SEP}rig_status.html`,
        ...rigData,
    };
    res.render(`.${SEP}core${SEP}layout.html`, data);
};


export async function rigMinerRunModal(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const minerName = req.query.miner as string || '';

    if (! rigData.config) {
        res.send(`Rig not configured`);
        res.end();
        return;
    }

    const config = rigData.config;
    const rigInfos = rigData.rigInfos;
    const allMiners = rigData.allMiners;
    const runningMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].running).map(entry => entry[0]);
    const runnableMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].runnable).map(entry => entry[0]);
    const installedMiners = Object.entries(allMiners).filter((entry: [string, any]) => entry[1].installed).map(entry => entry[0]);

    if (! rigInfos) {
        res.send(`Rig not initialized`);
        res.end();
        return;
    }

    const rigName = config.rig.name || rigInfos.rig.name || 'anonymous-rig';

    const data = {
        ...utilFuncs,
        rigName,
        rigInfos,
        config,
        miners: allMiners,
        runnableMiners,
        runningMiners,
        installedMiners,
        miner: minerName,
    };
    res.render(`.${SEP}rig${SEP}run_miner_modal.html`, data);
};


export async function rigMinerInstall(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const minerName = req.params.minerName;
    //const action = req.query.action?.toString() || '';

    const config = rigData.config;
    const rigInfos = rigData.rigInfos;

    //const installedMinerConfig = rigData.rigInfos.status?.installedMinersAliases[minerName];

    //if (! installedMinerConfig) {
    //    res.send(`Error: missing miner config`);
    //    return;
    //}

    //const minerAlias = req.query.alias?.toString() || installedMinerConfig.defaultAlias;
    //const instanceName = req.query.instanceName?.toString() || `${minerName}-${minerAlias}`;

    //const minerInfos = rigInfos.status?.minersStats[instanceName];
    const minerStatus = rigInfos.status?.runningMiners.includes(minerName);
    const allMiners = rigData.allMiners;

    const minerInstall = minersInstalls[minerName];
    const lastVersionAvailable = minerInstall ? await minerInstall.getLastVersion() : '';
    const lastVersion = minerInstall.lastVersion || '';

    //const installStatus = false;
    //const uninstallStatus = false;

    const data = {
        ...utilFuncs,
        meta: {
            title: `Freemining - Rig Manager - Miner install`,
            noIndex: false,
        },
        contentTemplate: `..${SEP}rig${SEP}miner_install.html`,
        config,
        rigInfos,
        miner: minerName,
        //minerAlias,
        minerStatus,
        //minerInfos,
        allMiners,
        lastVersion,
        lastVersionAvailable,
        //installStatus,
        //uninstallStatus,
    };
    res.render(`.${SEP}core${SEP}layout.html`, data);
};



export async function rigMinerInstallPost(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const minerName = req.params.minerName;
    const action = req.body.action?.toString() || '';
    const minerAlias = req.body.alias?.toString() || '';
    const minerVersion = req.body.version?.toString() || '';
    const minerDefault = req.body.default?.toString() || '';

    const config = rigData.config;
    const rigInfos = rigData.rigInfos;
    const minerStatus = rigInfos.status?.runningMiners.includes(minerName);

    if (action === 'start') {
        if (! minerName) {
            res.send(`Error: missing 'minerName' parameter`);
            return;
        }

        if (minerStatus) {
            res.send(`Error: cannot start miner install while it is running`);
            return;
        }

        if (! config) {
            res.send(`Error: cannot start miner install without config`);
            return;
        }

        const params = {
            miner: minerName,
            alias: minerAlias,
            default: (minerDefault === '1'),
            version: minerVersion,
        };

        try {
            if (! rigData.isFarm) {
                Rig.minerInstallStart(config, params);

            } else {
                Farm.farmMinerInstallStart(rigData.rigName, params);
            }
            res.send(`OK: miner install started`);

        } catch (err: any) {
            res.send(`Error: cannot start miner install => ${err.message}`);
        }
        return;
    }

    res.send(`Error: invalid action`);
};



export async function rigMinerUninstall(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const minerName = req.params.minerName;
    const minerAlias = req.body.alias?.toString() || '';
    //const action = req.query.action?.toString() || '';

    const config = rigData.config;
    const rigInfos = rigData.rigInfos;

    // TODO

    res.send('not available');
};


export async function rigMinerUninstallPost(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const minerName = req.params.minerName;
    const minerAlias = req.body.alias?.toString() || '';
    //const minerVersion = req.body.version?.toString() || '';
    //const action = req.query.action?.toString() || '';

    const config = rigData.config;
    const rigInfos = rigData.rigInfos;


    if (! config) {
        res.send(`Error: cannot start miner install without config`);
        return;
    }

    try {
        if (! rigData.isFarm) {
            const params = {
                miner: minerName,
                alias: minerAlias,
            };

            Rig.minerUninstallStart(config, rigInfos, params);

        } else {

        }

        res.send(`OK: miner uninstall started`);

    } catch (err: any) {
        res.send(`Error: cannot start miner uninstall => ${err.message}`);
    }
};




export async function rigMinerRun(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const minerName = req.params.minerName;
    const action = req.query.action?.toString() || '';

    const config = rigData.config;
    const installedMinerConfig = rigData.rigInfos.status?.installedMinersAliases[minerName];

    if (! installedMinerConfig) {
        res.send(`Error: missing miner config`);
        return;
    }

    const minerAlias = req.query.alias?.toString() || installedMinerConfig.defaultAlias;
    const instanceName = req.query.instanceName?.toString() || `${minerName}-${minerAlias}`;

    const monitorStatus = rigData.monitorStatus;
    const rigInfos = rigData.rigInfos;
    const minerInfos = rigInfos.status?.minersStats[instanceName];
    const minerStatus = rigInfos.status?.runningMiners.includes(minerName);
    const allMiners = rigData.allMiners;

    if (action === 'log') {
        //res.send( `not yet available` );

        if (! config) {
            res.send(`Error: cannot show miner log without config`);
            return;
        }

        res.header('Content-Type', 'text/plain');

        let log = '';
        if (! rigData.isFarm) {
            log = await Rig.minerRunGetLog(config, { miner: minerName, lines: 50 });

        } else {
            //Farm.farmMinerRunGetLog(rigData.rigName, params);

        }
        res.send(log);
        return;

    } else if (action === 'status') {
        if (! monitorStatus) {
            res.send( `Warning: JSON status requires rig monitor to be started. Click here to <a href="/rig/monitor-start">start monitor</a>` );
            return;
        }
        if (! allMiners[minerName]) {
            res.send( `Warning: invalid miner` );
            return;
        }
        if (! minerStatus) {
            res.send( `Warning: this miner is not running` );
            return;
        }
        if (! allMiners[minerName].managed) {
            res.send( `Warning: this miner is not managed` );
            return;
        }
        if (! minerInfos) {
            res.send( `Warning: data not yet available` );
            return;
        }
        res.header('Content-Type', 'application/json');
        res.send( JSON.stringify(minerInfos) );
        return;
    }

    //if (! minerInfos) {
    //    res.send(`Error: miner is not running or is not managed or rig monitor is not started or miner API is not loaded`);
    //    return;
    //}

    const data = {
        ...utilFuncs,
        meta: {
            title: `Freemining - Rig Manager - Miner run`,
            noIndex: false,
        },
        contentTemplate: `..${SEP}rig${SEP}miner_run.html`,
        monitorStatus,
        rigInfos,
        miner: minerName,
        minerAlias,
        minerStatus,
        minerInfos,
        allMiners,
    };
    res.render(`.${SEP}core${SEP}layout.html`, data);
};


export async function rigMinerRunPost(rigData: t.RigData, req: express.Request, res: express.Response, next: Function) {
    const minerName = req.params.minerName;
    const action = req.body.action?.toString() || '';

    const config = rigData.config;
    const rigInfos = rigData.rigInfos;
    const minerStatus = rigInfos.status?.runningMiners.includes(minerName);

    const coin = req.body.coin?.toString() || '';
    const algo = req.body.algo?.toString() || '';
    const poolUrl = req.body.poolUrl?.toString() || '';
    const poolUser = req.body.poolUser?.toString() || '';
    const dockerize = !! req.body.dockerize;
    const extraArgs = (req.body.extraArgs?.toString() || '').split(' ').filter((arg: string) => !!arg);

    const minerAlias = req.body.minerAlias?.toString() || '';
    const instanceName = req.body.instanceName?.toString() || `${minerName}-${minerAlias}`;

    if (action === 'start') {
        if (! minerName || ! algo || ! poolUrl || ! poolUser) {
            res.send(`Error: missing parameters`);
            return;
        }

        if (! config) {
            res.send(`Error: cannot start miner run without config`);
            return;
        }

        const params: t.minerRunStartParams = {
            miner: minerName,
            alias: minerAlias,
            //instanceName,
            coin,
            algo,
            poolUrl,
            poolUser,
            extraArgs,
            dockerize,
        };

        try {
            if (! rigData.isFarm) {
                await Rig.minerRunStart(config, params);

            } else {
                Farm.farmMinerRunStart(rigData.rigName, params);
            }
            res.send(`OK: miner run started`);

        } catch (err: any) {
            res.send(`Error: cannot start miner run => ${err.message}`);
        }
        return;

    } else if (action === 'stop') {
        if (! minerName) {
            res.send(`Error: missing parameters`);
            return;
        }

        if (!config) {
            res.send(`Error: cannot stop miner run without config`);
            return;
        }

        if (!minerStatus) {
            res.send(`Error: cannot stop miner run while it is not running`);
            return;
        }

        const params = {
            miner: minerName,
            minerAlias,
            instanceName,
        };

        try {
            if (! rigData.isFarm) {
                Rig.minerRunStop(config, params);

            } else {
                Farm.farmMinerRunStop(rigData.rigName, params);
            }
            res.send(`OK: miner run stopped`);

        } catch (err: any) {
            res.send(`Error: cannot stop miner run => ${err.message}`);
        }
        return;
    }

    res.send(`Error: invalid action`);
};



export async function rigConfigUpdate<T extends t.RigConfigType>(configType: T, newConfig: t.RigConfigs<T>) {
    const config = Daemon.getConfig();
    const confDir =  config.confDir;

    if (configType === 'coins') {
        saveDaemonRigCoinsConfig(confDir, newConfig as t.rigCoinsConfig);
        config.rig.coins = newConfig as t.rigCoinsConfig;

    } else if (configType === 'miners') {
        saveDaemonRigMinersConfig(confDir, newConfig as t.rigMinersConfig);
        config.rig.miners = newConfig as t.rigMinersConfig;

    } else if (configType === 'coins_wallets') {
        saveDaemonRigCoinsWalletsConfig(confDir, newConfig as t.rigCoinsWalletsConfig);
        config.rig.coinsWallets = newConfig as t.rigCoinsWalletsConfig;

    } else if (configType === 'coins_pools') {
        saveDaemonRigCoinsPoolsConfig(confDir, newConfig as t.rigCoinsPoolsConfig);
        config.rig.coinsPools = newConfig as t.rigCoinsPoolsConfig;

    } else if (configType === 'coins_miners') {
        saveDaemonRigCoinsMinersConfig(confDir, newConfig as t.rigCoinsMinersConfig);
        config.rig.coinsMiners = newConfig as t.rigCoinsMinersConfig;
    }
}



/* #### */


export function registerRigRoutes(app: express.Express, urlPrefix: string='') {

    // GET Rig homepage => /rig/
    app.get(`${urlPrefix}/`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        rigHomepage(await getRigData(), req, res, next);
    });


    // GET Rig config JSON => /rig/config.json
    app.get(`${urlPrefix}/config.json`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        let content = JSON.stringify(config, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    });


    app.get(`${urlPrefix}/config`, async (req: express.Request, res: express.Response, next: Function) => {
        rigConfig(await getRigData(), req, res, next);
    });

    app.get(`${urlPrefix}/config/coins`, async (req: express.Request, res: express.Response, next: Function) => {
        rigConfigCoins(await getRigData(), req, res, next);
    });

    app.get(`${urlPrefix}/config/miners`, async (req: express.Request, res: express.Response, next: Function) => {
        rigConfigMiners(await getRigData(), req, res, next);
    });

    app.get(`${urlPrefix}/config/coins-wallets`, async (req: express.Request, res: express.Response, next: Function) => {
        rigConfigCoinsWallets(await getRigData(), req, res, next);
    });

    app.get(`${urlPrefix}/config/coins-pools`, async (req: express.Request, res: express.Response, next: Function) => {
        rigConfigCoinsPools(await getRigData(), req, res, next);
    });

    app.get(`${urlPrefix}/config/coins-miners`, async (req: express.Request, res: express.Response, next: Function) => {
        rigConfigCoinsMiners(await getRigData(), req, res, next);
    });


    app.get(`${urlPrefix}/config/miners/:minerName/installable-versions`, async (req: express.Request, res: express.Response, next: Function) => {
        rigConfigGetInstallableVersions(await getRigData(), req, res, next);
    });


    // GET Rig status => /rig/status
    app.get(`${urlPrefix}/status`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        rigStatus(await getRigData(), req, res, next);
    });


    // GET Rig status JSON => /rig/status.json
    app.get(`${urlPrefix}/status.json`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        const rigInfos = await Rig.getRigInfos(config);
        let content = JSON.stringify(rigInfos, null, 4);
        res.header('Content-Type', 'application/json');
        res.send(content);
    });


    // GET Rig farm-agent start => /rig/farm-agent/run
    app.get(`${urlPrefix}/farm-agent/run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        const action = req.query.action?.toString() || '';

        if (action === 'start') {
            Rig.farmAgentStart(config);
            res.send('Rig farm-agent started [TODO]');
            return;

        } else if (action === 'stop') {
            Rig.farmAgentStop();
            res.send('Rig farm-agent started [TODO]');
            return;
        }

        res.send(`try action start/stop. <a href="?action=start">start</a> | <a href="?action=stop">stop</a>`);

        // TODO: afficher page html
    });

    // POST Rig farm-agent start => /rig/farm-agent/run
    app.post(`${urlPrefix}/farm-agent/run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        const action = req.body.action?.toString() || '';
        const farmAgentStatus = Rig.farmAgentGetStatus();

        if (action === 'start') {
            if (farmAgentStatus) {
                res.send('OK: Farm agent is running');

            } else {
                Rig.farmAgentStart(config);
                res.send('OK: Farm agent started');
            }
            return;

        } else if (action === 'stop') {
            if (farmAgentStatus) {
                Rig.farmAgentStop();
                res.send('OK: Farm agent stopped');

            } else {
                res.send('OK: Farm agent is not running');
            }
            return;
        }
    });


    // GET Rig monitor run => /rig/monitor-run
    app.get(`${urlPrefix}/monitor-run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        //const config = Daemon.getConfig();
        const monitorStatus = Rig.monitorGetStatus();

        const data = {
            ...utilFuncs,
            meta: {
                title: `Freemining - Rig Manager - Monitor run`,
                noIndex: false,
            },
            contentTemplate: `..${SEP}rig${SEP}monitor_run.html`,
            monitorStatus,
        };
        res.render(`.${SEP}core${SEP}layout.html`, data);
    });

    // POST Rig monitor run => /rig/monitor-run
    app.post(`${urlPrefix}/monitor-run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        const config = Daemon.getConfig();
        const action = req.body.action?.toString() || '';
        const monitorStatus = Rig.monitorGetStatus();

        if (action === 'start') {
            if (monitorStatus) {
                res.send('OK: Rig monitor is running');

            } else {
                Rig.monitorStart(config);
                res.send('OK: Rig monitor started');
            }
            return;

        } else if (action === 'stop') {
            if (monitorStatus) {
                Rig.monitorStop();
                res.send('OK: Rig monitor stopped');

            } else {
                res.send('OK: Rig monitor is not running');
            }
            return;
        }

        res.send(`Error: invalid action`);
    });


    // GET Miner install page => /rig/miners/{minerName}/install
    app.get(`${urlPrefix}/miners/:minerName/install`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        rigMinerInstall(await getRigData(), req, res, next);
    });

    // POST Miner install page => /rig/miners/{minerName}/install
    app.post(`${urlPrefix}/miners/:minerName/install`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        rigMinerInstallPost(await getRigData(), req, res, next);
    });


    // GET Miner uninstall page => /rig/miners/{minerName}/uninstall
    app.get(`${urlPrefix}/miners/:minerName/uninstall`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        rigMinerUninstall(await getRigData(), req, res, next);
    });

    // POST Miner uninstall page => /rig/miners/{minerName}/uninstall
    app.post(`${urlPrefix}/miners/:minerName/uninstall`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        rigMinerUninstallPost(await getRigData(), req, res, next);
    });


    // GET Miner run page => /rig/miners/{minerName}/run
    app.get(`${urlPrefix}/miners/:minerName/run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        rigMinerRun(await getRigData(), req, res, next);
    });

    // POST Miner run page => /rig/miners/{minerName}/run
    app.post(`${urlPrefix}/miners/:minerName/run`, async (req: express.Request, res: express.Response, next: Function): Promise<void> => {
        rigMinerRunPost(await getRigData(), req, res, next);
    });


    app.get(`${urlPrefix}/miners-run-modal`, async (req: express.Request, res: express.Response, next: Function) => {
        rigMinerRunModal(await getRigData(), req, res, next);
    });


    app.post(`${urlPrefix}/config/coins/update`, async (req: express.Request, res: express.Response, next: Function) => {
        const config = req.body.config;

        try {
            const coins = JSON.parse(config || 'null');

            if (! coins) {
                return res.send('Error: invalid data');
            }

            await rigConfigUpdate('coins', coins);

            res.send('OK: Rig coins config updated');

        } catch (err: any) {
            res.send('Error: invalid data');
        }
    });


    app.post(`${urlPrefix}/config/miners/update`, async (req: express.Request, res: express.Response, next: Function) => {
        const config = req.body.config;

        try {
            const miners = JSON.parse(config || 'null');

            if (! miners) {
                return res.send('Error: invalid data');
            }

            await rigConfigUpdate('miners', miners);

            res.send('OK: Rig miners config updated');

        } catch (err: any) {
            res.send('Error: invalid data');
        }
    });

    app.post(`${urlPrefix}/config/coins_wallets/update`, async (req: express.Request, res: express.Response, next: Function) => {
        const config = req.body.config;

        try {
            const coinsWallets = JSON.parse(config || 'null');

            if (! coinsWallets) {
                return res.send('Error: invalid data');
            }

            await rigConfigUpdate('coins_wallets', coinsWallets);

            res.send('OK: Rig coins-wallets config updated');

        } catch (err: any) {
            res.send('Error: invalid data');
        }
    });

    app.post(`${urlPrefix}/config/coins_pools/update`, async (req: express.Request, res: express.Response, next: Function) => {
        const config = req.body.config;

        try {
            const coinsPools = JSON.parse(config || 'null');

            if (! coinsPools) {
                return res.send('Error: invalid data');
            }

            await rigConfigUpdate('coins_pools', coinsPools);

            res.send('OK: Rig coins-pools config updated');

        } catch (err: any) {
            res.send('Error: invalid data');
        }
    });

    app.post(`${urlPrefix}/config/coins_miners/update`, async (req: express.Request, res: express.Response, next: Function) => {
        const config = req.body.config;

        try {
            const coinsMiners = JSON.parse(config || 'null');

            if (! coinsMiners) {
                return res.send('Error: invalid data');
            }

            await rigConfigUpdate('coins_miners', coinsMiners);

            res.send('OK: Rig coins-miners config updated');

        } catch (err: any) {
            res.send('Error: invalid data');
        }
    });


}
