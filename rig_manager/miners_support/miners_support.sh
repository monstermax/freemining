#!/bin/bash

cd `dirname $BASH_SOURCE`

source ../rig_manager.sh
set -e


mkdir -p ${rigLogDir}/miners
mkdir -p ${rigPidDir}/miners


function miner_install {
    local MINER=$1
    # extends ME

    echo "Error: Miner ${MINER} has no installation script" >&2
    return 1
}


function miner_before_install {
    local MINER=$1
    local VERSION=$2
    local TMP_DIR=$3

    if [ "$MINER" = "" ]; then
        echo "Error: missing MINER"
        exit 1
    fi

    if [ "$VERSION" = "" ]; then
        #echo "Error: missing VERSION"
        #exit 1
        true
    fi

    if [ "$TMP_DIR" = "" ]; then
        echo "Error: missing TMP_DIR"
        exit 1
    fi

    mkdir -p ${rigLogDir}/miners
    mkdir -p ${rigPidDir}/miners
    mkdir -p ${rigDataDir}/miners
    mkdir -p ${minersDir}

    mkdir -p ${TMP_DIR}
    cd ${TMP_DIR}

    echo "Installing ${MINER} ${VERSION}..."
    echo "Target: ${minersDir}/${MINER}"
}


function miner_after_install {
    local MINER=$1
    local VERSION=$2
    local TMP_DIR=$3

    rm -rf $TMP_DIR
    echo
    echo "Miner ${MINER} ${VERSION} successfully installed into ${minersDir}/${MINER}"
}



function miner_get_run_cmd {
    local MINER=$1
    # extends ME

    echo "Error: Miner ${MINER} has no get_run_cmd script" >&2
    return 1
}


function miner_get_run_args {
    local MINER=$1
    # extends ME

    echo "Error: Miner ${MINER} has no get_run_args script" >&2
    return 1
}


function miner_run {
    local MINER=$1
    local MINER_CMD=$(miner_get_run_cmd "$MINER")

    if ! test -d ${minersDir}/${MINER}; then
        echo "Error: Miner $MINER is not installed"
        exit 1

    elif test -x $MINER_CMD; then
        exec $MINER_CMD $@

    else
        echo "Error: invalid command $MINER_CMD"
        exit 1
    fi

}


function miner_status_txt {
    local MINER=$1
    # extends ME

    #echo "Error: Miner ${MINER} has no status-txt script" >&2
    #return 1
}


function miner_status_json {
    local MINER=$1
    # extends ME

    #echo "Error: Miner ${MINER} has no status-json script" >&2
    #return 1
}

