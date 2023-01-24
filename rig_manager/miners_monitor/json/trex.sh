#!/bin/bash

cd `dirname $0`

source ../../rig_manager.sh

MINER="trex"

API_PORT=$(getMinerApiPort $MINER)

API_URL=http://localhost:${API_PORT}

SUMMARY_URL=${API_URL}/summary
SUMMARY_JSON=$(wget -qO- $SUMMARY_URL)

if [ "$SUMMARY_JSON" = "" ]; then
    exit 1
fi



PID_FILE="${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid"
PID=""
if test -f $PID_FILE; then
    PID=$(cat $PID_FILE)
fi



POOL_USER=$(echo $SUMMARY_JSON |jq -r ".active_pool.user")

WORKER_NAME=$(echo $SUMMARY_JSON |jq -r ".active_pool.worker")
if [ "$WORKER_NAME" = "" ]; then
    WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)
fi

#UPTIME=$(echo $SUMMARY_JSON |jq -r ".uptime")
UPTIME=$(echo $SUMMARY_JSON |jq -r ".watchdog_stat.uptime")
DATE=$(date "+%F %T")
ALGO=$(echo $SUMMARY_JSON |jq -r ".algorithm")
WORKER_HASHRATE=$(echo $SUMMARY_JSON |jq ".hashrate")

POOL_URL=$(echo $SUMMARY_JSON |jq -r ".active_pool.url")
USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)
#

DEVICES_COUNT=$(echo $SUMMARY_JSON |jq ".gpu_total")
#DEVICES_COUNT=$(echo $SUMMARY_JSON |jq ".gpus | length")


for i in `seq 1 $DEVICES_COUNT`; do
    let WORKER_ID=$((i-1))

    if [ "$WORKER_ID" -gt 0 ]; then
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

    if [ "$GPUS" != "" ]; then
        GPUS="${GPUS},"
    fi

    GPU=$(
        cat <<_EOF
{
            "id": "${GPU_ID}",
            "name": "${GPU_NAME}",
            "temperature": ${GPU_TEMPERATURE},
            "fanSpeed": ${GPU_FAN_SPEED},
            "hashRate": ${GPU_HASHRATE}
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
        "pid": ${PID},
        "algo": "${ALGO}",
        "hashRate": ${WORKER_HASHRATE},
        "uptime": ${UPTIME},
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

