#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e



function miner_install {
    local MINER=$1
    local VERSION="2.1"

    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/mhssamadani/Autolykos2_AMD_Miner/releases/download/${VERSION}/AMD_Miner_UBUNTU_${VERSION}.zip"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${MINER}-unzipped"
    local INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    wget -q $DL_URL

    echo " - unziping..."
    unzip $DL_FILE -d $UNZIP_DIR

    echo " - installing..."
    rm -rf ${minersDir}/${MINER}
    mkdir -p ${minersDir}/${MINER}
    cp -a ${UNZIP_DIR}/AMD_Miner_UBUNTU_${VERSION} ${minersDir}/${MINER}

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
    miner_run $MINER $@
fi

