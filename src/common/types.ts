
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
    "--user-dir"
);


export type CliParams = (
    "--cli-wss-conn-timeout" |
    "--cli-wss-server-address" |

    // RIG
    "--miner-start" |
    "--miner-stop" |
    "--miner-status" |
    "--miner-infos" |
    "--miner-install"
);


export type DaemonParams = (
    "--run" |
    "--start" |
    "--stop" |
    "--status" |
    "--listen-address" |
    "--listen-port" |
    "--wss-conn-timeout" |
    "--poll-delay"
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



export type minerInstallInfos = {
    version: string,
    install(config: Config, params: MapString<any>): Promise<void>,
}



export type minerCommandInfos = {
    apiPort: number,
    command: string,
    getCommandFile(config: Config, params: MapString<any>): string,
    getCommandArgs(config: Config, params: MapString<any>): string[],
    getInfos(config: Config, params: MapString<any>): Promise<MinerInfos>,
};



export type MinerInfos = {
    infos: {
        name: string,
        worker: string,
        algo: string,
        hashRate: number,
    },
    pool: {
        url: string,
        account: string,
    },
    devices: {
        cpus: MinerCpuInfos[],
        gpus: MinerGpuInfos[],
    },
    dataDate?: Date,
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


export type RigInfos = {
    
};



export type Process = {
    type: string,
    name: string,
    cmdFile: string,
    args: string[],
    runningDir: string,
    appDir: string,
    cmdPath: string,
    pid: number | undefined,
    process: childProcess.ChildProcessWithoutNullStreams | undefined,
}


export type ExecOnSpawn = (proc: childProcess.ChildProcessWithoutNullStreams) => void;

export type ExecOnStdOut = (data: Buffer) => void;

export type ExecOnStdErr = (data: Buffer) => void;

export type ExecOnEnd = (returnCode: number, err: any) => void;


export type Rig = {
    infos: {
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
    checkDate?: Date,
};

