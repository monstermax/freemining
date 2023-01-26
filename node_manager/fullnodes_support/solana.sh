#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="1.9.12"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$FULLNODE" "$VERSION" $TMP_DIR

    local DL_URL="https://release.solana.com/v${VERSION}/install"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    echo " - Downloading ${FULLNODE}"
    wget -q $DL_URL

    echo " - Installing ${FULLNODE}..."
    chmod +x $DL_FILE
    ./$DL_FILE -d ${TMP_DIR}/${UNZIP_DIR}
    #./${TMP_DIR}/${UNZIP_DIR}/bin/solana config set --url https://api.testnet.solana.com

    echo " - Install into ${fullnodesDir}/${FULLNODE}"
    rm -rf ${fullnodesDir}/${FULLNODE}
    mv $UNZIP_DIR ${fullnodesDir}/${FULLNODE}

    fullnode_after_install "$FULLNODE" "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=${fullnodesDir}/${FULLNODE}/bin/solana-validator
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        --ful-rpc-api
        --rpc-bind-address 127.0.0.1
        --rpc-port 9981"
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


