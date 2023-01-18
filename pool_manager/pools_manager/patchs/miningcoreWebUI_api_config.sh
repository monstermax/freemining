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
    #echo "Already patched"
    #exit 0

    #  Remove custom patches
    grep config-api-freemining ${API_FILE} -m1 -B9999999 |head -n -1 > ${API_FILE}.tmp
    mv ${API_FILE}.tmp ${API_FILE}
fi


#API_URL="http://localhost:4000/api/"
API_URL=$(jq -r ".poolServer.apiUrl" $CONFIG_FILE)


CODE_HTML="
/""*"" config-api-freemining-start ""*""/

API = '${API_URL}';

/""*"" config-api-freemining-end ""*""/
"

echo "$CODE_HTML" >> $API_FILE


if ! hasOpt -q; then
    echo "Patched !"
fi


