#!/bin/bash

cd `dirname $0`

source ../../rig_manager.sh

MINER="gminer"


API_PORT=$(getMinerApiPort $MINER)

API_URL=http://localhost:${API_PORT}

SUMMARY_URL=${API_URL}/stat
SUMMARY_JSON=$(wget -qO- $SUMMARY_URL)

if [ "$SUMMARY_JSON" = "" ]; then
    exit 1
fi



PID_FILE="${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid"
PID=""
if test -f $PID_FILE; then
    PID=$(cat $PID_FILE)
fi


#GPU_SPEED_UNIT=$(echo $SUMMARY_JSON |jq -r ".speed_unit")
GPU_SPEED_UNIT="MH/s"
GPU_POWER_USAGE_UNIT=$(echo $SUMMARY_JSON |jq -r ".power_unit")

POOL_USER=$(echo $SUMMARY_JSON |jq -r ".user")
WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)
USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)

UPTIME=$(echo $SUMMARY_JSON |jq -r ".uptime")

WORKER_HASHRATE=0

POOL_URL=$(echo $SUMMARY_JSON |jq -r ".server")

DATE=$(date "+%F %T")

ALGO=$(echo $SUMMARY_JSON |jq -r ".algorithm")


CPUS=""
GPUS=""



DEVICES_COUNT=$(echo $SUMMARY_JSON |jq ".devices | length")

for i in `seq 1 $DEVICES_COUNT`; do
    let WORKER_ID=$((i-1))

    if [ "$WORKER_ID" -gt 0 ]; then
        true
    fi

    GPU_ID=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].gpu_id")
    GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].name")

    GPU_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].speed")
    GPU_HASHRATE_ROUND=$(echo "scale=2; $GPU_HASHRATE / 1024 / 1024" |bc )

    WORKER_HASHRATE=$(echo "$WORKER_HASHRATE + $GPU_HASHRATE" |bc)

    GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].fan")
    GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].temperature")
    GPU_POWER_USAGE=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].power_usage")

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
