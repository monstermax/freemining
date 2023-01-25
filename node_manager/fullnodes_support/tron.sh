#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="4.7.0.1"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$VERSION" $TMP_DIR

    local DL_URL="https://github/com/tronprotocol/java-tron/releases/download/GreatVoyage-v${VERSION}/FullNode.jar"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mkdir -p ${fullnodesDir}/${chain}
    cp -a ./FullNode.jar ${fullnodesDir}/${chain}/

    fullnode_after_install "$VERSION" $TMP_DIR
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
        -XX:+UseConcMarkSweepGC
        -jar ${fullnodesDir}/${FULLNODE}/Fullnode.jar
        -c ${nodeConfDir}/fullnodes/${FULLNODE}/main_net_config.conf
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


