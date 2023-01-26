#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="4.7.0.1"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$FULLNODE" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/tronprotocol/java-tron/releases/download/GreatVoyage-v${VERSION}/FullNode.jar"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    echo " - Downloading ${FULLNODE}"
    wget -q $DL_URL
    wget https://github.com/tronprotocol/tron-deployment/raw/master/main_net_config.conf

    echo " - Install into ${fullnodesDir}/${FULLNODE}"
    rm -rf ${fullnodesDir}/${FULLNODE}
    mkdir -p ${fullnodesDir}/${FULLNODE}
    cp -a ./FullNode.jar ${fullnodesDir}/${FULLNODE}/
    mkdir -p ${nodeConfDir}/fullnodes/${FULLNODE}
    cp -a ./main_net_config.conf ${nodeConfDir}/fullnodes/${FULLNODE}/

    fullnode_after_install "$FULLNODE" "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=/usr/bin/java
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        -Xmx24g
        -jar ${fullnodesDir}/${FULLNODE}/FullNode.jar
        --output-directory ${nodeConfDir}/fullnodes/${FULLNODE}
        -c ${nodeConfDir}/fullnodes/${FULLNODE}/main_net_config.conf
        "
    echo $CMD_ARGS
}



function TODO_fullnode_status_txt {
    local FULLNODE=$1
    # not available
}


function TODO_fullnode_status_json {
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


