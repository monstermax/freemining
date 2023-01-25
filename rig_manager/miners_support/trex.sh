#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e



function miner_install {
    local MINER=$1
    local VERSION="0.26.8"
    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    DL_URL="https://github.com/trexminer/T-Rex/releases/download/${VERSION}/t-rex-${VERSION}-linux.tar.gz"
    DL_FILE=$(basename $DL_URL)
    UNZIP_DIR="${MINER}-unzipped"
    INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    wget -q $DL_URL

    echo " - unziping..."
    mkdir -p $UNZIP_DIR
    tar zxf $DL_FILE -C $UNZIP_DIR

    echo " - installing..."
    rm -rf ${minersDir}/${MINER}
    cp -a $UNZIP_DIR ${minersDir}/${MINER}

    echo " - testing..."
    ${minersDir}/${MINER}/t-rex --devices-info

    miner_after_install "$MINER" "$VERSION" $TMP_DIR
}



function miner_get_run_cmd {
    local MINER=$1
    local ALGO=$2
    local POOL_URL=$3
    local POOL_ACCOUNT=$4
    shift 4 || true

    mkdir -p ${rigLogDir}/miners
    mkdir -p ${rigPidDir}/miners

    local API_PORT=$(getMinerApiPort ${MINER})
    local CMD_EXEC="${minersDir}/${MINER}/t-rex"

    local CMD_ARGS="-a ${ALGO} \
        -o stratum+tcp://${POOL_URL} \
        -u ${POOL_ACCOUNT} \
        -p x \
        --api-bind-http 127.0.0.1:${API_PORT} \
        $@"

    echo $CMD_EXEC $CMD_ARGS
}



function miner_status_txt {
    local MINER=$1

    echo "miner.name: $MINER"

    local API_PORT=$(getMinerApiPort $MINER)
    local API_URL=http://localhost:${API_PORT}

    local SUMMARY_URL=${API_URL}/summary
    local SUMMARY_JSON=$(wget --tries=1 --timeout=1 --connect-timeout=1 --read-timeout=1 -qO- $SUMMARY_URL)

    if [ "$SUMMARY_JSON" = "" ]; then
        echo -e "miner.active: \033[0;31mfalse\033[0m"
        exit 1
    fi

    echo -e "miner.active: \033[0;32mtrue\033[0m"

    local POOL_USER=$(echo $SUMMARY_JSON |jq -r ".active_pool.user")
    local WORKER_NAME=$(echo $SUMMARY_JSON |jq -r ".active_pool.worker")
    if [ "$WORKER_NAME" = "" ]; then
        WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)
    fi

    local UPTIME=$(echo $SUMMARY_JSON |jq -r ".watchdog_stat.uptime")
    local DATE=$(date "+%F %T")
    local ALGO=$(echo $SUMMARY_JSON |jq -r ".algorithm")
    local WORKER_HASHRATE=$(echo $SUMMARY_JSON |jq ".hashrate")
    local WORKER_HASHRATE_ROUND=$(echo "scale=2; $WORKER_HASHRATE / 1024 / 1024" |bc )

    echo "worker.name: ${WORKER_NAME}"
    #UPTIME=$(echo $SUMMARY_JSON |jq -r ".uptime")
    echo "worker.uptime: ${UPTIME}"
    echo "worker.date: ${DATE}"
    echo "worker.algo: ${ALGO}"
    echo "worker.hashRate: ${WORKER_HASHRATE_ROUND} MH/s"

    local PID_FILE=/tmp/trex.pid
    local PID=""
    if test -f $PID_FILE; then
        PID=$(cat $PID_FILE)
        echo "worker.pid: ${PID}"
    fi

    local POOL_URL=$(echo $SUMMARY_JSON |jq -r ".active_pool.url")
    local USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)

    echo "pool.url: ${POOL_URL}"
    echo "pool.account: ${USER_ADDR}"


    local DEVICES_COUNT=$(echo $SUMMARY_JSON |jq ".gpu_total")
    #local DEVICES_COUNT=$(echo $SUMMARY_JSON |jq ".gpus | length")

    echo "------------"

    for i in `seq 1 $DEVICES_COUNT`; do
        local let WORKER_ID=$((i-1))

        if [ "$WORKER_ID" -gt 0 ]; then
            echo "------"
        fi

        #local GPU_ID=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].device_id")
        local GPU_ID=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].gpu_id")

        local GPU_VENDOR=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].vendor")
        local GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].name")

        local GPU_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].hashrate")
        local GPU_HASHRATE_ROUND=$(echo "scale=2; $GPU_HASHRATE / 1024 / 1024" |bc )

        local GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].fan_speed")
        local GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].temperature")

        echo "gpu.${WORKER_ID}.id: ${GPU_ID}"
        echo "gpu.${WORKER_ID}.name: ${GPU_VENDOR} ${GPU_NAME}"
        echo "gpu.${WORKER_ID}.temperature: ${GPU_TEMPERATURE}°"
        echo "gpu.${WORKER_ID}.fanSpeed: ${GPU_FAN_SPEED}%"
        echo "gpu.${WORKER_ID}.hashRate: ${GPU_HASHRATE_ROUND} MH/s"
    done
}



function miner_status_json {
    local MINER=$1

    local API_PORT=$(getMinerApiPort $MINER)
    local API_URL=http://localhost:${API_PORT}

    local SUMMARY_URL=${API_URL}/summary
    local SUMMARY_JSON=$(wget --tries=1 --timeout=1 --connect-timeout=1 --read-timeout=1 -qO- $SUMMARY_URL)

    if [ "$SUMMARY_JSON" = "" ]; then
        exit 1
    fi

    local PID_FILE="${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid"
    local PID=""
    if test -f $PID_FILE; then
        PID=$(cat $PID_FILE)
    fi

    local POOL_USER=$(echo $SUMMARY_JSON |jq -r ".active_pool.user")
    local WORKER_NAME=$(echo $SUMMARY_JSON |jq -r ".active_pool.worker")
    if [ "$WORKER_NAME" = "" ]; then
        WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)
    fi

    #local UPTIME=$(echo $SUMMARY_JSON |jq -r ".uptime")
    local UPTIME=$(echo $SUMMARY_JSON |jq -r ".watchdog_stat.uptime")
    local DATE=$(date "+%F %T")
    local ALGO=$(echo $SUMMARY_JSON |jq -r ".algorithm")
    local WORKER_HASHRATE=$(echo $SUMMARY_JSON |jq ".hashrate")

    local POOL_URL=$(echo $SUMMARY_JSON |jq -r ".active_pool.url")
    local USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)

    local DEVICES_COUNT=$(echo $SUMMARY_JSON |jq ".gpu_total")
    #local DEVICES_COUNT=$(echo $SUMMARY_JSON |jq ".gpus | length")

    local CPUS=""
    local GPUS=""
    for i in `seq 1 $DEVICES_COUNT`; do
        local let WORKER_ID=$((i-1))

        #local GPU_ID=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].device_id")
        local GPU_ID=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].gpu_id")

        local GPU_VENDOR=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].vendor")
        local GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].name")

        local GPU_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].hashrate")
        local GPU_HASHRATE_ROUND=$(echo "scale=2; $GPU_HASHRATE / 1024 / 1024" |bc )

        local GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].fan_speed")
        local GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".gpus[${WORKER_ID}].temperature")

        if [ "$GPUS" != "" ]; then
            GPUS="${GPUS},"
        fi

        local GPU=$(
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


}




############################################


if [ "$0" = "$BASH_SOURCE" ]; then
    FILENAME=$(basename $0)
    MINER=$(echo ${FILENAME%.*})
    MINER_CMD=${minersDir}/${MINER}/${MINER}

    if test -x $MINER_CMD; then
        exec $MINER_CMD $@
    fi

fi

