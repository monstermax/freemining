#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e

# extends xmrig
source ./xmrig.sh


# DEPRECATED


function DEPRECATED_miner_install {
    local MINER=$1
    local VERSION=""
    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/xmrig/xmrig.git"
    #local DL_FILE=$(basename $DL_URL)
    #local UNZIP_DIR="${MINER}-unzipped"
    local INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " -installing dev tools"
    rootRequired
    sudo apt-get update -qq --allow-releaseinfo-change
    sudo apt-get install -qq -y git build-essential cmake libuv1-dev libssl-dev libhwloc-dev automake libtool autoconf

    echo " - downloading..."
    mkdir -p xmrig-source
    cd xmrig-source
    git clone $DL_URL >/dev/null 2>&1

    echo " - compiling..."
    mkdir xmrig/build
    cd xmrig/scripts
    sed -i "s/ = 1;/ = 0;/" ../src/donate.h
    ./build_deps.sh >/dev/null 2>&1
    cd ../build
    cmake .. -DXMRIG_DEPS=scripts/deps >/dev/null 2>&1
    make -j$(nproc) >/dev/null 2>&1

    echo " - installing..."
    rm -rf ${minersDir}/${MINER}
    mkdir -p ${minersDir}/${MINER}
    cp -a xmrig ${minersDir}/${MINER}/xmrig-nofees

    # symlink to xmrig
    if ! test -d ${minersDir}/xmrig; then
        cd ${minersDir}
        ln -s xmrig ${MINER}
    fi

    echo " - testing..."
    ${minersDir}/${MINER}/xmrig-nofees --print-platforms

    miner_after_install "$MINER" "$VERSION" $TMP_DIR
}





############################################


if [ "$0" = "$BASH_SOURCE" ]; then
    FILENAME=$(basename $0)
    MINER=$(echo ${FILENAME%.*})

    if test "$1" = "--install-miner"; 
        miner_alias=$MINER

        if hasOpt --alias; then
            miner_alias=$(getOpt --alias)
        fi

        miner_install $miner_alias $@

    else
        miner_run $MINER $@
    fi
fi

