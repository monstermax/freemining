#!/bin/bash

cd `dirname $0`

source ../farm_manager.sh


if hasOpt -bg; then
    if hasOpt -ts; then
        # Run typescript
        ${TS_NODE} server.ts $@ >${LOGS_DIR}/farm_server.log 2>${LOGS_DIR}/farm_server.err &
    else
        # Run javascript
        ${NODE} server.js $@ >${LOGS_DIR}/farm_server.log 2>${LOGS_DIR}/farm_server.err &
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

