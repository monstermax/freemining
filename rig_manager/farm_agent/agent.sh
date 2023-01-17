#!/bin/bash

cd `dirname $0`

source ../tools/env.sh


if [ "$1" = "-bg" ]; then
    # Run typescript
    ./ts-node agent.ts >/tmp/rig_agent.log 2>/tmp/rig_agent.err &

    # OR run javascript
    #node agent.js >/tmp/rig_agent.log 2>/tmp/rig_agent.err &

else
    # Run typescript
    ./ts-node agent.ts

    # OR run javascript
    #node agent.js
fi
