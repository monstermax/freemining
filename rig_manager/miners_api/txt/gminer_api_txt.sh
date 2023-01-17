#!/bin/bash

cd `dirname $0`

source ../../tools/env.sh

MINER="gminer"
echo "miner.name: $MINER"

API_PORT=$(getMinerApiPort $MINER)
API_URL=http://localhost:${API_PORT}

SUMMARY_URL=${API_URL}/stat
SUMMARY_JSON=$(wget -qO- $SUMMARY_URL)

if [ "$SUMMARY_JSON" = "" ]; then
    echo -e "miner.active: \033[0;31mfalse\033[0m"
    exit 1
fi

echo -e "miner.active: \033[0;32mtrue\033[0m"


#GPU_SPEED_UNIT=$(echo $SUMMARY_JSON |jq -r ".speed_unit")
GPU_SPEED_UNIT="MH/s"
GPU_POWER_USAGE_UNIT=$(echo $SUMMARY_JSON |jq -r ".power_unit")

POOL_USER=$(echo $SUMMARY_JSON |jq -r ".user")

WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)
echo "worker.name: ${WORKER_NAME}"

UPTIME=$(echo $SUMMARY_JSON |jq -r ".uptime")
echo "worker.uptime: ${UPTIME}"

WORKER_HASHRATE=$(echo $SUMMARY_JSON |jq ".pool_speed")
WORKER_HASHRATE_ROUND=$(echo "scale=2; $WORKER_HASHRATE / 1024 / 1024" |bc )
echo "worker.hashRate: ${WORKER_HASHRATE_ROUND} ${GPU_SPEED_UNIT}"


PID_FILE=/tmp/gminer.pid
PID=""
if test -f $PID_FILE; then
    PID=$(cat $PID_FILE)
    echo "worker.pid: ${PID}"
fi


POOL_URL=$(echo $SUMMARY_JSON |jq -r ".server")
echo "pool.url: ${POOL_URL}"

USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)
echo "pool.account: ${USER_ADDR}"



DEVICES_COUNT=$(echo $SUMMARY_JSON |jq ".devices | length")

echo "------------"

for i in `seq 1 $DEVICES_COUNT`; do
    let WORKER_ID=$((i-1))

    if [ "$WORKER_ID" -gt 0 ]; then
        echo "------"
    fi

    GPU_ID=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].gpu_id")
    GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].name")

    GPU_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].speed")
    GPU_HASHRATE_ROUND=$(echo "scale=2; $GPU_HASHRATE / 1024 / 1024" |bc )

    GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].fan")
    GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].temperature")
    GPU_POWER_USAGE=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].power_usage")

    echo "gpu.${WORKER_ID}.id: ${GPU_ID}"
    echo "gpu.${WORKER_ID}.name: ${GPU_NAME}"
    echo "gpu.${WORKER_ID}.temperature: ${GPU_TEMPERATURE}°"
    echo "gpu.${WORKER_ID}.fanSpeed: ${GPU_FAN_SPEED}%"
    echo "gpu.${WORKER_ID}.hashRate: ${GPU_HASHRATE_ROUND} ${GPU_SPEED_UNIT}"
    #echo "gpu.${WORKER_ID}.powerUsage: ${GPU_POWER_USAGE} ${GPU_POWER_USAGE_UNIT}"

done

