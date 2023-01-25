#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e



function miner_install {
    local MINER=$1
    local VERSION=""
    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/xmrig/xmrig-cuda.git"
    #local DL_FILE=$(basename $DL_URL)
    #local UNZIP_DIR="${MINER}-unzipped"
    local INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    mkdir -p xmrig-source && cd xmrig-source
    git clone $DL_URL >/dev/null 2>&1

    echo " - compiling..."
    mkdir xmrig-cuda/build && cd xmrig-cuda/build
    cmake .. -DCUDA_LIB=/usr/local/cuda/lib64/stubs/libcuda.so -DCUDA_TOOLKIT_ROOT_DIR=/usr/local/cuda >/dev/null 2>&1
    make -j$(nproc) >/dev/null 2>&1

    echo " - installing..."
    rm -rf ${minersDir}/xmrig/libxmrig-cuda.so

    if test -d ${minersDir}/xmrig; then
        cp -a libxmrig-cuda.so ${minersDir}/xmrig/
    fi
    if test -d ${minersDir}/xmrig_sources_free; then
        cp -a libxmrig-cuda.so ${minersDir}/xmrig_sources_free/
    fi

    miner_after_install "$MINER" "$VERSION" $TMP_DIR
}


