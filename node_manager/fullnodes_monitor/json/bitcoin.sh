#!/bin/bash

cd `dirname $0`

source ../../node_manager.sh
set -e

FULLNODE="bitcoin"

#RPC_PORT=$(getFullnodeRpcPort $FULLNODE)
#RPC_URL=http://localhost:${RPC_PORT}

RPC_CMD="${fullnodesDir}/${FULLNODE}/bitcoin-cli -datadir=${nodeConfDir}/fullnodes/${FULLNODE} -rpcuser=user -rpcpassword=pass"
SUMMARY_JSON=$($RPC_CMD getinfo 2>/dev/null || true)

#INFO_JSON=$($RPC_CMD getblockchaininfo)
#INFO_JSON=$($RPC_CMD getnetworkinfo)
#INFO_JSON=$($RPC_CMD getwalletinfo)
#INFO_JSON=$($RPC_CMD getmempoolinfo)
#INFO_JSON=$($RPC_CMD getbestblockhash)

if [ "$SUMMARY_JSON" = "" ]; then
    #echo -e "fullnode.active: \033[0;31mfalse\033[0m"
    exit 1
fi


PID_FILE="${nodePidDir}/fullnodes/freemining.node.fullnode.${FULLNODE}.pid"
PID=""
if test -f $PID_FILE; then
    PID=$(cat $PID_FILE)
fi


DATE=$(date "+%F %T")

#UPTIME=$(echo $SUMMARY_JSON |jq -r ".uptime")
UPTIME="-1" # TODO

VERSION=$(echo $SUMMARY_JSON |jq -r ".version")
BLOCKS=$(echo $SUMMARY_JSON |jq -r ".blocks")
CONNECTIONS=$(echo $SUMMARY_JSON |jq -r ".connections")


cat <<_EOF
{
    "worker": {
        "name": "${WORKER_NAME}",
        "fullnode": "${FULLNODE}",
        "pid": ${PID},
        "uptime": ${UPTIME},
        "version": "${VERSION}",
        "date": "${DATE}"
    },
    "blockchain": {
        "blocks": ${BLOCKS}
    },
    "peers": {
        "connections": ${CONNECTIONS}
    }
}
_EOF
