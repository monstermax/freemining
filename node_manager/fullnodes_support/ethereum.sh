#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="1.10.26-e5eb32ac"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$VERSION" $TMP_DIR

    local DL_URL="https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-${VERSION}.tar.gz"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Unzipping"
    tar zxf $DL_FILE

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mv geth-linux-amd64-${VERSION} ${fullnodesDir}/${chain}

    fullnode_after_install "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=${fullnodesDir}/${FULLNODE}/geth
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS=""
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


