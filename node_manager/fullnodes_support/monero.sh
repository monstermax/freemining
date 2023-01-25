#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1

}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=${fullnodesDir}/${FULLNODE}/monerod
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        --data-dir ${nodeConfDir}/fullnodes/${FULLNODE}
        --daemon-address 127.0.0.1:18081
        --disable-rpc-login
        --config-file ${nodeConfDir}/fullnodes/${FULLNODE}/monerod-wallet-rpc.conf
        --password-file ${nodeConfDir}/fullnodes/${FULLNODE}/monero_wallet/yomining.secret
        --non-interactive
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


