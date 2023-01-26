#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e



function miner_install {
    local MINER=$1
    local VERSION="1.82"
    local VERSION_BIS="1_82"

    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/sp-hash/TeamBlackMiner/releases/download/v${VERSION}/TeamBlackMiner_${VERSION_BIS}_Ubuntu_18_04_Cuda_11_6.tar.xz"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${MINER}-unzipped"
    local INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    wget -q $DL_URL

    echo " - unziping..."
    tar -Jxf $DL_FILE
    UNZIP_DIR=TeamBlackMiner_${VERSION_BIS}_Ubuntu_18_04_Cuda_11_6

    echo " - installing..."
    rm -rf ${minersDir}/${MINER}
    mv $UNZIP_DIR ${minersDir}/${MINER}

    echo " - testing..."
    ${minersDir}/${MINER}/TBMiner --list-devices

    miner_after_install "$MINER" "$VERSION" $TMP_DIR
}



function miner_get_run_cmd {
    local MINER=$1
    shift || true

    local CMD_EXEC=${minersDir}/${MINER}/TBMiner
    echo $CMD_EXEC
}



function miner_get_run_args {
    local MINER=$1
    local ALGO=$2
    local POOL_URL=$3
    local POOL_ACCOUNT=$4
    shift 4 || true

    local POOL_HOST=$(echo "$POOL_URL" |cut -d":" -f1)
    local POOL_PORT=$(echo "$POOL_URL" |cut -d":" -f2)

    local POOL_ADDR=$(echo "$POOL_ACCOUNT" |cut -d"." -f1)
    local WORKER_NAME=$(echo "$POOL_ACCOUNT" |cut -d"." -f2)

    local API_PORT=$(getMinerApiPort ${MINER})

    local CMD_ARGS="
        --algo ${ALGO}
        --hostname ${POOL_HOST}
        --port ${POOL_PORT}
        --wallet ${POOL_ADDR}
        --worker-name ${WORKER_NAME}
        --server-passwd x
        --api
        --api-ip 127.0.0.1
        --api-port ${API_PORT}
    "

    echo $CMD_ARGS
}



function TODO_miner_status_txt {
    local MINER=$1
}


function TODO_miner_status_json {
    local MINER=$1
}



############################################


if [ "$0" = "$BASH_SOURCE" ]; then
    FILENAME=$(basename $0)
    MINER=$(echo ${FILENAME%.*})

    if test "$1" = "--install-miner"; then
        miner_alias=$MINER

        if hasOpt --alias; then
            miner_alias=$(getOpt --alias)
        fi

        miner_install $miner_alias $@

    else
        miner_run $MINER $@
    fi
fi

