#!/bin/bash

cd `dirname $0`

if [ "$1" = "-bg" ]; then
    # Run typescript
    ./ts-node server.ts >/tmp/farm_server.log 2>/tmp/farm_server.err &

    # OR run javascript
    #node server.js >/tmp/farm_server.log 2>/tmp/farm_server.err &

else
    # Run typescript
    ./ts-node server.ts

    # OR run javascript
    #node server.js
fi

