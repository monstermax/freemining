#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="0.107.0-rc1"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$FULLNODE" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/nervosnetwork/ckb/releases/download/v${VERSION}/ckb_v${VERSION}_x86_64-unknown-linux-gnu.tar.gz"
    local DL_FILE=$(basename $DL_URL)
    #local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    local UNZIP_DIR="ckb_v${VERSION}_x86_64-unknown-linux-gnu"

    echo " - Downloading ${FULLNODE}"
    wget -q $DL_URL

    echo " - Unzipping"
    tar zxf ${DL_FILE}

    echo " - Install into ${fullnodesDir}/${FULLNODE}"
    rm -rf ${fullnodesDir}/${FULLNODE}
    mv $UNZIP_DIR ${fullnodesDir}/${FULLNODE}

    echo " - Initializing"
    ${fullnodesDir}/${FULLNODE}/ckb init -C ${nodeConfDir}/fullnodes/${FULLNODE} >>${INSTALL_LOG}

    fullnode_after_install "$FULLNODE" "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=${fullnodesDir}/${FULLNODE}/ckb
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        run -C ${nodeConfDir}/fullnodes/${FULLNODE}
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


