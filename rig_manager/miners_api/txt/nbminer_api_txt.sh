#!/bin/bash

cd `dirname $0`

source ../../tools/env.sh

MINER="nbminer"
echo "miner.name: $MINER"

API_PORT=$(getMinerApiPort $MINER)
API_URL=http://localhost:${API_PORT}

SUMMARY_URL=${API_URL}/api/v1/status
SUMMARY_JSON=$(wget -qO- $SUMMARY_URL)

if [ "$SUMMARY_JSON" = "" ]; then
    echo -e "miner.active: \033[0;31mfalse\033[0m"
    exit 1
fi

echo -e "miner.active: \033[0;32mtrue\033[0m"


POOL_USER=$(echo $SUMMARY_JSON |jq -r ".stratum.user")
POOL_URL=$(echo $SUMMARY_JSON |jq -r ".stratum.url")
USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)
WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)

ALGO=$(echo $SUMMARY_JSON |jq -r ".stratum.algorithm")
POOL_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".pool_hashrate_10m")
WORKER_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".miner.total_hashrate" |cut -d" " -f1)

START_TIME=$(echo $SUMMARY_JSON |jq -r ".start_time")
NOW=$(date +%s)
UPTIME=$(echo "$NOW - $START_TIME" |bc)

DEVICES_COUNT=$(echo $SUMMARY_JSON |jq -r ".miner.devices | length")

echo "worker.name: ${WORKER_NAME}"
echo "worker.uptime: ${UPTIME}"
echo "worker.algo: ${ALGO}"
echo "worker.hashRate: ${WORKER_HASHRATE} MH/s"


PID_FILE=/tmp/nbminer.pid
PID=""
if test -f $PID_FILE; then
    PID=$(cat $PID_FILE)
    echo "worker.pid: ${PID}"
fi

echo "pool.url: ${POOL_URL}"
echo "pool.account: ${USER_ADDR}"


echo "------------"

for i in `seq 1 $DEVICES_COUNT`; do
    let WORKER_ID=$((i-1))

    if [ "$WORKER_ID" -gt 0 ]; then
        echo "------"
    fi

    GPU_ID=$(echo $SUMMARY_JSON |jq -r ".miner.devices[${WORKER_ID}].id")
    GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".miner.devices[${WORKER_ID}].info")

    GPU_HASHRATE_ROUND=$(echo $SUMMARY_JSON |jq -r ".miner.devices[${WORKER_ID}].hashrate" |cut -d" " -f1)

    GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".miner.devices[${WORKER_ID}].fan")
    GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".miner.devices[${WORKER_ID}].temperature")
    GPU_POWER_USAGE=$(echo $SUMMARY_JSON |jq -r ".miner.devices[${WORKER_ID}].power")

    echo "gpu.${WORKER_ID}.id: ${GPU_ID}"
    echo "gpu.${WORKER_ID}.name: ${GPU_NAME}"
    echo "gpu.${WORKER_ID}.temperature: ${GPU_TEMPERATURE}°"
    echo "gpu.${WORKER_ID}.fanSpeed: ${GPU_FAN_SPEED}%"
    echo "gpu.${WORKER_ID}.hashRate: ${GPU_HASHRATE_ROUND} MH/s"
    #echo "gpu.${WORKER_ID}.powerUsage: ${GPU_POWER_USAGE} ${GPU_POWER_USAGE_UNIT}"

done
