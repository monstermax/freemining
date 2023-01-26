#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e



function miner_install {
    local MINER=$1
    local VERSION="0.10.7"
    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/todxx/teamredminer/releases/download/v${VERSION}/teamredminer-v${VERSION}-linux.tgz"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${MINER}-unzipped"
    local INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    wget -q $DL_URL

    echo " - unziping..."
    tar zxf $DL_FILE

    echo " - installing..."
    rm -rf ${minersDir}/${MINER}
    cp -a teamredminer-v${VERSION}-linux ${minersDir}/${MINER}

    echo " - testing..."
    ${minersDir}/${MINER}/teamredminer --list_devices

    miner_after_install "$MINER" "$VERSION" $TMP_DIR
}


 
function miner_get_run_cmd {
    local MINER=$1
    shift || true

    local CMD_EXEC=${minersDir}/${MINER}/teamredminer
    echo $CMD_EXEC
}


function miner_get_run_args {
    local MINER=$1
    local ALGO=$2
    local POOL_URL=$3
    local POOL_ACCOUNT=$4
    shift 4 || true

    local API_PORT=$(getMinerApiPort ${MINER})

    local CMD_ARGS="
        -a ${ALGO}
        -o stratum+tcp://${POOL_URL}
        -u ${POOL_ACCOUNT}
        -p x
        --api_listen=0.0.0.0:${API_PORT}
        "

    echo $CMD_ARGS
}



function miner_status_txt {
    local MINER=$1

    echo "miner.name: $MINER"

    local API_HOST=localhost
    local API_PORT=$(getMinerApiPort $MINER)

    local SUMMARY_JSON=$(echo -n summary | nc -w 1 127.0.0.1 ${API_PORT} 2>/dev/null |sed 's/,/\n/g')

    if [ "$SUMMARY_JSON" = "" ]; then
        echo -e "miner.active: \033[0;31mfalse\033[0m"
        return 1 2>/dev/null || exit 1
    fi

    echo -e "miner.active: \033[0;32mtrue\033[0m"


    # pool
    local RESULT=$(echo -n "pools" | nc 127.0.0.1 ${API_PORT})
    local POOL=$(echo $RESULT |sed 's/|/\n/g' |tail +2 |sed 's/,/\n/g')

    local POOL_URL=$(grep "^URL=" <<< $POOL |cut -d= -f2 |sed 's/stratum+tcp:\/\///')
    local POOL_USER=$(grep "^User=" <<< $POOL |cut -d= -f2)
    local USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)
    local WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)

    local ALGO=$(grep "^Algorithm=" <<< $POOL |cut -d= -f2)
    local HASHRATE_ROUND=$(grep "^MHS 30s=" <<< $SUMMARY_JSON |cut -d= -f2)
    local DATE=$(date "+%F %T")
    local UPTIME=$(grep "^Elapsed=" <<< $SUMMARY_JSON |cut -d= -f2)

    echo "worker.name: ${WORKER_NAME}"
    echo "worker.uptime: ${UPTIME}"
    echo "worker.date: ${DATE}"
    echo "worker.algo: ${ALGO}"
    echo "worker.hashRate: ${HASHRATE_ROUND} MH/s"


    local PID_FILE=${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid
    local PID=""
    if test -f $PID_FILE; then
        PID=$(cat $PID_FILE)
        echo "worker.pid: ${PID}"
    fi

    echo "pool.url: ${POOL_URL}"
    echo "pool.account: ${USER_ADDR}"


    # gpus
    local GPU_COUNT=$(echo -n gpucount | nc 127.0.0.1 ${API_PORT} |sed 's/|/\n/g' |tail +2 |cut -d= -f2)
    local GPU_DETAILS=$(echo -n devdetails | nc 127.0.0.1 ${API_PORT} |sed 's/,/\n/g')

    echo "------------"

    for i in `seq 1 $DEVICES_COUNT`; do
        local let WORKER_ID=$((i-1))

        if [ "$WORKER_ID" -gt 0 ]; then
            echo "------"
        fi

        local GPU_INFOS=$(echo -n "gpu|${WORKER_ID}" | nc 127.0.0.1 ${API_PORT} |sed 's/|/\n/g' |tail +2  |sed 's/,/\n/g')

        local GPU_ID=$(grep "^GPU=" <<< $GPU_INFOS |cut -d= -f2)
        local GPU_NAME=$(grep "^ID=0" -A99 <<< $GPU_DETAILS |grep "^Model=" |head -n1 |cut -d= -f2)
        local GPU_TEMPERATURE=$(grep "^Temperature=" <<< $GPU_INFOS |cut -d= -f2)
        local GPU_FAN_SPEED=$(grep "^Fan Percent=" <<< $GPU_INFOS |cut -d= -f2)
        local GPU_HASHRATE_ROUND=$(grep "^MHS 30s=" <<< $GPU_INFOS |cut -d= -f2)

        echo "gpu.${WORKER_ID}.id: ${GPU_ID}"
        echo "gpu.${WORKER_ID}.name: ${GPU_NAME}"
        echo "gpu.${WORKER_ID}.temperature: ${GPU_TEMPERATURE}°"
        echo "gpu.${WORKER_ID}.fanSpeed: ${GPU_FAN_SPEED}%"
        echo "gpu.${WORKER_ID}.hashRate: ${GPU_HASHRATE_ROUND} MH/s"
    done
}



function miner_status_json {
    local MINER=$1

    local API_HOST=localhost
    local API_PORT=$(getMinerApiPort $MINER)

    local SUMMARY_JSON=$(echo -n summary | nc -w 1 127.0.0.1 ${API_PORT} 2>/dev/null |sed 's/,/\n/g')

    if [ "$SUMMARY_JSON" = "" ]; then
        return 1 2>/dev/null || exit 1
    fi


    local PID_FILE="${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid"
    local PID=""
    if test -f $PID_FILE; then
        PID=$(cat $PID_FILE)
    fi


    # POOL
    local RESULT=$(echo -n "pools" | nc 127.0.0.1 ${API_PORT})
    local POOL=$(echo $RESULT |sed 's/|/\n/g' |tail +2 |sed 's/,/\n/g')

    local POOL_URL=$(grep "^URL=" <<< $POOL |cut -d= -f2 |sed 's/stratum+tcp:\/\///')
    local POOL_USER=$(grep "^User=" <<< $POOL |cut -d= -f2)
    local USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)
    local WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)

    local ALGO=$(grep "^Algorithm=" <<< $POOL |cut -d= -f2)
    local HASHRATE_ROUND=$(grep "^MHS 30s=" <<< $SUMMARY_JSON |cut -d= -f2)
    local WORKER_HASHRATE=0

    local DATE=$(date "+%F %T")
    local UPTIME=$(grep "^Elapsed=" <<< $SUMMARY_JSON |cut -d= -f2)


    # GPUS
    local CPUS=""
    local GPUS=""
    local GPU_COUNT=$(echo -n gpucount | nc 127.0.0.1 ${API_PORT} |sed 's/|/\n/g' |tail +2 |cut -d= -f2)
    local GPU_DETAILS=$(echo -n devdetails | nc 127.0.0.1 ${API_PORT} |sed 's/,/\n/g')


    for i in `seq 1 $DEVICES_COUNT`; do
        local let WORKER_ID=$((i-1))

        local GPU_INFOS=$(echo -n "gpu|${WORKER_ID}" | nc 127.0.0.1 ${API_PORT} |sed 's/|/\n/g' |tail +2  |sed 's/,/\n/g')

        local GPU_ID=$(grep "^GPU=" <<< $GPU_INFOS |cut -d= -f2)
        local GPU_NAME=$(grep "^ID=0" -A99 <<< $GPU_DETAILS |grep "^Model=" |head -n1 |cut -d= -f2)
        local GPU_TEMPERATURE=$(grep "^Temperature=" <<< $GPU_INFOS |cut -d= -f2)
        local GPU_FAN_SPEED=$(grep "^Fan Percent=" <<< $GPU_INFOS |cut -d= -f2)
        local GPU_HASHRATE_ROUND=$(grep "^MHS 30s=" <<< $GPU_INFOS |cut -d= -f2)

        local GPU_HASHRATE=$(echo "$GPU_HASHRATE_ROUND * 1024 * 1024" |bc |cut -d"." -f1)
        local WORKER_HASHRATE=$(echo "$WORKER_HASHRATE + $GPU_HASHRATE" |bc)

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


    # GLOBAL
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

