#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e



function miner_install {
    local MINER=$1
    local VERSION="12.2.0"
    local TMP_DIR=$(mktemp -d)
    miner_before_install "$VERSION" $TMP_DIR

    DL_URL="https://github.com/bzminer/bzminer/releases/download/v${VERSION}/bzminer_v${VERSION}_linux.tar.gz"
    DL_FILE=$(basename $DL_URL)
    UNZIP_DIR="${MINER}-unzipped"
    INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    wget -q $DL_URL

    echo " - unziping..."
    tar zxf $DL_FILE

    echo " - installing..."
    rm -rf ${minersDir}/${MINER}
    cp -a bzminer_v${VERSION}_linux ${minersDir}/${MINER}

    #echo " - testing..."

    miner_after_install "$VERSION" $TMP_DIR
}


function miner_get_run_cmd {
    local MINER=$1
    shift || true

    local CMD_EXEC=${minersDir}/${MINER}/${MINER}
    echo $CMD_EXEC
}


function miner_get_run_args {
    local MINER=$1
    local ALGO=$2
    local POOL_URL=$3
    local POOL_ACCOUNT=$4
    shift 4 || true

    local API_PORT=$(getMinerApiPort ${MINER})

    local CMD_ARGS="
        
        "

    echo $CMD_ARGS
}


function miner_status_txt {
    local MINER=$1
}


function miner_status_json {
    local MINER=$1
}




############################################


if [ "$0" = "$BASH_SOURCE" ]; then
    FILENAME=$(basename $0)
    MINER=$(echo ${FILENAME%.*})
    MINER_CMD=$(miner_get_run_cmd ${MINER})

    if test -x $MINER_CMD; then
        exec $MINER_CMD $@
    fi

fi

