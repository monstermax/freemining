#!/bin/bash

cd `dirname $0`

source ../../node_manager.sh

FULLNODE="dogecoin"
echo "fullnode.name: $FULLNODE"

#RPC_PORT=$(getFullnodeRpcPort $FULLNODE)
#RPC_URL=http://localhost:${RPC_PORT}/

#SUMMARY_CMD=$(wget -q ${RPC_URL})
#SUMMARY_JSON=$(wget -qO- $SUMMARY_URL)

SUMMARY_JSON="" # TODO

if [ "$SUMMARY_JSON" = "" ]; then
    echo -e "fullnode.active: \033[0;31mfalse\033[0m"
    exit 1
fi

echo -e "fullnode.active: \033[0;32mtrue\033[0m"

