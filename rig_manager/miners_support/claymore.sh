#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e



function miner_install {
    local MINER=$1
    local VERSION="15.0"
    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/Claymore-Dual/Claymore-Dual-Miner/releases/download/${VERSION}/Claymore.s.Dual.Ethereum.AMD+NVIDIA.GPU.Miner.v${VERSION}.-.LINUX.zip"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${MINER}-unzipped"
    local INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    wget -q $DL_URL

    echo " - unziping..."
    unzip $DL_FILE

    echo " - installing..."
    rm -rf ${minersDir}/${MINER}
    cp -a Claymore.s.Dual.Ethereum.AMD+NVIDIA.GPU.Miner.v${VERSION}.-.LINUX ${minersDir}/${MINER}
    chmod +x ${minersDir}/${MINER}/ethdcrminer64

    echo " - testing..."
    ${minersDir}/${MINER}/ethdcrminer64 -list

    miner_after_install "$MINER" "$VERSION" $TMP_DIR
}


function TODO_miner_get_run_cmd {
    local MINER=$1
    shift || true

    local CMD_EXEC=${minersDir}/${MINER}/${MINER}
    echo $CMD_EXEC
}


function TODO_miner_get_run_args {
    local MINER=$1
    local ALGO=$2
    local POOL_URL=$3
    local POOL_ACCOUNT=$4
    shift 4 || true

    local API_PORT=$(getMinerApiPort ${MINER})

    local CMD_ARGS=""

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

