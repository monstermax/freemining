#!/bin/bash

cd `dirname $0`

source ../../pool_manager.sh


package="miningcore"

MININGCORE_CONFIG_FILE=${USER_CONF_DIR}/pools_engine/${package}/config.json


if hasOpt -bg; then
    ${POOLS_ENGINE_DIR}/${package}/Miningcore -c $MININGCORE_CONFIG_FILE $@ >${LOGS_DIR}/${package}-daemon.log 2>${LOGS_DIR}/${package}-daemon.err &

else
    ${POOLS_ENGINE_DIR}/${package}/Miningcore -c $MININGCORE_CONFIG_FILE $@
fi


