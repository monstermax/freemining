#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e



function miner_install {
    local MINER=$1
    local VERSION="6.18.1"
    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    DL_URL="https://github.com/xmrig/xmrig/releases/download/v${VERSION}/xmrig-${VERSION}-linux-x64.tar.gz"
    DL_FILE=$(basename $DL_URL)
    UNZIP_DIR="${MINER}-unzipped"
    INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    wget -q $DL_URL

    echo " - unziping..."
    tar zxf $DL_FILE

    echo " - installing..."
    rm -rf ${minersDir}/${MINER}/${MINER}
    mkdir -p ${minersDir}/${MINER}
    cp -a xmrig-${VERSION}/{xmrig,config.json} ${minersDir}/${MINER}

    echo " - testing..."
    ${minersDir}/${MINER}/xmrig --print-platforms

    miner_after_install "$MINER" "$VERSION" $TMP_DIR
}


function miner_get_run_cmd {
    local MINER=$1
    shift || true

    local CMD_EXEC=${minersDir}/${MINER}/xmrig
    echo $CMD_EXEC
}


function miner_get_run_args {
    local MINER=$1
    local ALGO=$2
    local POOL_URL=$3
    local POOL_ACCOUNT=$4
    shift 4 || true

    local API_PORT=$(getMinerApiPort ${MINER})
    local LOG_FILE=${DAEMON_LOG_DIR}/${DAEMON_NAME}.daemon.log

    local CMD_ARGS="
        -a ${ALGO} \
        --url=${POOL_URL} \
        --user=${POOL_ACCOUNT} \
        --http-enabled \ \
        --http-host 127.0.0.1
        --http-port ${API_PORT} \
        --http-access-token=yomining \
        --http-no-restricted \
        -k \
        --donate-level 0 \
        --cpu-max-threads-hint 75 \
        --cpu-priority 3 \
        --randomx-no-rdmsr \
        --log-file=${LOG_FILE} \
        --no-color \
        "

    echo $CMD_ARGS
}



function miner_status_txt {
    local MINER=$1

    echo "miner.name: $MINER"

    local API_PORT=$(getMinerApiPort $MINER)
    local API_URL=http://127.0.0.1:${API_PORT}
    local BEARER=yomining

    local SUMMARY_URL=${API_URL}/2/summary
    local SUMMARY_JSON=$(wget --tries=1 --timeout=1 --connect-timeout=1 --read-timeout=1 --header="Authorization: Bearer ${BEARER}" -qO- $SUMMARY_URL)

    local CONFIG_URL=${API_URL}/2/config
    local CONFIG_JSON=$(wget --tries=1 --timeout=1 --connect-timeout=1 --read-timeout=1 --header="Authorization: Bearer ${BEARER}" -qO- $CONFIG_URL)

    if [ "$SUMMARY_JSON" = "" ]; then
        echo -e "miner.active: \033[0;31mfalse\033[0m"
        exit 1
    fi

    echo -e "miner.active: \033[0;32mtrue\033[0m"

    echo "------------"

    local POOL_USER=$(echo $CONFIG_JSON |jq -r ".pools[0].user")
    local WORKER_NAME=$(echo $POOL_USER | tr "+" "." | cut -d"." -f2)
    local WORKER_HOSTNAME=$(echo $SUMMARY_JSON |jq -r ".worker_id")
    local CPU_NAME=$(echo $SUMMARY_JSON |jq -r ".cpu.brand")
    local UPTIME=$(echo $SUMMARY_JSON |jq -r ".uptime")
    local DATE=$(date "+%F %T")

    echo "worker.name: ${WORKER_NAME}"
    echo "worker.hostname: ${WORKER_HOSTNAME}"
    echo "worker.cpu: ${CPU_NAME}"
    echo "worker.uptime: ${UPTIME}"

    echo "worker.date: ${DATE}"

    #LOAD_AVG=$(echo $SUMMARY_JSON |jq ".resources.load_average[0]")
    #echo "worker.loadAvg: ${LOAD_AVG}"

    local MEM_FREE=$(echo $SUMMARY_JSON |jq ".resources.memory.free")
    local MEM_FREE_MB=$(echo "$MEM_FREE / 1024 / 1024" |bc)

    local MEM_TOTAL=$(echo $SUMMARY_JSON |jq ".resources.memory.total")
    local MEM_TOTAL_MB=$(echo "$MEM_TOTAL / 1024 / 1024" |bc)

    local MEM_USED_MB=$(echo "$MEM_TOTAL_MB - $MEM_FREE_MB" |bc)
    local LOADAVG=$(echo $SUMMARY_JSON |jq ".hashrate.total[0]")

    local ALGO=$(echo $SUMMARY_JSON |jq -r ".algo")

    #echo "worker.freeMemory: ${MEM_FREE_MB}"
    #echo "worker.totalMemory: ${MEM_TOTAL_MB}"
    #echo "worker.usedMemory: ${MEM_USED_MB}"
    #echo "worker.memory: ${MEM_USED_MB}/${MEM_TOTAL_MB} MB"

    echo "worker.hashRate: ${LOADAVG}"
    echo "worker.algo: ${ALGO}"


    local PID_FILE=/tmp/xmrig.pid
    local PID=""
    if test -f $PID_FILE; then
        PID=$(cat $PID_FILE)
        echo "worker.pid: ${PID}"
    fi

    echo "------------"

    local POOL_URL=$(echo $SUMMARY_JSON |jq -r ".connection.pool")
    local USER_ADDR=$(echo $POOL_USER | tr "+" "." | cut -d"." -f1)

    echo "pool.url: ${POOL_URL}"
    echo "pool.account: ${USER_ADDR}"

    echo "------------"


    # CPU + CUDA + OPENCL
    local BACKENDS_URL=${API_URL}/2/backends
    local BACKENDS_JSON=$(wget --tries=1 --timeout=1 --connect-timeout=1 --read-timeout=1 --header="Authorization: Bearer ${BEARER}" -qO- $BACKENDS_URL)


    # CPU
    local CPU_ENABLED=$(echo $BACKENDS_JSON |jq ".[0].enabled")
    echo "cpu.enabled: ${CPU_ENABLED}"

    if [ "$CPU_ENABLED" = "true" ]; then
        local CPU_HASHRATE=$(echo $BACKENDS_JSON |jq ".[0].hashrate[0]")
        echo "cpu.hashRate: ${CPU_HASHRATE}"
    fi

    echo "------------"


    # OPENCL
    local OPENCL_ENABLED=$(echo $BACKENDS_JSON |jq ".[1].enabled")
    echo "openclGpu.enabled: ${OPENCL_ENABLED}"

    if [ "$OPENCL_ENABLED" = "true" ]; then
        local OPENCL_TYPE=$(echo $BACKENDS_JSON |jq -r ".[1].type")
        local OPENCL_HASHRATE=$(echo $BACKENDS_JSON |jq ".[1].hashrate[0]")

        echo "openclGpu.type: ${OPENCL_TYPE}"
        echo "openclGpu.hashRate: ${OPENCL_HASHRATE}"

        local OPENCL_GPU_COUNT=$(echo $BACKENDS_JSON |jq ".[1].threads | length")
        #echo "openclGpu.gpuCount: ${OPENCL_GPU_COUNT}"

        for i in `seq 1 $OPENCL_GPU_COUNT`; do
            local let WORKER_ID=$((i-1))

            if [ "$WORKER_ID" -gt 1 ]; then
                echo "------"
            fi

            local OPENCL_GPU_NAME=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].board")
            local OPENCL_GPU_TEMP=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].health.temperature")
            local OPENCL_GPU_FAN_SPEED=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].health.fan_speed[0]")

            echo "openclGpu.${WORKER_ID}.name: ${OPENCL_GPU_NAME}"
            echo "openclGpu.${WORKER_ID}.temperature: ${OPENCL_GPU_TEMP}°"
            echo "openclGpu.${WORKER_ID}.fanSpeed: ${OPENCL_GPU_FAN_SPEED}%"
        done

    fi

    echo "------------"


    # CUDA
    local CUDA_ENABLED=$(echo $BACKENDS_JSON |jq ".[2].enabled")
    echo "cudaGpu.enabled: ${CUDA_ENABLED}"

    if [ "$CUDA_ENABLED" = "true" ]; then
        local CUDA_TYPE=$(echo $BACKENDS_JSON |jq -r ".[2].type")
        local CUDA_HASHRATE=$(echo $BACKENDS_JSON |jq ".[2].hashrate[0]")

        echo "cudaGpus.type: ${CUDA_TYPE}"
        echo "cudaGpus.hashRate: ${CUDA_HASHRATE}"

        local CUDA_GPU_COUNT=$(echo $BACKENDS_JSON |jq ".[2].threads | length")
        #echo "cudaGpus.gpuCount: ${CUDA_GPU_COUNT}"

        for i in `seq 1 $CUDA_GPU_COUNT`; do
            local let WORKER_ID=$((i-1))

            if [ "$WORKER_ID" -gt 1 ]; then
                echo "------"
            fi

            local CUDA_GPU_NAME=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].name")
            local CUDA_GPU_TEMP=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].health.temperature")
            local CUDA_GPU_FAN_SPEED=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].health.fan_speed[0]")

            echo "cudaGpu.${WORKER_ID}.name: ${CUDA_GPU_NAME}"
            echo "cudaGpu.${WORKER_ID}.temperature: ${CUDA_GPU_TEMP}°"
            echo "cudaGpu.${WORKER_ID}.fanSpeed: ${CUDA_GPU_FAN_SPEED}%"
        done
    fi
}



function miner_status_json {
    local MINER=$1

    local API_PORT=$(getMinerApiPort $MINER)
    local API_URL=http://localhost:${API_PORT}
    local BEARER=yomining

    local SUMMARY_URL=${API_URL}/2/summary
    local SUMMARY_JSON=$(wget --tries=1 --timeout=1 --connect-timeout=1 --read-timeout=1 --header="Authorization: Bearer ${BEARER}" -qO- $SUMMARY_URL)

    if [ "$SUMMARY_JSON" = "" ]; then
        exit 1
    fi

    local CONFIG_URL=${API_URL}/2/config
    local CONFIG_JSON=$(wget --tries=1 --timeout=1 --connect-timeout=1 --read-timeout=1 --header="Authorization: Bearer ${BEARER}" -qO- $CONFIG_URL)

    local PID_FILE="${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid"
    local PID=""
    if test -f $PID_FILE; then
        PID=$(cat $PID_FILE)
    fi

    local POOL_USER=$(echo $CONFIG_JSON |jq -r ".pools[0].user")
    local WORKER_NAME=$(echo $POOL_USER | tr "+" "." | cut -d"." -f2)
    local WORKER_HOSTNAME=$(echo $SUMMARY_JSON |jq -r ".worker_id")
    local CPU_NAME=$(echo $SUMMARY_JSON |jq -r ".cpu.brand")
    local UPTIME=$(echo $SUMMARY_JSON |jq -r ".uptime")
    local DATE=$(date "+%F %T")
    local LOAD_AVG=$(echo $SUMMARY_JSON |jq ".resources.load_average[0]")

    local MEM_FREE=$(echo $SUMMARY_JSON |jq ".resources.memory.free")
    local MEM_FREE_MB=$(echo "$MEM_FREE / 1024 / 1024" |bc)

    MEM_TOTAL=$(echo $SUMMARY_JSON |jq ".resources.memory.total")
    local MEM_TOTAL_MB=$(echo "$MEM_TOTAL / 1024 / 1024" |bc)

    local MEM_USED_MB=$(echo "$MEM_TOTAL_MB - $MEM_FREE_MB" |bc)

    #local LOADAVG=$(echo $SUMMARY_JSON |jq ".xxxxx")

    local ALGO=$(echo $SUMMARY_JSON |jq -r ".algo")
    if [ "$ALGO" = "null" ]; then
        ALGO=""
    fi

    local POOL_URL=$(echo $SUMMARY_JSON |jq -r ".connection.pool")
    local USER_ADDR=$(echo $POOL_USER | tr "+" "." | cut -d"." -f1)
    local WORKER_HASHRATE=0

    local CPUS=""
    local GPUS=""


    # CPU + CUDA + OPENCL
    local BACKENDS_URL=${API_URL}/2/backends
    local BACKENDS_JSON=$(wget --tries=1 --timeout=1 --connect-timeout=1 --read-timeout=1 --header="Authorization: Bearer ${BEARER}" -qO- $BACKENDS_URL)


    # CPU

    local CPU_ENABLED=$(echo $BACKENDS_JSON |jq ".[0].enabled")

    if [ "$CPU_ENABLED" = "true" ]; then
        local CPU_HASHRATE=$(echo $BACKENDS_JSON |jq ".[0].hashrate[0]" |bc |cut -d"." -f1)

        local WORKER_HASHRATE=$(echo "$WORKER_HASHRATE + $CPU_HASHRATE" |bc)

        local CPU_ID="0"
        local CPU_FAN_SPEED=""

        if [ "$CPUS" != "" ]; then
            CPUS="${CPUS},"
        fi

        local CPU=$(
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
    local OPENCL_ENABLED=$(echo $BACKENDS_JSON |jq ".[1].enabled")

    if [ "$OPENCL_ENABLED" = "true" ]; then
        local OPENCL_TYPE=$(echo $BACKENDS_JSON |jq -r ".[1].type")

        local OPENCL_HASHRATE=$(echo $BACKENDS_JSON |jq ".[1].hashrate[0]" |cut -d"." -f1)

        local WORKER_HASHRATE=$(echo "$WORKER_HASHRATE + $OPENCL_HASHRATE" |bc)


        local OPENCL_GPU_COUNT=$(echo $BACKENDS_JSON |jq ".[1].threads | length")

        for i in `seq 1 $OPENCL_GPU_COUNT`; do
            local let WORKER_ID=$((i-1))

            local OPENCL_GPU_NAME=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].board")

            local OPENCL_GPU_TEMP=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].health.temperature")

            local OPENCL_GPU_FAN_SPEED=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].health.fan_speed[0]")

            local GPU_ID="$WORKER_ID" # TODO $WORKER_ID ?
            local OPENCL_GPU_HASHRATE=$(echo $BACKENDS_JSON |jq -r ".[1].threads[${WORKER_ID}].hashrate[0]" |cut -d"." -f1)


            if [ "$GPUS" != "" ]; then
                GPUS="${GPUS},"
            fi

            local GPU=$(
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
    local CUDA_ENABLED=$(echo $BACKENDS_JSON |jq ".[2].enabled")
    if [ "$CUDA_ENABLED" = "true" ]; then
        local CUDA_TYPE=$(echo $BACKENDS_JSON |jq -r ".[2].type")
        local CUDA_HASHRATE=$(echo $BACKENDS_JSON |jq ".[2].hashrate[0]" |cut -d"." -f1)
        local WORKER_HASHRATE=$(echo "$WORKER_HASHRATE + $CUDA_HASHRATE" |bc)

        local CUDA_GPU_COUNT=$(echo $BACKENDS_JSON |jq ".[2].threads | length")
        for i in `seq 1 $CUDA_GPU_COUNT`; do
            local let WORKER_ID=$((i-1))

            local CUDA_GPU_NAME=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].name")
            local CUDA_GPU_TEMP=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].health.temperature")
            local CUDA_GPU_FAN_SPEED=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].health.fan_speed[0]")
            local GPU_ID="" # TODO $WORKER_ID ?
            local CUDA_GPU_HASHRATE=$(echo $BACKENDS_JSON |jq -r ".[2].threads[${WORKER_ID}].hashrate[0]" |cut -d"." -f1)

            if [ "$GPUS" != "" ]; then
                GPUS="${GPUS},"
            fi

            local GPU=$(
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


}




############################################


if [ "$0" = "$BASH_SOURCE" ]; then
    FILENAME=$(basename $0)
    MINER=$(echo ${FILENAME%.*})
    MINER_CMD=$(miner_get_run_cmd ${MINER})

    if test -x $MINER_CMD; then
        exec $MINER_CMD $@
    fi

fi

