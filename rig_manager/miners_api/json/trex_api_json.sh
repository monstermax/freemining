#!/bin/bash

cd `dirname $0`

source ../../tools/env.sh

MINER="trex"

#echo "miner.name: ${MINER}"

API_PORT=$(getMinerApiPort $MINER)

API_URL=http://localhost:${API_PORT}

SUMMARY_URL=${API_URL}/summary
SUMMARY_JSON=$(wget -qO- $SUMMARY_URL)

if [ "$SUMMARY_JSON" = "" ]; then
    #echo -e "miner.active: \033[0;31mfalse\033[0m"
    exit 1
fi

#echo -e "miner.active: \033[0;32mtrue\033[0m"


PID_FILE="${PIDS_DIR}/${MINER}.pid"
PID=""
if test -f $PID_FILE; then
    PID=$(cat $PID_FILE)
fi



POOL_USER=$(echo $SUMMARY_JSON |jq -r ".active_pool.user")

WORKER_NAME=$(echo $SUMMARY_JSON |jq -r ".active_pool.worker")
if [ "$WORKER_NAME" = "" ]; then
    WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)
fi
#echo "worker.name: ${WORKER_NAME}"

#UPTIME=$(echo $SUMMARY_JSON |jq -r ".uptime")
UPTIME=$(echo $SUMMARY_JSON |jq -r ".watchdog_stat.uptime")
#echo "worker.uptime: ${UPTIME}"

DATE=$(date "+%F %T")
#echo "worker.date: ${DATE}"

ALGO=$(echo $SUMMARY_JSON |jq -r ".algorithm")
#echo "worker.algo: ${ALGO}"

WORKER_HASHRATE=$(echo $SUMMARY_JSON |jq ".hashrate")
#echo "worker.hashRate: ${WORKER_HASHRATE}"


POOL_URL=$(echo $SUMMARY_JSON |jq -r ".active_pool.url")
#echo "pool.url: ${POOL_URL}"

USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)
#echo "pool.account: ${USER_ADDR}"

#

DEVICES_COUNT=$(echo $SUMMARY_JSON |jq ".gpu_total")
#DEVICES_COUNT=$(echo $SUMMARY_JSON |jq ".gpus | length")

#echo "------------"

for i in `seq 1 $DEVICES_COUNT`; do
    let WORKER_ID=$((i-1))

    if [ "$WORKER_ID" -gt 0 ]; then
        #echo "------"
        true
    fi


    #GPU_ID=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].device_id")
    GPU_ID=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].gpu_id")

    GPU_VENDOR=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].vendor")
    GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].name")

    GPU_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].hashrate")
    GPU_HASHRATE_ROUND=$(echo "scale=2; $GPU_HASHRATE / 1024 / 1024" |bc )

    GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].fan_speed")
    GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].temperature")

    #echo "gpu.${WORKER_ID}.id: ${GPU_ID}"
    #echo "gpu.${WORKER_ID}.name: ${GPU_VENDOR} ${GPU_NAME}"
    #echo "gpu.${WORKER_ID}.temperature: ${GPU_TEMPERATURE}°"
    #echo "gpu.${WORKER_ID}.fanSpeed: ${GPU_FAN_SPEED}%"
    #echo "gpu.${WORKER_ID}.hashRate: ${GPU_HASHRATE_ROUND} ${GPU_SPEED_UNIT}"



    if [ "$GPUS" != "" ]; then
        GPUS="${GPUS},"
    fi

    GPU=$(
        cat <<_EOF
{
            "id": "${GPU_ID}",
            "name": "${GPU_NAME}",
            "temperature": "${GPU_TEMPERATURE}",
            "fanSpeed": "${GPU_FAN_SPEED}",
            "hashRate": "${GPU_HASHRATE}"
        }
_EOF
    )

    GPUS="${GPUS}${GPU}"


done



cat <<_EOF
{
    "worker": {
        "name": "${WORKER_NAME}",
        "miner": "${MINER}",
        "pid": "${PID}",
        "algo": "${ALGO}",
        "hashRate": "${WORKER_HASHRATE}",
        "uptime": "${UPTIME}",
        "date": "${DATE}"
    },
    "pool": {
        "url": "${POOL_URL}",
        "account": "${USER_ADDR}"
    },
    "cpu": [
        ${CPUS}
    ],
    "gpu": [
        ${GPUS}
    ]
}
_EOF

