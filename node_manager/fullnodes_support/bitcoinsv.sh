#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="sources"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$FULLNODE" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/bitcoin-sv/bitcoin-sv"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}


    echo " - Installing dependencies packages: build tools"
    rootRequired

    sudo apt-get install -qq -y build-essential libtool autotools-dev automake pkg-config libssl-dev libevent-dev bsdmainutils
    sudo apt-get install -qq -y libboost-system-dev libboost-filesystem-dev libboost-chrono-dev libboost-program-options-dev libboost-test-dev libboost-thread-dev
    sudo apt-get install -qq -y libboost-all-dev libdb-dev libdb++-dev libminiupnpc-dev
    sudo apt-get install -qq -y libgoogle-perftools-dev libzmq3-dev

    echo " - Downloading ${FULLNODE}"
    git clone $DL_URL >>${INSTALL_LOG} 2>>${INSTALL_LOG}
    cd bitcoin-sv

    echo " - Compiling 1/3"
    ./autogen.sh >>${INSTALL_LOG} 2>>${INSTALL_LOG}

    echo " - Compiling 2/3"
    mkdir build
    cd build
    ../configure >>${INSTALL_LOG} 2>>${INSTALL_LOG}

    echo " - Compiling 2/3 (about 1 hour remaining...)"
    make >>${INSTALL_LOG} 2>>${INSTALL_LOG}
    # 1 hour compilation...

    echo " - Install into ${fullnodesDir}/${FULLNODE}"
    rm -rf ${fullnodesDir}/${FULLNODE}
    mkdir -p ${fullnodesDir}/${FULLNODE}
    cp -a ./src/{bitcoind,bitcoin-cli,bitcoin-miner,bitcoin-tx} ${fullnodesDir}/${FULLNODE}/

    fullnode_after_install "$FULLNODE" "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=${fullnodesDir}/${FULLNODE}/bitcoind
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        -datadir=${nodeConfDir}/fullnodes/${FULLNODE}
        -server
        -port=8333
        -rpcbind=0.0.0.0
        -rpcport=8332
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

    if test "$1" = "--install-fullnode"; then
        fullnode_alias=$FULLNODE

        if hasOpt --alias; then
            fullnode_alias=$(getOpt --alias)
        fi

        fullnode_install $fullnode_alias $@

    else
        fullnode_run $FULLNODE $@
    fi
fi


