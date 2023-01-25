#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e

# extends firominer
source ./firominer.sh



function miner_install {
    local MINER=$1
    local VERSION=""
    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    DL_URL="https://github.com/firoorg/firominer"
    #DL_FILE=$(basename $DL_URL)
    #UNZIP_DIR="${MINER}-unzipped"
    INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
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




############################################


if [ "$0" = "$BASH_SOURCE" ]; then
    FILENAME=$(basename $0)
    MINER=$(echo ${FILENAME%.*})
    MINER_CMD=$(miner_get_run_cmd ${MINER})

    if test -x $MINER_CMD; then
        exec $MINER_CMD $@
    fi

fi

