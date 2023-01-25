#!/bin/bash

cd `dirname $0`

source ../../rig_manager.sh

MINER="lolminer"

API_PORT=$(getMinerApiPort $MINER)

API_URL=http://localhost:${API_PORT}

SUMMARY_URL=${API_URL}/
SUMMARY_JSON=$(wget --tries=1 --timeout=1 --connect-timeout=1 --read-timeout=1 -qO- $SUMMARY_URL)

if [ "$SUMMARY_JSON" = "" ]; then
    exit 1
fi


PID_FILE="${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid"
PID=""
if test -f $PID_FILE; then
    PID=$(cat $PID_FILE)
fi


POOL_USER=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].User")
WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)
USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)

UPTIME=$(echo $SUMMARY_JSON |jq -r ".Session.Uptime")

DATE=$(date "+%F %T")

ALGO=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Algorithm")

WORKER_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Total_Performance")
WORKER_HASHRATE_ROUND=$(echo "scale=2; ${WORKER_HASHRATE}/1" | bc)
HASHRATE_UNIT=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Performance_Unit")

WORKER_HASHRATE_INT=$(echo "${WORKER_HASHRATE} * 1024 * 1024" | bc | cut -d"." -f1)

POOL_URL=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Pool")


CPUS=""
GPUS=""


NB_WORKER=$(echo $SUMMARY_JSON |jq -r ".Num_Workers")

for i in `seq 1 $NB_WORKER`; do
    let WORKER_ID=$((i-1))

    if [ "$WORKER_ID" -gt 0 ]; then
        true
    fi

    GPU_ID=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Index")

    GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Name")

    GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Core_Temp")

    GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Fan_Speed")

    GPU_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Worker_Performance[${WORKER_ID}]")
    GPU_HASHRATE_ROUND=$(echo "scale=2; ${GPU_HASHRATE}/1" | bc)

    GPU_HASHRATE_INT=$(echo "${GPU_HASHRATE} * 1024 * 1024" | bc | cut -d"." -f1)

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
            "hashRate": ${GPU_HASHRATE_INT}
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
        "hashRate": ${WORKER_HASHRATE_INT},
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
