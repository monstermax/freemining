#!/bin/bash

cd `dirname $0`

source ../../rig_manager.sh

MINER="xmrig"

API_PORT=$(getMinerApiPort $MINER)

API_URL=http://localhost:${API_PORT}

BEARER=yomining


SUMMARY_URL=${API_URL}/2/summary
SUMMARY_JSON=$(wget --header="Authorization: Bearer ${BEARER}" -qO- $SUMMARY_URL)

CONFIG_URL=${API_URL}/2/config
CONFIG_JSON=$(wget --header="Authorization: Bearer ${BEARER}" -qO- $CONFIG_URL)


if [ "$SUMMARY_JSON" = "" ]; then
    exit 1
fi



PID_FILE="${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid"
PID=""
if test -f $PID_FILE; then
    PID=$(cat $PID_FILE)
fi



POOL_USER=$(echo $CONFIG_JSON |jq -r ".pools[0].user")

WORKER_NAME=$(echo $POOL_USER | cut -d"+" -f2)

WORKER_HOSTNAME=$(echo $SUMMARY_JSON |jq -r ".worker_id")

CPU_NAME=$(echo $SUMMARY_JSON |jq -r ".cpu.brand")

UPTIME=$(echo $SUMMARY_JSON |jq -r ".uptime")

DATE=$(date "+%F %T")

LOAD_AVG=$(echo $SUMMARY_JSON |jq ".resources.load_average[0]")

MEM_FREE=$(echo $SUMMARY_JSON |jq ".resources.memory.free")
MEM_FREE_MB=$(echo "$MEM_FREE / 1024 / 1024" |bc)

MEM_TOTAL=$(echo $SUMMARY_JSON |jq ".resources.memory.total")
MEM_TOTAL_MB=$(echo "$MEM_TOTAL / 1024 / 1024" |bc)

MEM_USED_MB=$(echo "$MEM_TOTAL_MB - $MEM_FREE_MB" |bc)

#LOADAVG=$(echo $SUMMARY_JSON |jq ".xxxxx")

ALGO=$(echo $SUMMARY_JSON |jq -r ".algo")
if [ "$ALGO" = "null" ]; then
    ALGO=""
fi

POOL_URL=$(echo $SUMMARY_JSON |jq -r ".connection.pool")

USER_ADDR=$(echo $POOL_USER | cut -d"+" -f1)


WORKER_HASHRATE=0



CPUS=""
GPUS=""



# CPU + CUDA + OPENCL
BACKENDS_URL=${API_URL}/2/backends
BACKENDS_JSON=$(wget --header="Authorization: Bearer ${BEARER}" -qO- $BACKENDS_URL)



# CPU

CPU_ENABLED=$(echo $BACKENDS_JSON |jq ".[0].enabled")

if [ "$CPU_ENABLED" = "true" ]; then
    CPU_HASHRATE=$(echo $BACKENDS_JSON |jq ".[0].hashrate[0]" |bc |cut -d"." -f1)

    WORKER_HASHRATE=$(echo "$WORKER_HASHRATE + $CPU_HASHRATE" |bc)

    CPU_ID="0"
    CPU_FAN_SPEED=""

    if [ "$CPUS" != "" ]; then
        CPUS="${CPUS},"
    fi

    CPU=$(
        cat <<_EOF
{
            "id": ${CPU_ID},
            "name": "${CPU_NAME}",
            "hashRate": ${CPU_HASHRATE}
        }
_EOF
    )

        CPUS="${CPUS}${CPU}"
fi



# OPENCL
OPENCL_ENABLED=$(echo $BACKENDS_JSON |jq ".[1].enabled")

if [ "$OPENCL_ENABLED" = "true" ]; then
    OPENCL_TYPE=$(echo $BACKENDS_JSON |jq -r ".[1].type")

    OPENCL_HASHRATE=$(echo $BACKENDS_JSON |jq ".[1].hashrate[0]" |cut -d"." -f1)

    WORKER_HASHRATE=$(echo "$WORKER_HASHRATE + $OPENCL_HASHRATE" |bc)


    OPENCL_GPU_COUNT=$(echo $BACKENDS_JSON |jq ".[1].threads | length")

    for i in `seq 1 $OPENCL_GPU_COUNT`; do
        let WORKER_ID=$((i-1))

        if [ "$WORKER_ID" -gt 1 ]; then
            true
        fi

        OPENCL_GPU_NAME=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].board")

        OPENCL_GPU_TEMP=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].health.temperature")

        OPENCL_GPU_FAN_SPEED=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].health.fan_speed[0]")

        GPU_ID="" # TODO $WORKER_ID ?
        OPENCL_GPU_HASHRATE=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].hashrate[0]" |cut -d"." -f1)


        if [ "$GPUS" != "" ]; then
            GPUS="${GPUS},"
        fi

        GPU=$(
            cat <<_EOF
{
            "id": ${GPU_ID},
            "name": "${OPENCL_GPU_NAME}",
            "temperature": ${OPENCL_GPU_TEMP},
            "fanSpeed": ${OPENCL_GPU_FAN_SPEED},
            "hashRate": ${OPENCL_GPU_HASHRATE}
        }
_EOF
    )

        GPUS="${GPUS}${GPU}"
    done

fi




# CUDA
CUDA_ENABLED=$(echo $BACKENDS_JSON |jq ".[2].enabled")
if [ "$CUDA_ENABLED" = "true" ]; then
    CUDA_TYPE=$(echo $BACKENDS_JSON |jq -r ".[2].type")
    CUDA_HASHRATE=$(echo $BACKENDS_JSON |jq ".[2].hashrate[0]" |cut -d"." -f1)
    WORKER_HASHRATE=$(echo "$WORKER_HASHRATE + $CUDA_HASHRATE" |bc)


    CUDA_GPU_COUNT=$(echo $BACKENDS_JSON |jq ".[2].threads | length")
    for i in `seq 1 $CUDA_GPU_COUNT`; do
        let WORKER_ID=$((i-1))

        if [ "$WORKER_ID" -gt 1 ]; then
            #echo "------"
            true
        fi

        CUDA_GPU_NAME=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].name")
        CUDA_GPU_TEMP=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].health.temperature")
        CUDA_GPU_FAN_SPEED=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].health.fan_speed[0]")
        GPU_ID="" # TODO $WORKER_ID ?
        CUDA_GPU_HASHRATE=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].hashrate[0]" |cut -d"." -f1)

        if [ "$GPUS" != "" ]; then
            GPUS="${GPUS},"
        fi

        GPU=$(
            cat <<_EOF
{
            "id": ${GPU_ID},
            "name": "${CUDA_GPU_NAME}",
            "temperature": ${CUDA_GPU_TEMP},
            "fanSpeed": ${CUDA_GPU_FAN_SPEED},
            "hashRate": ${CUDA_GPU_HASHRATE}
        }
_EOF
    )

        GPUS="${GPUS}${GPU}"
    done

fi




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

