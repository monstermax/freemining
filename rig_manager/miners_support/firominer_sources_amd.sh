#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e

# extends firominer
source ./firominer.sh


# DEPRECATED


function DEPRECATED_miner_install {
    local MINER=$1
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

    #cd ${minersDir}/${MINER}
    #ln -fs firominer-amd firominer
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

