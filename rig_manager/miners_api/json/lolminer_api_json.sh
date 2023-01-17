#!/bin/bash

MINER="lolminer"

cd `dirname $0`

source ../../env

#echo "miner.name: $MINER"

API_URL=http://localhost:42002

SUMMARY_URL=${API_URL}/
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

#echo "worker.name: ${WORKER_NAME}"
#echo "worker.uptime: ${UPTIME}"
#echo "worker.date: ${DATE}"
#echo "worker.algo: ${ALGO}"
#echo "worker.hashRate: ${WORKER_HASHRATE_ROUND} ${HASHRATE_UNIT}"
#echo "pool.url: ${POOL_URL}"
#echo "pool.account: ${USER_ADDR}"


#echo "------------"



CPUS=""
GPUS=""


NB_WORKER=$(echo $SUMMARY_JSON |jq -r ".Num_Workers")

for i in `seq 1 $NB_WORKER`; do
    let WORKER_ID=$((i-1))

    if [ "$WORKER_ID" -gt 0 ]; then
        #echo "------"
        true
    fi

    GPU_ID=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Index")

    GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Name")

    GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Core_Temp")

    GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Fan_Speed")

    GPU_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Worker_Performance[${WORKER_ID}]")
    GPU_HASHRATE_ROUND=$(echo "scale=2; ${GPU_HASHRATE}/1" | bc)

    GPU_HASHRATE_INT=$(echo "${GPU_HASHRATE} * 1024 * 1024" | bc | cut -d"." -f1)

    #echo "gpu.${WORKER_ID}.id: ${GPU_ID}"
    #echo "gpu.${WORKER_ID}.name: ${GPU_NAME}"
    #echo "gpu.${WORKER_ID}.temperature: ${GPU_TEMPERATURE}°"
    #echo "gpu.${WORKER_ID}.fanSpeed: ${GPU_FAN_SPEED}%"
    #echo "gpu.${WORKER_ID}.hashRate: ${GPU_HASHRATE_ROUND} ${HASHRATE_UNIT}"



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
            "hashRate": "${GPU_HASHRATE_INT}"
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
        "hashRate": "${WORKER_HASHRATE_INT}",
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
