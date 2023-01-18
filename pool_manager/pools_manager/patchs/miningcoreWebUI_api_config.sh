#!/bin/bash

cd `dirname $0`

source ../../pool_manager.sh


package="miningcore"


API_FILE="${POOLS_UI_DIR}/miningcoreWebUI/js/miningcore.js"

if ! test -f $API_FILE; then
    echo "Error: miningcore.js file not found in $(dirname $API_FILE)"
    exit 1
fi


if grep -q "config-api-freemining" $API_FILE; then
    echo "Already patched"
    exit 0
fi

CODE_HTML="
/""*"" config-api-freemining-start ""*""/

API = 'http://localhost:4000/api/';

/""*"" config-api-freemining-end ""*""/
"

echo "$CODE_HTML" >> $API_FILE


echo "Patched !"

