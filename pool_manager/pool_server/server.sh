#!/bin/bash

cd `dirname $0`

source ../pool_manager.sh


if hasOpt -bg; then
    echo "Running daemon"
    echo " log: ${LOGS_DIR}/pool_manager_server.daemon.log"
    echo " err: ${LOGS_DIR}/pool_manager_server.daemon.err"

    if hasOpt -ts; then
        # Run typescript
        ${TS_NODE} server.ts $@ >${LOGS_DIR}/pool_manager_server.daemon.log 2>${LOGS_DIR}/pool_manager_server.daemon.err &
    else
        # Run javascript
        ${NODE} server.js $@ >${LOGS_DIR}/pool_manager_server.daemon.log 2>${LOGS_DIR}/pool_manager_server.daemon.err &
    fi

else
    if hasOpt -ts; then
        # Run typescript
        ${TS_NODE} server.ts $@
    else
        # Run javascript
        ${NODE} server.js $@
    fi
fi

