#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e



function miner_install {
    local MINER=$1

    if hasOpt --amd-from-sources; then
        miner_install_amd_from_sources $@
    fi

    local VERSION="1.1.0"
    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/firoorg/firominer/releases/download/${VERSION}/firominer-Linux.7z"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${MINER}-unzipped"
    local INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    wget -q $DL_URL

    echo " - unziping..."
    mkdir -p $UNZIP_DIR
    7z -y x $DL_FILE -o${UNZIP_DIR}
    chmod +x ${UNZIP_DIR}/firominer


    echo " - installing..."
    #cd $UNZIP_DIR
    #mv firominer firominer-release
    #ln -fs firominer-release firominer

    rm -rf ${minersDir}/${MINER}
    cp -a $UNZIP_DIR ${minersDir}/${MINER}

    echo " - testing..."
    ${minersDir}/${MINER}/firominer --list-devices

    miner_after_install "$MINER" "$VERSION" $TMP_DIR
}



function miner_install_amd_from_sources {
    local MINER=$1
    #local OPTIONS=$2

    local VERSION=""
    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/firoorg/firominer"
    #local DL_FILE=$(basename $DL_URL)
    #local UNZIP_DIR="${MINER}-unzipped"
    local INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    mkdir -p firominer-source && cd firominer-source
    git clone $DL_URL >/dev/null 2>&1
    cd firominer
    git submodule update --init --recursive

    echo " - compiling (1/2)..."
    mkdir build
    cd build
    cmake .. -DETHASHCUDA=OFF -DETHASHCL=ON -DAPICORE=ON
    # ERROR: cmake failed !
    #echo "FAILED"

    echo " - compiling (2/2)..."
    make -sj $(nproc)

    #echo " - installing..."
    #rm -rf ${minersDir}/${MINER}
    #mkdir -p ${minersDir}/${MINER}
    #cp -a firominer ${minersDir}/${MINER}/firominer-amd
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

