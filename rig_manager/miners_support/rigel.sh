#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e



function miner_install {
    local MINER=$1
    local VERSION="1.3.0"
    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/rigelminer/rigel/releases/download/${VERSION}/rigel-${VERSION}-linux.tar.gz"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${MINER}-unzipped"
    local INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    wget -q $DL_URL

    echo " - unziping..."
    tar zxf $DL_FILE

    echo " - installing..."
    rm -rf ${minersDir}/${MINER}
    cp -a rigel-${VERSION}-linux ${minersDir}/${MINER}

    echo " - testing..."
    ${minersDir}/${MINER}/rigel --list-devices

    miner_after_install "$MINER" "$VERSION" $TMP_DIR
}


function miner_get_run_cmd {
    local MINER=$1
    shift || true

    local CMD_EXEC=${minersDir}/${MINER}/rigel
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
        -a ${ALGO}
        -o stratum+tcp://${POOL_URL}
        -u ${POOL_ACCOUNT}
        -p x
        --api-bind=127.0.0.1:${API_PORT}
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
