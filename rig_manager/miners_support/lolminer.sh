#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./miners_support.sh
set -e



function miner_install {
    local MINER=$1
    local VERSION="1.65"

    local TMP_DIR=$(mktemp -d)
    miner_before_install "$MINER" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/Lolliedieb/lolMiner-releases/releases/download/${VERSION}/lolMiner_v${VERSION}_Lin64.tar.gz"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${MINER}-unzipped"
    local INSTALL_LOG="${rigLogDir}/miners/${MINER}_install.log"
    >${INSTALL_LOG}

    echo " - downloading..."
    wget -q $DL_URL

    echo " - unziping..."
    mkdir -p $UNZIP_DIR
    tar zxf $DL_FILE -C $UNZIP_DIR

    echo " - installing..."
    rm -rf ${minersDir}/${MINER}
    cp -a ${UNZIP_DIR}/${VERSION} ${minersDir}/${MINER}

    echo " - testing..."
    ${minersDir}/${MINER}/lolMiner --list-device

    miner_after_install "$MINER" "$VERSION" $TMP_DIR
}


function miner_get_run_cmd {
    local MINER=$1
    shift || true

    local CMD_EXEC=${minersDir}/${MINER}/lolMiner
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
        --algo ${ALGO}
        --pool ${POOL_URL}
        --user ${POOL_ACCOUNT}
        --apihost 127.0.0.1
        --apiport ${API_PORT}
        "

    echo $CMD_ARGS
}


function miner_status_txt {
    local MINER=$1

    echo "miner.name: $MINER"

    local API_PORT=$(getMinerApiPort $MINER)
    local API_URL=http://localhost:${API_PORT}

    local SUMMARY_URL=${API_URL}/
    local SUMMARY_JSON=$(wget --tries=1 --timeout=1 --connect-timeout=1 --read-timeout=1 -qO- $SUMMARY_URL)

    if [ "$SUMMARY_JSON" = "" ]; then
        echo -e "miner.active: \033[0;31mfalse\033[0m"
        return 1 2>/dev/null || exit 1
    fi

    echo -e "miner.active: \033[0;32mtrue\033[0m"

    local POOL_USER=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].User")
    local WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)
    local UPTIME=$(echo $SUMMARY_JSON |jq -r ".Session.Uptime")
    local ALGO=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Algorithm")

    local WORKER_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Total_Performance")
    local WORKER_HASHRATE_ROUND=$(echo "scale=2; ${WORKER_HASHRATE}/1" | bc)
    local HASHRATE_UNIT=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Performance_Unit")

    local PID_FILE=${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid
    local PID=""
    local POOL_URL=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Pool")
    local USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)


    echo "worker.name: ${WORKER_NAME}"
    echo "worker.uptime: ${UPTIME}"
    echo "worker.algo: ${ALGO}"
    echo "worker.hashRate: ${WORKER_HASHRATE_ROUND} ${HASHRATE_UNIT}"

    if test -f $PID_FILE; then
        PID=$(cat $PID_FILE)
        echo "worker.pid: ${PID}"
    fi

    echo "pool.url: ${POOL_URL}"
    echo "pool.account: ${USER_ADDR}"


    echo "------------"

    local NB_WORKER=$(echo $SUMMARY_JSON |jq -r ".Num_Workers")

    for i in `seq 1 $NB_WORKER`; do
        local let WORKER_ID=$((i-1))

        if [ "$WORKER_ID" -gt 0 ]; then
            echo "------"
        fi

        local GPU_ID=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Index")
        local GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Name")
        local GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Core_Temp")
        local GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Fan_Speed")
        local GPU_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Worker_Performance[${WORKER_ID}]")
        local GPU_HASHRATE_ROUND=$(echo "scale=2; ${GPU_HASHRATE}/1" | bc)

        echo "gpu.${WORKER_ID}.id: ${GPU_ID}"
        echo "gpu.${WORKER_ID}.name: ${GPU_NAME}"
        echo "gpu.${WORKER_ID}.temperature: ${GPU_TEMPERATURE}°"
        echo "gpu.${WORKER_ID}.fanSpeed: ${GPU_FAN_SPEED}%"
        echo "gpu.${WORKER_ID}.hashRate: ${GPU_HASHRATE_ROUND} ${HASHRATE_UNIT}"

    done

}


function miner_status_json {
    local MINER=$1

    local API_PORT=$(getMinerApiPort $MINER)
    local API_URL=http://localhost:${API_PORT}

    local SUMMARY_URL=${API_URL}/
    local SUMMARY_JSON=$(wget --tries=1 --timeout=1 --connect-timeout=1 --read-timeout=1 -qO- $SUMMARY_URL)

    if [ "$SUMMARY_JSON" = "" ]; then
        return 1 2>/dev/null || exit 1
    fi


    local PID_FILE="${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid"
    local PID=""
    if test -f $PID_FILE; then
        PID=$(cat $PID_FILE)
    fi


    local POOL_USER=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].User")
    local WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)
    local USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)

    local UPTIME=$(echo $SUMMARY_JSON |jq -r ".Session.Uptime")

    local DATE=$(date "+%F %T")

    local ALGO=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Algorithm")

    local WORKER_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Total_Performance")
    local WORKER_HASHRATE_ROUND=$(echo "scale=2; ${WORKER_HASHRATE}/1" | bc)
    local HASHRATE_UNIT=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Performance_Unit")

    local WORKER_HASHRATE_INT=$(echo "${WORKER_HASHRATE} * 1024 * 1024" | bc | cut -d"." -f1)

    local POOL_URL=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Pool")

    local CPUS=""
    local GPUS=""

    local NB_WORKER=$(echo $SUMMARY_JSON |jq -r ".Num_Workers")

    local WORKER_ID
    for i in `seq 1 $NB_WORKER`; do
        local let WORKER_ID=$((i-1))

        local GPU_ID=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Index")
        local GPU_NAME=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Name")
        local GPU_TEMPERATURE=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Core_Temp")
        local GPU_FAN_SPEED=$(echo $SUMMARY_JSON |jq -r ".Workers[$WORKER_ID].Fan_Speed")
        local GPU_HASHRATE=$(echo $SUMMARY_JSON |jq -r ".Algorithms[0].Worker_Performance[${WORKER_ID}]")
        local GPU_HASHRATE_ROUND=$(echo "scale=2; ${GPU_HASHRATE}/1" | bc)
        local GPU_HASHRATE_INT=$(echo "${GPU_HASHRATE} * 1024 * 1024" | bc | cut -d"." -f1)

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

