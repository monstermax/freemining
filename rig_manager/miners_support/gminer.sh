#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e



function miner_install {
    local MINER=$1
    local VERSION="3.24"
    local VERSION_BIS="3_24"
    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/develsoftware/GMinerRelease/releases/download/${VERSION}/gminer_${VERSION_BIS}_linux64.tar.xz"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${MINER}-unzipped"
    local INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    wget -q $DL_URL

    echo " - unziping..."
    mkdir -p $UNZIP_DIR
    tar -Jxf $DL_FILE -C $UNZIP_DIR

    echo " - installing..."
    rm -rf ${minersDir}/${MINER}
    cp -a $UNZIP_DIR ${minersDir}

    echo " - testing..."
    ${minersDir}/${MINER}/miner --list_devices

    miner_after_install "$VERSION" $TMP_DIR
}



function miner_get_run_cmd {
    local MINER=$1
    shift || true

    local CMD_EXEC=${minersDir}/${MINER}/miner
    echo $CMD_EXEC
}


function miner_get_run_args {
    local MINER=$1
    local ALGO=$2
    local POOL_URL=$3
    local POOL_ACCOUNT=$4
    shift 4 || true

    local POOL_HOST=$(echo "$POOL_URL" |cut -d":" -f1)
    local POOL_PORT=$(echo "$POOL_URL" |cut -d":" -f2)

    local API_PORT=$(getMinerApiPort ${MINER})

    local CMD_ARGS="
        --algo ${ALGO}
        --server ${POOL_HOST}
        --port ${POOL_PORT}
        --user ${POOL_ACCOUNT}
        --pass x
        --api ${API_PORT}
        "

    echo $CMD_ARGS
}



function miner_status_txt {
    local MINER=$1

    echo "miner.name: $MINER"

    local API_PORT=$(getMinerApiPort $MINER)
    local API_URL=http://localhost:${API_PORT}

    local SUMMARY_URL=${API_URL}/stat
    local SUMMARY_JSON=$(wget --tries=1 --timeout=1 --connect-timeout=1 --read-timeout=1 -qO- $SUMMARY_URL)

    if [ "$SUMMARY_JSON" = "" ]; then
        echo -e "miner.active: \033[0;31mfalse\033[0m"
        return 1 2>/dev/null || exit 1
    fi

    echo -e "miner.active: \033[0;32mtrue\033[0m"


    #local GPU_SPEED_UNIT=$(echo $SUMMARY_JSON |jq -r ".speed_unit")
    local GPU_SPEED_UNIT="MH/s"
    local GPU_POWER_USAGE_UNIT=$(echo $SUMMARY_JSON |jq -r ".power_unit")

    local POOL_USER=$(echo $SUMMARY_JSON |jq -r ".user")

    local WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)
    local UPTIME=$(echo $SUMMARY_JSON |jq -r ".uptime")

    local WORKER_HASHRATE=$(echo $SUMMARY_JSON |jq ".pool_speed")
    local WORKER_HASHRATE_ROUND=$(echo "scale=2; $WORKER_HASHRATE / 1024 / 1024" |bc )

    echo "worker.name: ${WORKER_NAME}"
    echo "worker.uptime: ${UPTIME}"
    echo "worker.hashRate: ${WORKER_HASHRATE_ROUND} ${GPU_SPEED_UNIT}"

    local PID_FILE=${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid
    local PID=""
    if test -f $PID_FILE; then
        PID=$(cat $PID_FILE)
        echo "worker.pid: ${PID}"
    fi

    local POOL_URL=$(echo $SUMMARY_JSON |jq -r ".server")
    local USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)

    echo "pool.url: ${POOL_URL}"
    echo "pool.account: ${USER_ADDR}"


    local DEVICES_COUNT=$(echo $SUMMARY_JSON |jq ".devices | length")

    echo "------------"

    for i in `seq 1 $DEVICES_COUNT`; do
        local let WORKER_ID=$((i-1))

        if [ "$WORKER_ID" -gt 0 ]; then
            echo "------"
        fi

        local GPU_ID=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].gpu_id")
        local GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].name")

        local GPU_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].speed")
        local GPU_HASHRATE_ROUND=$(echo "scale=2; $GPU_HASHRATE / 1024 / 1024" |bc )

        local GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].fan")
        local GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].temperature")
        local GPU_POWER_USAGE=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].power_usage")

        echo "gpu.${WORKER_ID}.id: ${GPU_ID}"
        echo "gpu.${WORKER_ID}.name: ${GPU_NAME}"
        echo "gpu.${WORKER_ID}.temperature: ${GPU_TEMPERATURE}°"
        echo "gpu.${WORKER_ID}.fanSpeed: ${GPU_FAN_SPEED}%"
        echo "gpu.${WORKER_ID}.hashRate: ${GPU_HASHRATE_ROUND} ${GPU_SPEED_UNIT}"
        #echo "gpu.${WORKER_ID}.powerUsage: ${GPU_POWER_USAGE} ${GPU_POWER_USAGE_UNIT}"
    done

}


function miner_status_json {
    local MINER=$1

    local API_PORT=$(getMinerApiPort $MINER)
    local API_URL=http://localhost:${API_PORT}

    local SUMMARY_URL=${API_URL}/stat
    local SUMMARY_JSON=$(wget --tries=1 --timeout=1 --connect-timeout=1 --read-timeout=1 -qO- $SUMMARY_URL)

    if [ "$SUMMARY_JSON" = "" ]; then
        return 1 2>/dev/null || exit 1
    fi


    local PID_FILE="${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid"
    local PID=""
    if test -f $PID_FILE; then
        PID=$(cat $PID_FILE)
    fi


    #local GPU_SPEED_UNIT=$(echo $SUMMARY_JSON |jq -r ".speed_unit")
    local GPU_SPEED_UNIT="MH/s"
    local GPU_POWER_USAGE_UNIT=$(echo $SUMMARY_JSON |jq -r ".power_unit")

    local POOL_USER=$(echo $SUMMARY_JSON |jq -r ".user")
    local WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)
    local USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)

    local UPTIME=$(echo $SUMMARY_JSON |jq -r ".uptime")
    local WORKER_HASHRATE=0

    local POOL_URL=$(echo $SUMMARY_JSON |jq -r ".server")
    local DATE=$(date "+%F %T")
    local ALGO=$(echo $SUMMARY_JSON |jq -r ".algorithm")

    local CPUS=""
    local GPUS=""
    local DEVICES_COUNT=$(echo $SUMMARY_JSON |jq ".devices | length")

    for i in `seq 1 $DEVICES_COUNT`; do
        local let WORKER_ID=$((i-1))

        local GPU_ID=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].gpu_id")
        local GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].name")

        local GPU_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].speed")
        local GPU_HASHRATE_ROUND=$(echo "scale=2; $GPU_HASHRATE / 1024 / 1024" |bc )

        local WORKER_HASHRATE=$(echo "$WORKER_HASHRATE + $GPU_HASHRATE" |bc)

        local GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].fan")
        local GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].temperature")
        local GPU_POWER_USAGE=$(echo $SUMMARY_JSON |jq -r ".devices[${WORKER_ID}].power_usage")

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

}




############################################


if [ "$0" = "$BASH_SOURCE" ]; then
    FILENAME=$(basename $0)
    MINER=$(echo ${FILENAME%.*})

    if test "$1" = "--install-miner"; then
        miner_alias=$MINER

        if hasOpt --alias; then
            miner_alias=$(getOpt --alias)
        fi

        miner_install $miner_alias $@

    else
        miner_run $MINER $@
    fi
fi
