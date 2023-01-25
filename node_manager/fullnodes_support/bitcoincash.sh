#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="26.0.0"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/bitcoin-cash-node/bitcoin-cash-node/releases/download/v${VERSION}/bitcoin-cash-node-${VERSION}-x86_64-linux-gnu.tar.gz"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}


    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Unzipping"
    tar zxvf $DL_FILE

    echo " - Install into ${fullnodesDir}/${chain}"
    cd bitcoin-cash-node-${VERSION}
    ln -s bin/bitcoind
    ln -s bin/bitcoin-cli
    ln -s bin/bitcoin-qt
    ln -s bin/bitcoin-tx
    cd ..

    rm -rf ${fullnodesDir}/${chain}
    mv bitcoin-cash-node-${VERSION} ${fullnodesDir}/${chain}

    fullnode_after_install "$VERSION" $TMP_DIR
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


