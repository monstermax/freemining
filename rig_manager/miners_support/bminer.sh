#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e



function miner_install {
    local MINER=$1
    local VERSION="16.4.11-2849b5c"
    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    local DL_URL=""
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${MINER}-unzipped"
    local INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    wget -q https://www.bminercontent.com/releases/bminer-v${VERSION}-amd64.tar.xz

    echo " - unziping..."
    tar -Jxf $DL_FILE

    echo " - installing..."
    rm -rf ${minersDir}/${MINER}
    cp -a bminer-v${VERSION} ${minersDir}/${MINER}

    #echo " - testing..."

    miner_after_install "$MINER" "$VERSION" $TMP_DIR
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

    local CMD_ARGS=""

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
