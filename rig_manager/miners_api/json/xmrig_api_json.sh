#!/bin/bash

cd `dirname $0`

source ../../tools/env.sh

MINER="xmrig"

#echo "miner.name: $MINER"

API_PORT=$(getMinerApiPort $MINER)

API_URL=http://localhost:${API_PORT}

BEARER=yomining


SUMMARY_URL=${API_URL}/2/summary
SUMMARY_JSON=$(wget --header="Authorization: Bearer ${BEARER}" -qO- $SUMMARY_URL)

CONFIG_URL=${API_URL}/2/config
CONFIG_JSON=$(wget --header="Authorization: Bearer ${BEARER}" -qO- $CONFIG_URL)


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



POOL_USER=$(echo $CONFIG_JSON |jq -r ".pools[0].user")

WORKER_NAME=$(echo $POOL_USER | cut -d"+" -f2)
#echo "worker.name: ${WORKER_NAME}"

WORKER_HOSTNAME=$(echo $SUMMARY_JSON |jq -r ".worker_id")
#echo "worker.hostname: ${WORKER_HOSTNAME}"

CPU_NAME=$(echo $SUMMARY_JSON |jq -r ".cpu.brand")
#echo "worker.cpu: ${CPU_NAME}"

UPTIME=$(echo $SUMMARY_JSON |jq -r ".uptime")
#echo "worker.uptime: ${UPTIME}"

DATE=$(date "+%F %T")
#echo "worker.date: ${DATE}"

LOAD_AVG=$(echo $SUMMARY_JSON |jq ".resources.load_average[0]")
#echo "worker.loadAvg: ${LOAD_AVG}"

MEM_FREE=$(echo $SUMMARY_JSON |jq ".resources.memory.free")
MEM_FREE_MB=$(echo "$MEM_FREE / 1024 / 1024" |bc)
##echo "worker.freeMemory: ${MEM_FREE_MB}"

MEM_TOTAL=$(echo $SUMMARY_JSON |jq ".resources.memory.total")
MEM_TOTAL_MB=$(echo "$MEM_TOTAL / 1024 / 1024" |bc)
##echo "worker.totalMemory: ${MEM_TOTAL_MB}"

MEM_USED_MB=$(echo "$MEM_TOTAL_MB - $MEM_FREE_MB" |bc)
##echo "worker.usedMemory: ${MEM_USED_MB}"
#echo "worker.memory: ${MEM_USED_MB}/${MEM_TOTAL_MB} MB"

#LOADAVG=$(echo $SUMMARY_JSON |jq ".xxxxx")
#echo "worker.hashRate: ${LOADAVG}"

ALGO=$(echo $SUMMARY_JSON |jq -r ".algo")
#echo "worker.algo: ${ALGO}"

POOL_URL=$(echo $SUMMARY_JSON |jq -r ".connection.pool")
#echo "pool.url: ${POOL_URL}"

USER_ADDR=$(echo $POOL_USER | cut -d"+" -f1)
#echo "pool.account: ${USER_ADDR}"

#echo "------------"


WORKER_HASHRATE=0



CPUS=""
GPUS=""



# CPU + CUDA + OPENCL
BACKENDS_URL=${API_URL}/2/backends
BACKENDS_JSON=$(wget --header="Authorization: Bearer ${BEARER}" -qO- $BACKENDS_URL)



# CPU

CPU_ENABLED=$(echo $BACKENDS_JSON |jq ".[0].enabled")
#echo "cpu.enabled: ${CPU_ENABLED}"

if [ "$CPU_ENABLED" = "true" ]; then
    CPU_HASHRATE=$(echo $BACKENDS_JSON |jq ".[0].hashrate[0]" |bc |cut -d"." -f1)
    #echo "cpu.hashRate: ${CPU_HASHRATE}"

    WORKER_HASHRATE=$(echo "$WORKER_HASHRATE + $CPU_HASHRATE" |bc)

    CPU_ID="0"
    CPU_FAN_SPEED=""

    if [ "$CPUS" != "" ]; then
        CPUS="${CPUS},"
    fi

    CPU=$(
        cat <<_EOF
{
            "id": "${CPU_ID}",
            "name": "${CPU_NAME}",
            "temperature": "${CPU_TEMP}",
            "fanSpeed": "${CPU_FAN_SPEED}",
            "hashRate": "${CPU_HASHRATE}"
        }
_EOF
    )

        CPUS="${CPUS}${CPU}"
fi

#echo "------------"



# OPENCL
OPENCL_ENABLED=$(echo $BACKENDS_JSON |jq ".[1].enabled")
#echo "openclGpu.enabled: ${OPENCL_ENABLED}"

if [ "$OPENCL_ENABLED" = "true" ]; then
    OPENCL_TYPE=$(echo $BACKENDS_JSON |jq -r ".[1].type")
    #echo "openclGpu.type: ${OPENCL_TYPE}"

    OPENCL_HASHRATE=$(echo $BACKENDS_JSON |jq ".[1].hashrate[0]" |cut -d"." -f1)
    #echo "openclGpu.hashRate: ${OPENCL_HASHRATE}"

    WORKER_HASHRATE=$(echo "$WORKER_HASHRATE + $OPENCL_HASHRATE" |bc)


    OPENCL_GPU_COUNT=$(echo $BACKENDS_JSON |jq ".[1].threads | length")
    ##echo "openclGpu.gpuCount: ${OPENCL_GPU_COUNT}"

    for i in `seq 1 $OPENCL_GPU_COUNT`; do
        let WORKER_ID=$((i-1))

        if [ "$WORKER_ID" -gt 1 ]; then
            #echo "------"
            true
        fi

        OPENCL_GPU_NAME=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].board")
        #echo "openclGpu.${WORKER_ID}.name: ${OPENCL_GPU_NAME}"

        OPENCL_GPU_TEMP=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].health.temperature")
        #echo "openclGpu.${WORKER_ID}.temperature: ${OPENCL_GPU_TEMP}°"

        OPENCL_GPU_FAN_SPEED=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].health.fan_speed[0]")
        #echo "openclGpu.${WORKER_ID}.fanSpeed: ${OPENCL_GPU_FAN_SPEED}%"

        GPU_ID="" # TODO $WORKER_ID ?
        OPENCL_GPU_HASHRATE=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].hashrate[0]" |cut -d"." -f1)


        if [ "$GPUS" != "" ]; then
            GPUS="${GPUS},"
        fi

        GPU=$(
            cat <<_EOF
{
            "id": "${GPU_ID}",
            "name": "${OPENCL_GPU_NAME}",
            "temperature": "${OPENCL_GPU_TEMP}",
            "fanSpeed": "${OPENCL_GPU_FAN_SPEED}",
            "hashRate": "${OPENCL_GPU_HASHRATE}"
        }
_EOF
    )

        GPUS="${GPUS}${GPU}"
    done

fi




#echo "------------"


# CUDA
CUDA_ENABLED=$(echo $BACKENDS_JSON |jq ".[2].enabled")
#echo "cudaGpu.enabled: ${CUDA_ENABLED}"

if [ "$CUDA_ENABLED" = "true" ]; then
    CUDA_TYPE=$(echo $BACKENDS_JSON |jq -r ".[2].type")
    #echo "cudaGpus.type: ${CUDA_TYPE}"

    CUDA_HASHRATE=$(echo $BACKENDS_JSON |jq ".[2].hashrate[0]" |cut -d"." -f1)
    #echo "cudaGpus.hashRate: ${CUDA_HASHRATE}"

    WORKER_HASHRATE=$(echo "$WORKER_HASHRATE + $CUDA_HASHRATE" |bc)


    CUDA_GPU_COUNT=$(echo $BACKENDS_JSON |jq ".[2].threads | length")
    ##echo "cudaGpus.gpuCount: ${CUDA_GPU_COUNT}"

    for i in `seq 1 $CUDA_GPU_COUNT`; do
        let WORKER_ID=$((i-1))

        if [ "$WORKER_ID" -gt 1 ]; then
            #echo "------"
            true
        fi

        CUDA_GPU_NAME=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].name")
        #echo "cudaGpu.${WORKER_ID}.name: ${CUDA_GPU_NAME}"

        CUDA_GPU_TEMP=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].health.temperature")
        #echo "cudaGpu.${WORKER_ID}.temperature: ${CUDA_GPU_TEMP}°"

        CUDA_GPU_FAN_SPEED=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].health.fan_speed[0]")
        #echo "cudaGpu.${WORKER_ID}.fanSpeed: ${CUDA_GPU_FAN_SPEED}%"

        GPU_ID="" # TODO $WORKER_ID ?
        CUDA_GPU_HASHRATE=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].hashrate[0]" |cut -d"." -f1)

        if [ "$GPUS" != "" ]; then
            GPUS="${GPUS},"
        fi

        GPU=$(
            cat <<_EOF
{
            "id": "${GPU_ID}",
            "name": "${CUDA_GPU_NAME}",
            "temperature": "${CUDA_GPU_TEMP}",
            "fanSpeed": "${CUDA_GPU_FAN_SPEED}",
            "hashRate": "${CUDA_GPU_HASHRATE}"
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

