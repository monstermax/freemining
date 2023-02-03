
import type childProcess from 'child_process';


export type LruCache<T> = {
    put: (key: string, value: T) => void,
    get: (key: string) => T,
    maxEntries: number,
    store: Map<string, T>,
};


export type MapString<T> = { [key: string] : T};



export type CommonParams = (
    "--help"
);


export type CliParams = (
    "--sysinfos" | "--local" |

    "--ws-server-host" |
    "--ws-server-port" |
    "--ws-conn-timeout" |

    // RIG
    "--rig-infos" | 
    "--rig-monitor-start" |
    "--rig-monitor-stop" |
    "--rig-monitor-status" |

    "--rig-farm-agent-start" |
    "--rig-farm-agent-stop" |
    "--rig-farm-agent-status" |

    "--rig-miner-start" |
    "--rig-miner-stop" |
    "--rig-miner-status" |
    "--rig-miner-log" |
    "--rig-miner-infos" |
    "--rig-miner-install" | "--alias" | "--version" |
    "--rig-miner-uninstall" |

    // FARM
    "--farm-infos" | 
    "--farm-server-start" |
    "--farm-server-stop" |
    "--farm-server-status" |

    // NODE
    "--node-infos" | 
    "--node-monitor-start" |
    "--node-monitor-stop" |
    "--node-monitor-status" |

    "--node-fullnode-start" |
    "--node-fullnode-stop" |
    "--node-fullnode-status" |
    "--node-fullnode-log" |
    "--node-fullnode-infos" |
    "--node-fullnode-install" | "--alias" | "--version" |
    "--node-fullnode-uninstall" |

    // FOOL
    "--pool-infos" | 
    "--pool-monitor-start" |
    "--pool-monitor-stop" |
    "--pool-monitor-status"
);

export type CliParamsAll = CliParams & CommonParams & string;


export type DaemonParams = (
    "--user-dir" |

    "--listen-address" |
    "--listen-port" |
    "--wss-conn-timeout" |

    "--rig-monitor-poll-delay" |
    "--node-monitor-poll-delay" |

    "--rig-farm-server-host" |
    "--rig-farm-server-port" |
    "--rig-farm-server-pass" |

    "-r" | // == "--rig-monitor-start"
    "-a" | // == "--rig-farm-agent-start"
    "-n" | // == "--node-monitor-start"
    "-f" | // == "--farm-server-start"
    "-p"   // == "--pool-monitor-start"
);

export type DaemonParamsAll = DaemonParams & CommonParams & string;


export type RpcRequest = {
    jsonrpc: string,
    id: number,
    method: string,
    params: any

};


export type RpcResponse = {
    jsonrpc: string,
    id: number,
    result: any
};


export type RpcError = {
    jsonrpc: string,
    id: number,
    error: {
        code?: number,
        message: string,
    }
};


export type DaemonConfigAll = CommonConfig & DaemonConfig;
export type CliConfigAll = CommonConfig & CliConfig;

export type CommonConfig = {
    _args: string[],
}

export type DaemonConfig = {
    version: string,
    listenAddress: string,
    listenPort: number,
    wssConnTimeout: number,
    appDir: string,
    confDir: string,
    dataDir: string,
    logDir: string,
    pidDir: string,
    httpTemplatesDir: string,
    httpStaticDir: string,
    rig: rigConfig,
    farm: farmConfig,
    node: nodeConfig,
    pool: poolConfig,
    _args: string[],
}

export type CliConfig = {
    wsServerHost: string;
    wsServerPort: number,
    wsConnTimeout: number;
    _args: string[],
}


export type Process = {
    type: string,
    name: string,
    miner?: string,
    fullnode?: string,
    cmdFile: string,
    args: string[],
    dataDir: string,
    appDir: string,
    cmdPath: string,
    pid: number | undefined,
    process: childProcess.ChildProcessWithoutNullStreams | undefined,
}


export type ExecOnSpawn = (proc: childProcess.ChildProcessWithoutNullStreams) => void;

export type ExecOnStdOut = (data: Buffer) => void;

export type ExecOnStdErr = (data: Buffer) => void;

export type ExecOnEnd = (returnCode: number, err: any) => void;


export type CPU = {
    name: string,
    threads: number,
};

export type GPU = {
    id: number,
    name: string,
};


/* RIG */

export type rigConfig = {
    name?: string,
    farmAgent?: {
        host: string,
        port: number,
        pass?: string,
    },
};

export type RigInfos = {
    rig: {
        name: string,
        hostname: string,
        ip: string,
        os: string,
        freeminingVersion: string,
    },
    usage?: {
        uptime: number,
        loadAvg: number,
        memory: {
            used: number,
            total: number,
        },
    },
    devices?: {
        cpus: CPU[],
        gpus: (GPU & {driver: string})[],
    },
    config?: {
        pools: any,
        wallets: any,
        //overclockings: any,
        farmAgent: {
            host: string,
            port: number,
            pass: string,
        },
    }
    status?: {
        monitorStatus: boolean,
        installedMiners: string[],
        installedMinersAliases: any[];
        runningMiners: string[],
        runningMinersAliases: any[];
        minersStats: { [minerName: string]: MinerStats },
        farmAgentStatus: boolean,
    },
    //dataSizes?: {
    //    appDir: number,
    //    dataDir: number,
    //    confDir: number,
    //    logDir: number,
    //},
    dataDate?: number,
}

export type RigData = {
    config: DaemonConfigAll,
    rigInfos: RigInfos,
    monitorStatus: boolean,
    allMiners: AllMiners,
}


export type minerInstallInfos = {
    minerName: string,
    minerTitle: string,
    lastVersion: string,
    github: string,
    install(config: DaemonConfig, params: minerInstallStartParams): Promise<void>,
    getLastVersion?(github?: string): Promise<string>,
    getAllVersions?(github?: string): Promise<string[]>,
} & MapString<any>;



export type minerCommandInfos = {
    apiPort: number,
    command: string,
    getCommandFile(config: DaemonConfig, params: getMinerCommandFileParams): string,
    getCommandArgs(config: DaemonConfig, params: getMinerCommandArgsParams): string[],
    getInfos(config: DaemonConfig, params: getMinerInfosParams): Promise<MinerStats>,
} & MapString<any>;



export type MinerStats = {
    miner: {
        name: string,
        worker: string,
        uptime: number,
        algo: string,
        hashRate: number,
        minerName?: string,
        minerAlias?: string,
    },
    //sizes: {
    //    appDir: number,
    //    dataDir: number,
    //    confDir: number,
    //    logDir: number,
    //},
    pool: {
        url: string,
        account: string,
    },
    devices: {
        cpus: MinerCpuInfos[],
        gpus: MinerGpuInfos[],
    },
    dataDate?: number,
};


export type MinerCpuInfos = CPU & {
    id: number,
    hashRate: number,
};

export type MinerGpuInfos = GPU & {
    temperature: number,
    fanSpeed: number,
    hashRate: number,
    power: number | null,
};


export type installedMiner = any; // TODO

export type runningMiner = {
    miner: string,
    alias: string,
    pid: number,
};


export type minerInstallStartParams = {
    miner: string,
    alias?: string,
    version?: string,
    default?: boolean,
}

export type minerInstallStopParams = {
    miner: string,
    alias?: string,
}

export type minerRunStartParams = {
    miner: string,
    alias?: string,
    algo: string,
    poolUrl: string,
    poolUser: string,
    extraArgs?: string,
}

export type minerRunStopParams = {
    miner: string,
    alias?: string,
}

export type minerRunStatusParams = {
    miner: string,
    alias?: string,
}

export type minerRunLogParams = {
    miner: string,
    alias?: string,
    lines?: number,
}

export type minerRunInfosParams = {
    miner: string,
    alias?: string,
}

export type getMinerCommandArgsParams = {
    miner: string,
    algo: string,
    poolUrl: string,
    poolUser: string,
    extraArgs?: string,
}

export type getMinerCommandFileParams = {
}

export type getMinerInfosParams = {
}

export type AllMiners = {
    [minerName: string]: {
        installed: boolean,
        installedAliases: installedMiner[], // TODO
        running: boolean,
        installable: boolean,
        runnable: boolean,
        managed: boolean,
        runningAlias: runningMiner[],
    }
};



/* NODE */


export type nodeConfig = {
    name?: string,
};

export type NodeInfos = {
    node: {
        name: string,
        hostname: string,
        ip: string,
        os: string,
        freeminingVersion: string,
    },
    usage?: {
        uptime: number,
        loadAvg: number,
        memory: {
            used: number,
            total: number,
        },
    },
    devices?: {
        cpus: CPU[]
    },
    config?: {
    }
    status?: {
        monitorStatus: boolean,
        runningFullnodes: string[],
        runningFullnodesAliases: any[], // TODO
        installedFullnodes: string[],
        installedFullnodesAliases: any[], // TODO
        fullnodesStats: { [minerName: string]: FullnodeStats },
    },
    //dataSizes?: {
    //    appDir: number,
    //    dataDir: number,
    //    confDir: number,
    //    logDir: number,
    //},
    dataDate?: number,
};


export type fullnodeInstallInfos = {
    version: string,
    github?: string,
    install(config: DaemonConfig, params: fullnodeInstallStartParams): Promise<void>,
    getLastVersion?(): Promise<string>,
    getAllVersions?(): Promise<string[]>,
} & MapString<any>;



export type fullnodeCommandInfos = {
    p2pPort: number,
    rpcPort: number,
    command: string,
    getCommandFile(config: DaemonConfig, params: getFullnodeCommandFileParams): string,
    getCommandArgs(config: DaemonConfig, params: getFullnodeCommandArgsParams): string[],
    getInfos(config: DaemonConfig, params: getFullnodeInfosParams): Promise<FullnodeStats>,
} & MapString<any>;



export type FullnodeStats = {
    fullnode: {
        name: string,
        coin: string,
        //uptime: number,
        fullnodeName?: string,
        fullnodeAlias?: string,
    },
    //sizes: {
    //    appDir: number,
    //    dataDir: number,
    //    confDir: number,
    //    logDir: number,
    //},
    blockchain?: {
        blocks: number,
        headers?: number,
    },
    dataDate?: number,
};


export type runningFullnode = {
    fullnode: string,
    alias: string,
    pid: number,
};


export type fullnodeInstallStartParams = {
    fullnode: string,
    alias?: string,
    version?: string,
    default?: boolean,
}

export type fullnodeInstallStopParams = {
    fullnode: string,
    alias?: string,
}

export type fullnodeRunStartParams = {
    fullnode: string,
    alias?: string,
    extraArgs?: string,
}

export type fullnodeRunStopParams = {
    fullnode: string,
    alias?: string,
}

export type fullnodeRunStatusParams = {
    fullnode: string,
    alias?: string,
}

export type fullnodeRunLogParams = {
    fullnode: string,
    alias?: string,
    lines?: number,
}

export type fullnodeRunInfosParams = {
    fullnode: string,
    alias?: string,
}

export type InstalledMinerConfig = {
    name: string,
    title: string,
    lastVersion: string,
    defaultAlias: string,
    versions: { [minerAlias: string]: InstalledMinerAliasConfig },
}

export type InstalledMinerAliasConfig = {
    name: string,
    alias: string,
    version: string,
    installDate: string,
    installUrl: string,
}

export type AllFullnodes = {
    [fullnodeName: string]: {
        installed: boolean,
        running: boolean,
        installable: boolean,
        runnable: boolean,
        managed: boolean,
    }
};


export type getFullnodeCommandArgsParams = {
    fullnode: string,
    extraArgs?: string,
}

export type getFullnodeCommandFileParams = {
}

export type getFullnodeInfosParams = {
}




/* FARM */

export type farmConfig = {
    name?: string,
};

export type FarmInfos = {
    farm: {
        name: string,
        hostname: string,
        ip: string,
        os: string,
        uptime: number,
    },
    usage: {
        loadAvg: number,
        memory: {
            used: number,
            total: number,
        },
    },
    rigsInfos: { [rigName: string]: RigInfos },
    dataDate?: number | null,
}


/* POOL */

export type poolConfig = {
    name?: string,
};

export type PoolInfos = {
    pool: {
        name: string,
        hostname: string,
        ip: string,
        os: string,
        freeminingVersion: string,
    },
    usage?: {
        uptime: number,
        loadAvg: number,
        memory: {
            used: number,
            total: number,
        },
    },
    devices?: {
        cpus: CPU[]
    },
    config?: {
    }
    status?: {
        //monitorStatus: boolean,
        //runningEngines: string[],
        //runningEnginesAliases: any[],
        //installedEngines: string[],
        //installedEnginesAliases: any[],
        //enginesStats: EnginesStats
        //poolsStats: PoolsStats
    },
    //dataSizes?: {
    //    appDir: number,
    //    dataDir: number,
    //    confDir: number,
    //    logDir: number,
    //},
    dataDate?: number | null,
};






/* MISC */

export type UserWalletsCoinsWalletsConfig = { [coin: string]: UserWalletsCoinConfig }; // see coins_wallets.sample.json
export type UserWalletsCoinConfig = { [walletName: string]: string };


export type UserPoolsCoinsPoolsConfig = { [coin: string]: UserPoolsCoinConfig }; // see coins_pools.sample.json
export type UserPoolsCoinConfig = { [poolName: string]: UserPoolsCoinPoolConfig };
export type UserPoolsCoinPoolConfig = { [serverName: string]: string };
