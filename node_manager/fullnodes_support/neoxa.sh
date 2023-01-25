#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="1.0.3"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/NeoxaChain/Neoxa/releases/download/v${VERSION}/neoxad-linux64.zip"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    local DL_URL_QT="https://github.com/NeoxaChain/Neoxa/releases/download/v${VERSION}/neoxa-qt-linux64.zip"
    local DL_FILE_QT=$(basename $DL_URL_QT)

    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Unzipping"
    unzip -q ${DL_FILE} -d $UNZIP_DIR

    if [ "1" = "0" ]; then
        echo " - Downloading Qt fullnode"
        wget -q $DL_URL_QT

        echo " - Unzipping Qt fullnode"
        unzip -q ${DL_FILE_QT} -d $UNZIP_DIR
    fi

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mv $UNZIP_DIR ${fullnodesDir}/${chain}

    fullnode_after_install "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=${fullnodesDir}/${FULLNODE}/neoxad
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        -datadir=${nodeConfDir}/fullnodes/${FULLNODE}
        -rpcbind=0.0.0.0
        -rpcport=9766
        -rpcuser=user
        -rpcpassword=pass
        -rpcallowip=127.0.0.1
        -rpcallowip=${IP_CRYPTO}
        -printtoconsole
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


