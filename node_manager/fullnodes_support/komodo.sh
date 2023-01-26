#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="sources"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$FULLNODE" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/KomodoPlatform/komodo"
    #local DL_FILE=$(basename $DL_URL)
    #local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    echo " - Installing dependencies packages: build tools"
    rootRequired
    sudo apt-get update -qq
    sudo apt-get upgrade -qq -y
    sudo apt-get install -qq -y build-essential pkg-config libc6-dev m4 g++-multilib autoconf libtool ncurses-dev unzip git zlib1g-dev wget curl bsdmainutils automake cmake clang ntp ntpdate nano >>${INSTALL_LOG} 2>>${INSTALL_LOG}


    echo " - Downloading ${FULLNODE}"
    git clone $DL_URL >>${INSTALL_LOG} 2>>${INSTALL_LOG}
    cd komodo

    echo " - Fetching params"
    ./zcutil/fetch-params.sh >>${INSTALL_LOG}

    echo " - Compiling ${FULLNODE}"
    ./zcutil/build.sh -j$(nproc) >>${INSTALL_LOG}

    CONF_DIR=${nodeConfDir}/fullnodes/${FULLNODE}
    mkdir -p $CONF_DIR

    cat << _EOF > ${CONF_DIR}/komodo.conf
rpcuser=user
rpcpassword=pass
txindex=1
bind=127.0.0.1
rpcbind=127.0.0.1
addnode=78.47.196.146
addnode=5.9.102.210
addnode=178.63.69.164
addnode=88.198.65.74
addnode=5.9.122.241
addnode=144.76.94.38
addnode=148.251.44.16
_EOF

    echo " - Install into ${fullnodesDir}/${FULLNODE}"
    rm -rf ${fullnodesDir}/${FULLNODE}
    mkdir -p ${fullnodesDir}/${FULLNODE}
    cp -a src/{komodod,komodo-cli,komodo-tx} ${fullnodesDir}/${FULLNODE}/

    fullnode_after_install "$FULLNODE" "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=${fullnodesDir}/${FULLNODE}/komodod
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        -datadir=${nodeConfDir}/fullnodes/${FULLNODE}
        -rpcuser=user
        -rpcpassword=pass
        -rpcbind=0.0.0.0
        -rpcport=8332
        -rpcallowip=127.0.0.1
        -rpcallowip=${IP_CRYPTO}
        -port=7770
        -exportdir=${nodeConfDir}/fullnodes/${FULLNODE}/export
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

    if test "$1" = "--install-fullnode"; then
        fullnode_alias=$FULLNODE

        if hasOpt --alias; then
            fullnode_alias=$(getOpt --alias)
        fi

        fullnode_install $fullnode_alias $@

    else
        fullnode_run $FULLNODE $@
    fi
fi


