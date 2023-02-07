
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
    "--create-config" |

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
    httpAllowedIps: string[],
    httpTemplatesDir: string,
    httpStaticDir: string,
    rig: RigConfig,
    farm: FarmConfig,
    node: NodeConfig,
    pool: PoolConfig,
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
    params: minerRunStartParams | fullnodeRunStartParams,
    //alias?: string, // TODO: name=xxxFullName + miner/fullnode + alias
    cmdFile: string,
    args: string[],
    dataDir: string,
    appDir: string,
    cmdPath: string,
    dateStart: number,
    //apiPort: number,
    //p2pPort: number,
    //rpcPort: number,
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

export type RigConfig = {
    name?: string,
    farmAgent?: {
        host: string,
        port: number,
        pass?: string,
    },
    coinsUserconf?: rigCoinsUserconfConfig,
    coinsMiners?: rigCoinsMinersConfig,
    miners?: rigMinersConfig,
};



export type rigCoinsUserconfConfig = {
    [coinSymbol: string]: {
        wallets: {
            [walletName: string]: string, // wallet address
        },
        pools: {
            [poolName: string]: {
                [serverName: string]: string, // url => example.com:8888
            }
        },
    }
};

export type rigCoinsMinersConfig = {
    [coinSymbol: string]: {
        [minerName: string]: {
            algo?: string,
            extraArgs?: string,
        }
    }
};

export type rigMinersConfig = {
    [minerName: string]: {
        apiPort?: string,
        extraArgs?: string,
    }
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
        cpuLoad: number,
        memory: {
            used: number,
            total: number,
        },
    },
    systemInfos: {
        os: {
            arch: string,
            codename: string,
            distro: string,
            hostname: string,
            kernel: string,
            platform: string,
        },
        cpu: any,
        board: {
            manufacturer: string,
            model: string,
        },
        gpus: any[],
        net: {
            interface: any,
            gateway: string,
        },
        disks: any[],
        fs: any[],
    },
    config?: RigConfig,
    status?: {
        monitorStatus: boolean,
        installableMiners: string[],
        installedMiners: string[],
        installedMinersAliases: InstalledMiner[];
        runnableMiners: string[],
        runningMiners: string[],
        runningMinersAliases: RunningMinerProcess[];
        managedMiners: string[],
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
    config: DaemonConfigAll | null,
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
    getLastVersion(): Promise<string>,
    getAllVersions(): Promise<string[]>,
    downloadFile(dlUrl: string, dlFilePath: string): Promise<void>,
    extractFile(tempDir: string, dlFilePath: string): Promise<void>,
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


export type InstalledMiner = InstalledMinerConfig;

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


export type RunningMinerProcess = {
    miner: string,
    alias: string,
    pid: number,
    dateStart: number,
    args: string[],
    params: minerRunStartParams,
    //apiPort: number, // TODO
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
    alias?: string,
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
        installedAliases: InstalledMiner[], // TODO
        running: boolean,
        installable: boolean,
        runnable: boolean,
        managed: boolean,
        runningAlias: RunningMinerProcess[],
    }
};




/* FARM */

export type FarmConfig = {
    name?: string,
    wssPass?: string,
    wssAllowedIps?: string[],
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



/* NODE */


export type NodeConfig = {
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
        installableFullnodes: string[],
        installedFullnodes: string[],
        installedFullnodesAliases: InstalledFullnode[],
        runnableFullnodes: string[],
        runningFullnodes: string[],
        runningFullnodesAliases: RunningFullnodeProcess[],
        managedFullnodes: string[],
        fullnodesStats: { [fullnodeName: string]: FullnodeStats },
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
    fullnodeName: string,
    fullnodeTitle: string,
    lastVersion: string,
    github: string,
    install(config: DaemonConfig, params: fullnodeInstallStartParams): Promise<void>,
    getLastVersion(): Promise<string>,
    getAllVersions(): Promise<string[]>,
    downloadFile(dlUrl: string, dlFilePath: string): Promise<void>,
    extractFile(tempDir: string, dlFilePath: string): Promise<void>,
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
        bestBlockHash?: string,
        bestBlockTime?: number,
        sizeOnDisk?: number,
        peers: number,
        walletAddress?: string,
    },
    wallet?: {
        address: string,
        balance: number,
        txcount: number,
    },
    dataDate?: number,
};


export type InstalledFullnode = InstalledFullnodeConfig;

export type InstalledFullnodeConfig = {
    name: string,
    title: string,
    lastVersion: string,
    defaultAlias: string,
    versions: { [fullnodeAlias: string]: InstalledFullnodeAliasConfig },
};


export type InstalledFullnodeAliasConfig = {
    name: string,
    alias: string,
    version: string,
    installDate: string,
    installUrl: string,
}



export type RunningFullnodeProcess = {
    fullnode: string,
    alias: string,
    pid: number,
    dateStart: number,
    args: string[],
    params: fullnodeRunStartParams,
    //apiPort: number, // TODO
    //p2pPort: number, // TODO
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
    alias?: string,
    extraArgs?: string,
}

export type getFullnodeCommandFileParams = {
}

export type getFullnodeInfosParams = {
}



/* POOL */

export type PoolConfig = {
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


