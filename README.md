
# FreeMining

Mining & Fullnodes tools


## Presentation

## RIG Manager

Tous les outils pour gérer un rig de minage de crypto-monnaies.  
Installation des miners, programmation des feuilles de routes, start/stop/status/monitoring des miners...

## FARM Manager
Tous les outils pour gérer une ferme de rigs de minage.  
Visualisez et contrôler tous vos rigs en un seul endroit.

## NODE Manager
Tous les outils pour gérer vos fullnodes de différentes blockchains.  
Installation des fullnodes, start/stop/status/monitoring des fullnodes...

## POOL Manager
Tous les outils pour créer et gérer des pools de mining.  
Installation des outils, start/stop/status/monitoring des services.


## Installation

### Requirements


```bash
sudo apt-get install -y curl build-essential cmake
```

#### NodeJS for Linux
```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### NodeJS for Windows
Download NodeJS from https://nodejs.org/en/download/

Advice (optional): install and use Git Bash. https://gitforwindows.org/


#### Python 3 

(if not already installed. For example on Ubuntu 16.04).
Use this if `npm install` failed.

For Windows, Python is installed with NodeJS and NPM.

```bash
cd /tmp
wget https://www.python.org/ftp/python/3.9.7/Python-3.9.7.tgz

tar -xf Python-3.9.7.tgz
cd Python-3.9.7
./configure --enable-optimizations
```

### Install

```bash
# Clone
git clone https://github.com/monstermax/freemining 

# Install NPM dependencies
cd freemining
npm install

# Generate config files
./frmd --create-config

# edit config files
nano ~/.freemining/config/freemining.json      # change httpAllowedIps if wanted
nano ~/.freemining/config/rig/rig.json         # change name if wanted + set farmAgent host/port/pass

nano ~/.freemining/config/rig/coins_pools.json
nano ~/.freemining/config/rig/coins_wallets.json
```

Note: on Windows, adapt the code with:
```bash
./frmd.bat --create-config

notepad ~\AppData\Local\freemining\config\freemining.json
notepad ~\AppData\Local\freemining\config\rig\rig.json
```


## Usage

```bash
# Start screen (optionnal. Linux only)
screen -R freemining

# Run daemon
./frmd -a -r
```

Note: on Windows, replace `frmd` by `frmd.bat`.

View app : http://localhost:1234/


```bash
$ ./frm-cli --rig-miner-infos cpuminer
{"miner":{"name":"cpuminer","worker":"","uptime":"69133","algo":"yescryptr16","hashRate":"1831.78"},"pool":{"url":"connect.fennecblockchain.com:8200","account":""},"devices":{"cpus":[{"id":0,"name":"","hashRate":1835.3,"threads":19}],"gpus":[]}}

```


### Help

#### Daemon

```
======================
| ⛏️   FreeMining  ⛏️  | => frmd
======================

Usage:

frmd <params>

     --help                                  # display this this message
     --user-dir                              # default %HOME%/.freemining OR %HOME%/AppData/Local/freemining

     --create-config

     --listen-address                        # daemon listen address. default 127.0.0.1
     --listen-port                           # daemon listen port. default 1234
     --wss-conn-timeout                      # clients connection timeout (if no ping). default 10 seconds

     -r | --rig-monitor-start                # start rig monitor at freemining start
     -a | --rig-farm-agent-start             # start rig farm agent at freemining start
     -n | --node-monitor-start               # start node monitor at freemining start
     -f | --farm-server-start                # start farm rigs server at freemining start
     -p | --pool-monitor-start               # start pool monitor at freemining start

     --rig-monitor-poll-delay                # delay between 2 checks of the rig status
     --node-monitor-poll-delay               # delay between 2 checks of the node status

     --rig-farm-server-host
     --rig-farm-server-port
     --rig-farm-server-pass
```


#### Cli
```
======================
| ⛏️   FreeMining  ⛏️  | => frm-cli
======================

Usage:

frm-cli <params>

        --help                                                 # display this message
        --sysinfos                                             # display server system informations
        --sysinfos [--local]                                   # display cli system informations

        --ws-server-host                                       # daemon host. default 127.0.0.1
        --ws-server-port                                       # daemon port. default 1234
        --ws-conn-timeout                                      # daemon connection timeout. default 2 seconds

    + Rig Manager
        --rig-infos                                            # display rig infos
        --rig-monitor-start                                    # start rig monitor
        --rig-monitor-stop                                     # stop rig monitor
        --rig-monitor-status                                   # display rig monitor status

        --rig-farm-agent-start                                 # start rig farm agent
        --rig-farm-agent-stop                                  # stop rig farm agent
        --rig-farm-agent-status                                # display rig farm agent status

        --rig-miner-start                                      # start a miner
        --rig-miner-stop                                       # stop a miner
        --rig-miner-status                                     # display a miner status
        --rig-miner-log                                        # display a miner logs
        --rig-miner-infos                                      # display a miner infos
        --rig-miner-install [--alias xx] [--version vv]        # install a miner
        --rig-miner-uninstall                                  # uninstall a miner

    + Farm Manager
        --farm-infos                                           # display farm status
        --farm-server-start                                    # start farm server
        --farm-server-stop                                     # stop farm server
        --farm-server-status                                   # display farm server status

    + Node Manager
        --node-infos                                           # display node status
        --node-monitor-start                                   # start node monitor
        --node-monitor-stop                                    # stop node monitor
        --node-monitor-status                                  # display node monitor status

        --node-fullnode-start                                  # start a fullnode
        --node-fullnode-stop                                   # stop a fullnode
        --node-fullnode-status                                 # display a fullnode status
        --node-fullnode-log                                    # display a fullnode logs
        --node-fullnode-infos                                  # display a fullnode infos
        --node-fullnode-install [--alias xx] [--version vv]    # install a fullnode
        --node-fullnode-uninstall                              # uninstall a fullnode

    + Pool Manager
        --pool-infos                                           # display pool status
        --pool-monitor-start                                   # start pool monitor
        --pool-monitor-stop                                    # stop pool monitor
        --pool-monitor-status                                  # display pool monitor status

        --pool-engine-start                                    # start a pool engine
        --pool-engine-stop                                     # stop a pool engine
        --pool-engine-status                                   # display a pool engine status
        --pool-engine-log                                      # display an engine logs
        --pool-engine-infos                                    # display an engine infos
        --pool-engine-install [--alias xx] [--version vv]      # install an engine
        --pool-engine-uninstall                                # uninstall an engine
```

