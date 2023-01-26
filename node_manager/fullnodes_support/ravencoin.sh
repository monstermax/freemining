#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="4.3.2.1"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$FULLNODE" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/RavenProject/Ravencoin/releases/download/v${VERSION}/raven-${VERSION}-x86_64-linux-gnu.zip"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    echo " - Downloading ${FULLNODE}"
    wget -q $DL_URL

    echo " - Unzipping"
    unzip -q $DL_FILE -d ${UNZIP_DIR}

    mv ${UNZIP_DIR}/linux/raven-${VERSION}-x86_64-linux-gnu.tar.gz .
    echo " - Unzipping second archive"
    tar zxf raven-${VERSION}-x86_64-linux-gnu.tar.gz

    echo " - Install into ${fullnodesDir}/${FULLNODE}"
    rm -rf ${fullnodesDir}/${FULLNODE}
    cp -a ./raven-${VERSION}/bin ${fullnodesDir}/${FULLNODE}

    rm -rf ${UNZIP_DIR}

    fullnode_after_install "$FULLNODE" "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=${fullnodesDir}/${FULLNODE}/ravend
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        -datadir=${nodeConfDir}/fullnodes/${FULLNODE}
        -rpcbind=127.0.0.1
        -rpcport=8766
        -rpcuser=user
        -rpcpassword=pass
        -rpcallowip=127.0.0.1
        -maxconnections=100
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


