#!/bin/bash

cd `dirname $0`

source ../../rig_manager.sh

MINER="nbminer"

API_PORT=$(getMinerApiPort $MINER)

API_URL=http://localhost:${API_PORT}

SUMMARY_URL=${API_URL}/api/v1/status
SUMMARY_JSON=$(wget -qO- $SUMMARY_URL)

if [ "$SUMMARY_JSON" = "" ]; then
    exit 1
fi



PID_FILE="${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid"
PID=""
if test -f $PID_FILE; then
    PID=$(cat $PID_FILE)
fi


DATE=$(date "+%F %T")


POOL_USER=$(echo $SUMMARY_JSON |jq -r ".stratum.user")
POOL_URL=$(echo $SUMMARY_JSON |jq -r ".stratum.url")
USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)
WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)


ALGO=$(echo $SUMMARY_JSON |jq -r ".stratum.algorithm")
#POOL_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".stratum.pool_hashrate_10m")
WORKER_HASHRATE_ROUND=$(echo $SUMMARY_JSON |jq -r ".miner.total_hashrate" |cut -d" " -f1)
WORKER_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".miner.total_hashrate_raw" |cut -d"." -f1)

START_TIME=$(echo $SUMMARY_JSON |jq -r ".start_time")
NOW=$(date +%s)
UPTIME=$(echo "$NOW - $START_TIME" |bc)

DEVICES_COUNT=$(echo $SUMMARY_JSON |jq -r ".miner.devices | length")

CPUS=""
GPUS=""

for i in `seq 1 $DEVICES_COUNT`; do
    let WORKER_ID=$((i-1))

    if [ "$WORKER_ID" -gt 0 ]; then
        true
    fi

    GPU_ID=$(echo $SUMMARY_JSON |jq -r ".miner.devices[${WORKER_ID}].id")
    GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".miner.devices[${WORKER_ID}].info")

    GPU_HASHRATE_ROUND=$(echo $SUMMARY_JSON |jq -r ".miner.devices[${WORKER_ID}].hashrate" |cut -d" " -f1)
    GPU_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".miner.devices[${WORKER_ID}].hashrate_raw" |cut -d"." -f1)

    GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".miner.devices[${WORKER_ID}].fan")
    GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".miner.devices[${WORKER_ID}].temperature")
    GPU_POWER_USAGE=$(echo $SUMMARY_JSON |jq -r ".miner.devices[${WORKER_ID}].power")

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
