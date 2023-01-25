#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="apt"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$VERSION" $TMP_DIR

    #local DL_URL=""
    #local DL_FILE=$(basename $DL_URL)
    #local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}


    zelnodePrivKey="YOUR_ZELNODE_PK"
    zelnodeOutPoint="YOUR_COLLATERAL_TXID"
    zelnodeIndex="TX_OUTPUT_INDEX"
    externalIp=$(wget -qO- https://api4.my-ip.io/ip)
    bindIp="0.0.0.0"

    ipAddress="SERVER_IP_ADDRESS"
    zelId="YOUR_ZELID"
    cruxId="YOUR_CRUXID"
    testNet="false"

    #echo " - Installing dependencies packages: build tools"
    #rootRequired

    #apt-get update -qq
    #apt-get install -qq -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common
    #curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/trusted.gpg.d/docker.asc >/dev/null
    #add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    #apt-get update -qq
    #apt-get install -qq -y docker-ce docker-ce-cli containerd.io

    #sudo apt-get update -qq
    #sudo apt-get upgrade -qq -y 
    #sudo apt-get install -qq -y build-essential pkg-config libc6-dev m4
    #sudo apt-get install -qq -y g++-multilib autoconf libtool ncurses-dev unzip git python
    #sudo apt-get install -qq -y python-zmq zlib1g-dev wget curl bsdmainutils automake

    mkdir -p ${nodeConfDir}/fullnodes/${chain}/zelcash
    touch ${nodeConfDir}/fullnodes/${chain}/zelcash/zelcash.conf

    cat << EOF > ${nodeConfDir}/fullnodes/${chain}/zelcash/zelcash.conf
rpcuser=user
rpcpassword=pass
rpcallowip=127.0.0.1
#rpcallowip=172.18.0.1
rpcport=16124
port=16125
#zelnode=1
#zelnodeprivkey=${zelnodePrivKey}
#zelnodeoutpoint=${zelnodeOutPoint}
#zelnodeindex=${zelnodeIndex}
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
EOF

    # Bootstrap
    #wget https://www.dropbox.com/s/kyqe8ji3g1yetfx/zel-bootstrap.zip
    #unzip zel-bootstrap.zip -d ${nodeConfDir}/fullnodes/${chain}/zelcash
    #rm zel-bootstrap.zip

    if [ "`getCmdPath mongod`" = "" ]; then
        echo " - Installing MongoDB"
        rootRequired
        wget -qO- https://www.mongodb.org/static/pgp/server-4.2.asc | sudo tee /etc/apt/trusted.gpg.d/mongodb-server-4.2.asc >/dev/null
        echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list >/dev/null

        sudo apt-get update -qq
        sudo apt-get install -qq -y mongodb-org
        sudo service mongod start
        sudo systemctl enable mongod
    fi


    #echo " - Downloading dependencies: NVM, NodeJS"
    #VERSION="0.35.3"
    #wget https://raw.githubusercontent.com/nvm-sh/nvm/v${VERSION}/install.sh
    #bash install.sh
    #source ~/.profile
    #nvm install --lts


    # Installing zelcashd
    echo " - Installing ${chain}/zelcashd"
    rootRequired

    #echo 'deb https://apt.zel.cash/ all main' | sudo tee /etc/apt/sources.list.d/zelcash.list >/dev/null
    #echo 'deb https://zelcash.github.io/aptrepo/ all main' | sudo tee /etc/apt/sources.list.d/zelcash.list
    echo 'deb https://apt.runonflux.io/ '$(lsb_release -cs)' main' | sudo tee /etc/apt/sources.list.d/zelcash.list >/dev/null

    gpg --keyserver keyserver.ubuntu.com --recv 4B69CA27A986265D >/dev/null
    gpg --export 4B69CA27A986265D 2>/dev/null | sudo tee /etc/apt/trusted.gpg.d/zelcash.asc >/dev/null

    sudo apt-get update -qq
    sudo apt-get install -qq -y zelcash zelbench

    zelcash-fetch-params.sh >/dev/null


    echo " - Downloading ${chain}/zelflux"
    git clone https://github.com/zelcash/zelflux.git >>${INSTALL_LOG} 2>>${INSTALL_LOG}


    mkdir -p ${nodeConfDir}/fullnodes/${chain}/zelflux/config
    touch ${nodeConfDir}/fullnodes/${chain}/zelflux/config/userconfig.js

    cat << EOF > ${nodeConfDir}/fullnodes/${chain}/zelflux/config/userconfig.js
module.exports = {
    initial: {
        ipaddress: '${ipAddress}',
        zelid: '${zelId}',
        cruxid: '${cruxId}',
        testnet: ${testNet}
    }
}
EOF


    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mkdir -p ${fullnodesDir}/${chain}
    mv zelflux ${fullnodesDir}/${chain}/

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"

    fullnode_after_install "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=/usr/local/bin/zelcashd
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        -datadir=${nodeConfDir}/fullnodes/${FULLNODE}
        -port=16125
        -rpcport=16124
        -rpcuser=user
        -rpcpassword=pass
        -rpcallowip=127.0.0.1
        -rpcallowip=${IP_CRYPTO}
        "
    echo $CMD_ARGS
}



function fullnode_status_txt {
    local FULLNODE=$1
    # not available
}


function fullnode_status_json {
    local FULLNODE=$1
    # not available
}





############################################


if [ "$0" = "$BASH_SOURCE" ]; then
    FILENAME=$(basename $0)
    FULLNODE=$(echo ${FILENAME%.*})
    fullnode_run $FULLNODE $@
fi


