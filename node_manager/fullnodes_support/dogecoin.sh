#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
}


function fullnode_get_run_cmd {
    local FULLNODE=$1
}


function fullnode_get_run_args {
    local FULLNODE=$1

}


function fullnode_status_txt {
    local FULLNODE=$1
}


function fullnode_status_json {
    local FULLNODE=$1
}





############################################


if [ "$0" = "$BASH_SOURCE" ]; then
    FILENAME=$(basename $0)
    FULLNODE=$(echo ${FILENAME%.*})
    fullnode_run ${FULLNODE}

    #if test -x $FULLNODE_CMD; then
    #    exec $FULLNODE_CMD $@
    #fi

fi


