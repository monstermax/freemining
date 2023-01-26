#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



# install node: https://www.makertronic-yt.com/creer-un-noeud-bitcoin-lightning/


function fullnode_install {
    local FULLNODE=$1
    local VERSION="0.15.5-beta"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$FULLNODE" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/lightningnetwork/lnd/releases/download/v${VERSION}/lnd-linux-amd64-v${VERSION}.tar.gz"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    echo " - Downloading ${FULLNODE}"
    wget -q $DL_URL

    echo " - Unzipping"
    tar zxf $DL_FILE
    UNZIP_DIR=lnd-linux-amd64-v${VERSION}

    echo " - Install into ${fullnodesDir}/${FULLNODE}"
    rm -rf ${fullnodesDir}/${FULLNODE}
    mv $UNZIP_DIR ${fullnodesDir}/${FULLNODE}
    touch ${nodeConfDir}/fullnodes/${FULLNODE}/lnd.conf

    fullnode_after_install "$FULLNODE" "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=${fullnodesDir}/${FULLNODE}/lnd
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        --lnddir=${nodeConfDir}/fullnodes/${FULLNODE}
        --datadir=${nodeConfDir}/fullnodes/${FULLNODE}/data
        --bitcoin.active
        --bitcoin.mainnet
        --bitcoin.node=bitcoind
        --bitcoind.dir=${nodeConfDir}/fullnodes/bitcoin
        --bitcoind.rpchost=localhost:8332
        --bitcoind.rpcuser=user
        --bitcoind.rpcpass=pass
        --bitcoind.zmqpubrawblock=tcp://*:28332
        --bitcoind.zmqpubrawtx=tcp://*:28333
        --rpclisten=127.0.0.1
        --restlisten=127.0.0.1
        --logdir=${nodeLogDir}/fullnodes/${FULLNODE}
        "
    echo $CMD_ARGS
}



function TODO_fullnode_status_txt {
    local FULLNODE=$1
    # not available
}


function TODO_fullnode_status_json {
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


