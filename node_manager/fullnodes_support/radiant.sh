#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="sources"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$FULLNODE" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/RadiantBlockchain/radiant-node"
    #local DL_FILE=$(basename $DL_URL)
    #local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    echo " - Installing dependencies packages: build tools"
    rootRequired
    sudo apt-get install -qq -y build-essential cmake git libboost-chrono-dev libboost-filesystem-dev libboost-test-dev libboost-thread-dev libevent-dev libminiupnpc-dev libssl-dev libzmq3-dev help2man ninja-build python3
    sudo apt-get install -qq -y libdb-dev libdb++-dev
    sudo apt-get install -qq -y libqrencode-dev libprotobuf-dev protobuf-compiler qttools5-dev

    echo " - Downloading sources"
    git clone $DL_URL >>${INSTALL_LOG} 2>>${INSTALL_LOG}

    echo " - Compiling ${chain} (1/2)"
    mkdir radiant-node/build && cd radiant-node/build
    cmake -GNinja .. -DBUILD_RADIANT_QT=OFF >>${INSTALL_LOG}
    # OR cmake -GNinja ..

    echo " - Compiling ${chain} (2/2)"
    ninja >>${INSTALL_LOG}

    echo " - Install tmp"
    rm -rf dist
    DESTDIR="dist" ninja install

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mkdir -p ${fullnodesDir}/${chain}
    cp -a ./dist/usr/local/* ${fullnodesDir}/${chain}/

    cd ${fullnodesDir}/${chain}
    ln -s bin/radiantd
    ln -s bin/radiant-cli
    ln -s bin/radiant-wallet
    ln -s bin/radiant-tx

    cd ..
    rm -rf build

    fullnode_after_install "$FULLNODE" "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=${fullnodesDir}/${FULLNODE}/radiantd
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        -datadir=${nodeConfDir}/fullnodes/${FULLNODE}
        -daemon
        -rpcbind=0.0.0.0
        -rpcport=7332
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


