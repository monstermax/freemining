#!/bin/bash

cd `dirname $BASH_SOURCE`

source ../node_manager.sh
set -e


mkdir -p ${nodeLogDir}/fullnodes
mkdir -p ${nodePidDir}/fullnodes



function fullnode_install {
    local FULLNODE=$1
    # extends ME

    echo "Error: Fullnode ${FULLNODE} has no installation script"
    exit 1
}


function fullnode_before_install {
    local FULLNODE=$1
    local VERSION=$2
    local TMP_DIR=$3

    if [ "$FULLNODE" = "" ]; then
        echo "Error: missing FULLNODE"
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

    mkdir -p ${nodeLogDir}/fullnodes
    mkdir -p ${nodePidDir}/fullnodes
    mkdir -p ${nodeDataDir}/fullnodes
    mkdir -p ${fullnodesDir}

    mkdir -p ${TMP_DIR}
    cd ${TMP_DIR}

    echo "Installing ${FULLNODE} ${VERSION}..."
}


function fullnode_after_install {
    local FULLNODE=$1
    local VERSION=$2
    local TMP_DIR=$3

    rm -rf $TMP_DIR
    echo
    echo "Fullnode ${FULLNODE} ${VERSION} successfully installed into ${fullnodesDir}/${FULLNODE}"
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    # extends ME

    echo "Error: Fullnode ${FULLNODE} has no get_run_cmd script"
    exit 1
}


function fullnode_get_run_args {
    local FULLNODE=$1
    # extends ME

    echo "Error: Fullnode ${FULLNODE} has no get_run_args script"
    exit 1
}


function fullnode_run {
    local cmd=$(fullnode_get_run_cmd)
    $cmd
}



function fullnode_status_txt {
    local FULLNODE=$1
    # extends ME

    echo "Error: Fullnode ${FULLNODE} has no status-txt script"
    exit 1
}


function fullnode_status_json {
    local FULLNODE=$1
    # extends ME

    echo "Error: Fullnode ${FULLNODE} has no status-json script"
    exit 1
}

