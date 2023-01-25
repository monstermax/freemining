#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="2.17.2"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$VERSION" $TMP_DIR

    #local DL_URL=""
    #local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    local VERSION_LONG=""
    if grep -q "Ubuntu 20.04" /etc/os-release || grep -q "Debian GNU/Linux 11" /etc/os-release; then
        # Ubuntu 20.04 | Debian GNU/Linux 11
        VERSION_LONG="2.17.2.ghc-8.10.7.ubuntu-20.04.aa36983"

    elif grep -q "Ubuntu 22.04" /etc/os-release; then
        # Ubuntu 22.04
        VERSION_LONG="2.17.2.ghc-8.10.7.ubuntu-22.04.aa36983"

    else
        # install from sources
        # not available => see https://github.com/kadena-io/chainweb-node#building-from-source
        exit 1
    fi

    local DL_URL="https://github.com/kadena-io/chainweb-node/releases/download/${VERSION}/chainweb-${VERSION_LONG}.tar.gz"
    local DL_FILE=$(basename $DL_URL)

    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Unzipping"
    mkdir $UNZIP_DIR
    tar zxf $DL_FILE -C $UNZIP_DIR

    echo " - Preparing"
    mkdir -p ${nodeConfDir}/fullnodes/${chain}

    # create default config
    $UNZIP_DIR/chainweb-node --database-directory ${nodeConfDir}/fullnodes/${chain} --print-config > ${nodeConfDir}/fullnodes/${chain}/kadena.conf

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mv $UNZIP_DIR ${fullnodesDir}/${chain}

    fullnode_after_install "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=${fullnodesDir}/${FULLNODE}/chainweb-node
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        --database-directory ${nodeConfDir}/fullnodes/${FULLNODE}
        --config-file ${nodeConfDir}/fullnodes/${FULLNODE}/kadena.conf
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


