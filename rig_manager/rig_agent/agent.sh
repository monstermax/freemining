#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh


package="miningcore"

if hasOpt -bg; then
    echo "Running daemon"
    echo " log: ${LOGS_DIR}/rig_manager_agent.daemon.log"
    echo " err: ${LOGS_DIR}/rig_manager_agent.daemon.err"

    if hasOpt -ts; then
        # Run typescript
        ${TS_NODE} ./agent.ts $@ >${LOGS_DIR}/rig_manager_agent.daemon.log 2>${LOGS_DIR}/rig_manager_agent.daemon.err &
    else
        # Run javascript
        ${NODE} ./agent.js $@ >${LOGS_DIR}/rig_manager_agent.daemon.log 2>${LOGS_DIR}/rig_manager_agent.daemon.err &
    fi

else
    if hasOpt -ts; then
        # Run typescript
        ${TS_NODE} ./agent.ts $@
    else
        # Run javascript
        ${NODE} ./agent.js $@
    fi
fi
