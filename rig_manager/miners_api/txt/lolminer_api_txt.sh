#!/bin/bash

echo "miner.name: lolminer"

API_URL=http://localhost:42002

SUMMARY_URL=${API_URL}/
SUMMARY_JSON=$(wget -qO- $SUMMARY_URL)

if [ "$SUMMARY_JSON" = "" ]; then
    echo -e "miner.active: \033[0;31mfalse\033[0m"
    exit 1
fi

echo -e "miner.active: \033[0;32mtrue\033[0m"

POOL_USER=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].User")

WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)
echo "worker.name: ${WORKER_NAME}"

UPTIME=$(echo $SUMMARY_JSON |jq -r ".Session.Uptime")
echo "worker.uptime: ${UPTIME}"

ALGO=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Algorithm")
echo "worker.algo: ${ALGO}"

WORKER_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Total_Performance")
WORKER_HASHRATE_ROUND=$(echo "scale=2; ${WORKER_HASHRATE}/1" | bc)
HASHRATE_UNIT=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Performance_Unit")
echo "worker.hashRate: ${WORKER_HASHRATE_ROUND} ${HASHRATE_UNIT}"


PID_FILE=/tmp/lolminer.pid
PID=""
if test -f $PID_FILE; then
    PID=$(cat $PID_FILE)
    echo "worker.pid: ${PID}"
fi


POOL_URL=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Pool")
echo "pool.url: ${POOL_URL}"

USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)
echo "pool.account: ${USER_ADDR}"


echo "------------"

NB_WORKER=$(echo $SUMMARY_JSON |jq -r ".Num_Workers")

for i in `seq 1 $NB_WORKER`; do
    let WORKER_ID=$((i-1))

    if [ "$WORKER_ID" -gt 0 ]; then
        echo "------"
    fi

    GPU_ID=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Index")
    echo "gpu.${WORKER_ID}.id: ${GPU_ID}"

    GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Name")
    echo "gpu.${WORKER_ID}.name: ${GPU_NAME}"

    GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Core_Temp")
    echo "gpu.${WORKER_ID}.temperature: ${GPU_TEMPERATURE}°"

    GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Fan_Speed")
    echo "gpu.${WORKER_ID}.fanSpeed: ${GPU_FAN_SPEED}%"

    GPU_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Worker_Performance[${WORKER_ID}]")
    GPU_HASHRATE_ROUND=$(echo "scale=2; ${GPU_HASHRATE}/1" | bc)
    echo "gpu.${WORKER_ID}.hashRate: ${GPU_HASHRATE_ROUND} ${HASHRATE_UNIT}"

done


#worker: max-omatic
#cpu: AMD Ryzen 9 5900X 12-Core Processor
#uptime: 1782
#load_average: 18.35
#memory: 16897/32048 MB
#hashrate: 10439.89
#algo: rx/0
#pool: xmrpool.eu:5555