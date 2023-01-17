#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh


if hasOpt -bg; then
    if hasOpt -ts; then
        # Run typescript
        ${TS_NODE} ./agent.ts $@ >${LOGS_DIR}/rig_manager_agent_daemon.log 2>${LOGS_DIR}/rig_manager_agent_daemon.err &
    else
        # Run javascript
        ${NODE} ./agent.js $@ >${LOGS_DIR}/rig_manager_agent_daemon.log 2>${LOGS_DIR}/rig_manager_agent_daemon.err &
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
