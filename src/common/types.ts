
import type childProcess from 'child_process';


export type LruCache<T> = {
    put: (key: string, value: T) => void,
    get: (key: string) => T,
    maxEntries: number,
    store: Map<string, T>,
};


export type MapString<T> = { [key: string] : T};



export type CommonParams = (
    "--help" |
    "--user-dir" |
    "-r" | // == "--rig-monitor-start"
    "-n"   // == "--node-monitor-start"
);


export type CliParams = (
    "--cli-wss-conn-timeout" |
    "--cli-wss-server-address" |

    // RIG
    "--rig-monitor-start" |
    "--rig-monitor-stop" |
    "--rig-monitor-status" |

    "--miner-start" |
    "--miner-stop" |
    "--miner-status" |
    "--miner-log" |
    "--miner-infos" |
    "--miner-install" |
    "--miner-uninstall" |

    // NODE
    "--node-monitor-start" |
    "--node-monitor-stop" |
    "--node-monitor-status" |

    "--fullnode-start" |
    "--fullnode-stop" |
    "--fullnode-status" |
    "--fullnode-log" |
    "--fullnode-infos" |
    "--fullnode-install" |
    "--fullnode-uninstall"
);


export type DaemonParams = (
    "--run" |
    "--start" |
    "--stop" |
    "--status" |
    "--listen-address" |
    "--listen-port" |
    "--wss-conn-timeout" |
    "--rig-monitor-poll-delay" |
    "--node-monitor-poll-delay"
);


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


export type Config = ConfigCommon & ConfigDaemon & ConfigCli;

export type ConfigCommon = {
    _args: string[],
}

export type ConfigDaemon = {
    appDir: string,
    confDir: string,
    dataDir: string,
    logDir: string,
    pidDir: string,
    listenAddress: string,
    listenPort: number,
    wssConnTimeout: number,
    httpTemplatesDir: string,
    httpStaticDir: string,
}

export type ConfigCli = {
    cliWssConnTimeout: number;
    cliWssServerAddress: string;
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



/* RIG */

export type Rig = {
    infos: {
        name: string,
        hostname: string,
        ip: string,
        os: string,
        uptime: number,
    },
    //sizes: {
    //    appDir: number,
    //    dataDir: number,
    //    confDir: number,
    //    logDir: number,
    //},
    usage: {
        loadAvg: number,
        memory: {
            used: number,
            total: number,
        },
    },
    devices: {
        cpus: {
            name: string,
            threads: number,
        }[],
        gpus: {
            id: number,
            name: string,
            driver: string,
        }[]
    },
    minersInfos: MapString<MinerInfos>,
    dataDate?: number | null,
};


export type minerInstallInfos = {
    minerName: string,
    minerTitle: string,
    lastVersion: string,
    github: string,
    install(config: Config, params: MapString<any>): Promise<void>,
    getLastVersion?(github?: string): Promise<string>,
    getAllVersions?(github?: string): Promise<string[]>,
} & MapString<any>;



export type minerCommandInfos = {
    apiPort: number,
    command: string,
    getCommandFile(config: Config, params: MapString<any>): string,
    getCommandArgs(config: Config, params: MapString<any>): string[],
    getInfos(config: Config, params: MapString<any>): Promise<MinerInfos>,
} & MapString<any>;



export type MinerInfos = {
    infos: {
        name: string,
        worker: string,
        uptime: number,
        algo: string,
        hashRate: number,
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


export type MinerCpuInfos = {
    id: number,
    name: string,
    hashRate: number,
    threads: number,
};

export type MinerGpuInfos = {
    id: number,
    name: string,
    temperature: number,
    fanSpeed: number,
    hashRate: number,
    power: number | null,
};





/* NODE */

export type Node = {
    infos: {
        name: string,
        hostname: string,
        ip: string,
        os: string,
        uptime: number,
    },
    //sizes: {
    //    appDir: number,
    //    dataDir: number,
    //    confDir: number,
    //    logDir: number,
    //},
    usage: {
        loadAvg: number,
        memory: {
            used: number,
            total: number,
        },
    },
    devices: {
        cpus: {
            name: string,
            threads: number,
        }[]
    },
    fullnodesInfos: MapString<FullnodeInfos>,
    dataDate?: number | null,
};


export type fullnodeInstallInfos = {
    version: string,
    github?: string,
    install(config: Config, params: MapString<any>): Promise<void>,
    getLastVersion?(): Promise<string>,
    getAllVersions?(): Promise<string[]>,
} & MapString<any>;



export type fullnodeCommandInfos = {
    p2pPort: number,
    rpcPort: number,
    command: string,
    getCommandFile(config: Config, params: MapString<any>): string,
    getCommandArgs(config: Config, params: MapString<any>): string[],
    getInfos(config: Config, params: MapString<any>): Promise<FullnodeInfos>,
} & MapString<any>;



export type FullnodeInfos = {
    infos: {
        name: string,
        //uptime: number,
        coin: string,
    },
    //sizes: {
    //    appDir: number,
    //    dataDir: number,
    //    confDir: number,
    //    logDir: number,
    //},
    blockchain: {
        blocks: number,
        headers?: number,
    },
    dataDate?: number,
};



