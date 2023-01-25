#!/bin/bash

cd `dirname $BASH_SOURCE`

source ../rig_manager.sh
set -e


mkdir -p ${rigLogDir}/miners
mkdir -p ${rigPidDir}/miners


function miner_before_install {
    local MINER=$1
    local VERSION=$2
    local TMP_DIR=$3

    if [ "$MINER" = "" ]; then
        echo "Error: missing MINER_INSTALL"
        exit 1
    fi

    mkdir -p ${rigLogDir}/miners
    mkdir -p ${rigPidDir}/miners
    mkdir -p ${rigDataDir}/miners
    mkdir -p ${minersDir}

    mkdir -p ${TMP_DIR}
    cd ${TMP_DIR}

    echo "Installing ${MINER} ${VERSION}..."
}


function miner_after_install {
    local MINER=$1
    local VERSION=$1
    local TMP_DIR=$2

    rm -rf $TMP_DIR
    echo
    echo "Miner ${MINER} ${VERSION} successfully installed into ${minersDir}/${MINER}"
}


function miner_run {
    local cmd=$(miner_get_run_cmd)
    $cmd
}

