#!/bin/bash

cd `dirname $0`

source ../../pool_manager.sh


package="miningcore"

MININGCORE_CONFIG_FILE=${USER_CONF_DIR}/pools_engine/${package}/config.json


if hasOpt -bg; then
    echo "Running daemon"
    echo " log: ${LOGS_DIR}/pool_manager_pools_engine_${package}.daemon.log"
    echo " err: ${LOGS_DIR}/pool_manager_pools_engine_${package}.daemon.err"

    PARAMS=$@

    # Remove -bg parameter
    PARAMS="$(echo " $PARAMS " | sed -e 's# -bg # #')"

    ${POOLS_ENGINE_DIR}/${package}/Miningcore -c $MININGCORE_CONFIG_FILE $PARAMS >${LOGS_DIR}/pool_manager_pools_engine_${package}.daemon.log 2>${LOGS_DIR}/pool_manager_pools_engine_${package}.daemon.err &

else
    ${POOLS_ENGINE_DIR}/${package}/Miningcore -c $MININGCORE_CONFIG_FILE $@
fi


