#!/bin/bash

set -e
cd `dirname $0`

source _common.sh

check_non_root

# actions = wallet_install | wallet_start | wallet_stop | {shell command}
ACTION=$1
shift || true


# Flux Wallet/Fullnode


## Help
# Tuto:
# - https://github.com/RunOnFlux/flux
# - https://medium.com/@mmalik4/flux-light-node-setup-as-easy-as-it-gets-833f17c73dbb

# Original scripts:
# - https://raw.githubusercontent.com/XK4MiLX/zelnode/master/install_pro.sh
# - https://raw.githubusercontent.com/RunOnFlux/fluxnode-multitool/master/multitoolbox.sh
# - https://raw.githubusercontent.com/RunOnFlux/fluxnode-multitool/master/flux_common.sh
# - https://gist.githubusercontent.com/web3invest/a3e397cdcdd79858cbf4220a88276d03/raw/dc7c104bf362c0903aacd7227451c2119a5a99e9/flux_node_viewer_22_04_1_LTS.sh



## Config

WALLET_NAME="flux"
DOCKER_IMAGE="ubuntu:20.04"
WALLET_DIR_REAL="$HOME/wallets/${WALLET_NAME}"
WALLET_DIR_CONTAINER="/home/${WALLET_NAME}"

## 

zelnodePrivKey="L4N9U4Mxo4zPxkcxABuR9DbNtzJsP2hVVQHWyKm8nxQosVQrvFYp"
zelnodeOutPoint="315750f628eada245b52bcf9dde9946c640dcb58ccee2fe268b7d486bc06d1e9"
zelnodeIndex="0"
externalIp=$(hostname -i)
bindIp="0.0.0.0"

ipAddress="$externalIp"
zelId="16z3YnwnWS2yW4X69Fb359hZSx3UNoRjcv"
cruxId="" # YOUR_CRUXID
kadenaId="kadena:k:efb1fce9ad121dc55db88d11b3f025fd926535d450dfda7ce546fe7d977c9dc2?chainid=0"
testNet="false"



## functions


function docker_flux_install_dependencies {
    mkdir -p ${WALLET_DIR_REAL}/bin


    cat << _EOF > ${WALLET_DIR_REAL}/bin/wallet_install_1
#!/bin/bash

#apt-get install -qq -y software-properties-common
#apt-get install -qq -y nano htop pwgen ufw figlet tmux jq zip gzip pv unzip git
#apt-get install -qq -y build-essential libtool pkg-config
#apt-get install -qq -y libc6-dev m4 g++-multilib
#apt-get install -qq -y autoconf ncurses-dev python python-zmq
#apt-get install -qq -y wget curl bsdmainutils automake fail2ban
#apt-get remove -y sysbench
_EOF
}


function docker_flux_install_npm {
    mkdir -p ${WALLET_DIR_REAL}/bin

    if [ ! -f ${WALLET_DIR_REAL}/flux/init.js ]; then
        cd ${WALLET_DIR_REAL}
        rm -rf flux
        git clone https://github.com/runonflux/flux
    fi

    cat << _EOF > ${WALLET_DIR_REAL}/flux/config/userconfig.js
module.exports = {
    initial: {
        ipaddress: '${ipAddress}',
        zelid: '${zelId}',
        cruxid: '${cruxId}',
        kadena: '${kadenaId}',
        testnet: ${testNet}
    }
}
_EOF

    cat << _EOF > ${WALLET_DIR_REAL}/.zelcash.conf
rpcuser=user
rpcpassword=pass
rpcallowip=127.0.0.1
#rpcallowip=172.18.0.1
rpcport=16124
port=16125
server=1
daemon=1
txindex=1
listen=1
externalip=${externalIp}
bind=${bindIp}
addnode=explorer.zel.cash
addnode=explorer2.zel.cash
addnode=explorer.zel.zelcore.io
addnode=blockbook.zel.network
maxconnections=256
_EOF

    if [ -n "$zelnodePrivKey" -a -n "$zelnodeOutPoint" -a -n "$zelnodeIndex" ]; then
        cat << _EOF >> ${WALLET_DIR_REAL}/.zelcash.conf
zelnode=1
zelnodeprivkey=${zelnodePrivKey}
zelnodeoutpoint=${zelnodeOutPoint}
zelnodeindex=${zelnodeIndex}
_EOF
    fi

    cat << _EOF > ${WALLET_DIR_REAL}/bin/wallet_install_2
#!/bin/bash

cd ${WALLET_DIR_CONTAINER}/flux
npm install
_EOF

    chmod +x ${WALLET_DIR_REAL}/bin/wallet_install_2
    docker_container_exec ${WALLET_DIR_CONTAINER}/bin/wallet_install_2

    sudo chown $USER: ${WALLET_DIR_REAL}/flux -R
}


function docker_flux_install_daemon {
    mkdir -p ${WALLET_DIR_REAL}/bin

    cat << _EOF > ${WALLET_DIR_REAL}/bin/wallet_install_3
#!/bin/bash

if [ ! -f /etc/apt/sources.list.d/zelcash.list ]; then
    echo 'deb https://apt.runonflux.io/ '\$(lsb_release -cs)' main' | tee /etc/apt/sources.list.d/zelcash.list >/dev/null
    gpg --keyserver keyserver.ubuntu.com --recv 4B69CA27A986265D >/dev/null
    gpg --export 4B69CA27A986265D | apt-key add -
fi

apt-get update -qq
apt-get install -qq -y zelcash zelbench

zelcash-fetch-params.sh
_EOF

    sudo chown $USER: ${WALLET_DIR_REAL}/flux -R
    chmod +x ${WALLET_DIR_REAL}/bin/wallet_install_3

    docker_container_exec ${WALLET_DIR_CONTAINER}/bin/wallet_install_3
}


function docker_flux_start {
    mkdir -p ${WALLET_DIR_REAL}/bin

    cat << _EOF > ${WALLET_DIR_REAL}/bin/wallet_start
#!/bin/bash

cd ${WALLET_DIR_CONTAINER}/flux
npm start
zelcashd
_EOF

    docker_container_exec ${WALLET_DIR_CONTAINER}/bin/wallet_start
}



## Requirements

install_docker
#install_nodejs
#install_mongodb
#install_jq
#install_git


docker_image_download


## Flux install


if [ "$ACTION" = "stop" ]; then
    docker_container_stop
    exit 0
fi

docker_container_create

is_docker_container_running=$(docker container ls -f name="^/${WALLET_NAME}$" -q |wc -l)

if [ "$ACTION" = "install" ]; then
    docker_container_start

    docker_container_install_base

    docker_container_create_user

    docker_install_nodejs

    docker_install_mongodb

    docker_flux_install_dependencies
    docker_flux_install_npm
    docker_flux_install_daemon
fi


if [ "$ACTION" = "start" ]; then
    docker_container_start
    docker_flux_start
    exit 0
fi


if [ "$ACTION" = "exec" -o "$ACTION" = "shell" ]; then
    docker_container_start
    docker_container_exec $@
fi


if [ "$is_docker_container_running" = "0" ]; then
    docker_container_stop
fi




### in docker container...

#sudo ufw allow 16126
#sudo ufw allow 16127
#sudo ufw allow 16129


