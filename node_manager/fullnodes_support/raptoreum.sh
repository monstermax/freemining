#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="1.13.17.02"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$VERSION" $TMP_DIR

    local DL_URL=""
    #local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    local VERSION_LONG=""
    if grep -q "Debian GNU/Linux 11" /etc/os-release; then
        # Debian GNU/Linux 11
        VERSION_LONG="ubuntu20-1.3.17.02-candidate"

    elif grep -q "Ubuntu 22.04" /etc/os-release; then
        # Ubuntu 22.04
        VERSION_LONG="ubuntu22-1.3.17.02-candidate"

    else
        true
        # installing from sources
    fi

    if [ "$VERSION_LONG" != "" ]; then
        DL_URL="https://github.com/Raptor3um/raptoreum/releases/download/${VERSION}/raptoreum-${VERSION_LONG}.tar.gz"
        DL_FILE=$(basename $DL_URL)
        UNZIP_DIR="${chain}-unzipped"

        echo "Installing ${chain} ${VERSION} ${VERSION_LONG}..."

        echo " - Downloading ${chain}"
        wget -q $DL_URL

        echo " - Unzipping"
        mkdir $UNZIP_DIR
        tar zxf $DL_FILE -C $UNZIP_DIR

        echo " - Install into ${fullnodesDir}/${chain}"
        rm -rf ${fullnodesDir}/${chain}
        mv $UNZIP_DIR ${fullnodesDir}/${chain}

    else
        # install from sources
        echo "Installing ${chain} sources..."

        echo " - Installing dependencies packages: build tools"
        rootRequired
        sudo apt-get install -qq -y curl build-essential libtool autotools-dev automake pkg-config python3 bsdmainutils

        git clone https://github.com/Raptor3um/raptoreum/ >>${INSTALL_LOG} 2>>${INSTALL_LOG}
        cd raptoreum/depends

        make -j$(nproc) >>${INSTALL_LOG}
        cd ..

        ./autogen.sh >>${INSTALL_LOG}
        ./configure --prefix=`pwd`/depends/x86_64-pc-linux-gnu >>${INSTALL_LOG}

        make >>${INSTALL_LOG}
        #make install # optional

        cd src
        # EDIT ME
    fi

    rm -rf ${UNZIP_DIR}

    fullnode_after_install "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=${fullnodesDir}/${FULLNODE}/raptoreumd
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        -datadir=${nodeConfDir}/fullnodes/${FULLNODE}
        -rpcbind=0.0.0.0
        -rpcport=10225
        -rpcuser=user
        -rpcpassword=pass
        -rpcallowip=127.0.0.1
        -rpcallowip=${IP_CRYPTO}
        -printtoconsole
        "
    echo $CMD_ARGS
}



function fullnode_status_txt {
    local FULLNODE=$1
    # not available
}


function fullnode_status_json {
    local FULLNODE=$1
    # not available
}





############################################


if [ "$0" = "$BASH_SOURCE" ]; then
    FILENAME=$(basename $0)
    FULLNODE=$(echo ${FILENAME%.*})
    fullnode_run $FULLNODE $@
fi


