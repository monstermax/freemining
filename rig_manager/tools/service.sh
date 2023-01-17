#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh

ACTION=$1
shift
SERVICE=$1
shift
POOL_URL=$1
shift
POOL_ADDRESS=$1
shift
WORKER_NAME=$1
shift
ALGO=$1
shift

set -e


function usage {
    echo "Usage:"
    echo "   $0 start|restart <SERVICE> <POOL_URL> <POOL_ADDRESS> <WORKER> <ALGO>"
    echo "   $0 stop <SERVICE>"
    echo "   $0 status <SERVICE>"
    echo "   $0 info <SERVICE>"
    echo "   $0 log <SERVICE> [once]"
    echo "   $0 ps <SERVICE>"
    echo "   $0 ps all"
    echo
    echo "Sample:"
    echo "   $0 start mypool.com:5555 MY-COIN-ADDRESS MY-COMPUTER-NAME AUTOLYKOS2"
    echo
}


if [ "$ACTION" = "" ]; then
    usage
    exit 1
fi

if [ "$SERVICE" = "" ]; then
    usage
    exit 1
fi


LOG_FILE=${LOGS_DIR}/${SERVICE}.log
PID_FILE=${PIDS_DIR}/${SERVICE}.pid

mkdir -p $LOGS_DIR
mkdir -p $PIDS_DIR

POOL_HOST=$(echo $POOL_URL |cut -d":" -f1)
POOL_PORT=$(echo $POOL_URL |cut -d":" -f2)


case "$SERVICE" in
    nbminer)
        API_PORT=$(getMinerApiPort nbminer)
        CMD_EXEC="${MINERS_DIR}/nbminer/nbminer"

        CMD_ARGS="-a ${ALGO} \
            -o stratum+tcp://${POOL_URL} \
            -u ${POOL_ADDRESS}.${WORKER_NAME} \
            --api 127.0.0.1:${API_PORT} \
            $@"
        ;;

    lolminer)
        API_PORT=$(getMinerApiPort lolminer)
        CMD_EXEC="${MINERS_DIR}/lolminer/lolMiner"

        CMD_ARGS="--algo ${ALGO} \
            --pool ${POOL_URL} \
            --user ${POOL_ADDRESS}.${WORKER_NAME} \
            --apihost 127.0.0.1 --apiport ${API_PORT} \
            $@"
        ;;

    xmrig)
        API_PORT=$(getMinerApiPort xmrig)
        CMD_EXEC="${MINERS_DIR}/xmrig/xmrig-nofees"

        if [ "$ALGO" = "" ]; then
            ALGO="rx/0"
        fi

        CMD_ARGS="--url=${POOL_URL} \
            --user=${POOL_ADDRESS}.${WORKER_NAME} \
            -a ${ALGO} \
            -k \
            --donate-level 0 \
            --http-enabled --http-host 127.0.0.1 --http-port ${API_PORT} --http-access-token=yomining --http-no-restricted \
            --cpu-max-threads-hint 75 --cpu-priority 3 \
            --randomx-no-rdmsr \
            --log-file=${LOG_FILE} --no-color \
            $@"
        ;;

    teamredminer)
        API_PORT=$(getMinerApiPort teamredminer)
        CMD_EXEC="${MINERS_DIR}/teamredminer/teamredminer"

        CMD_ARGS="-a ${ALGO} \
            -o stratum+tcp://${POOL_URL} \
            -u ${POOL_ADDRESS}.${WORKER_NAME} \
            -p x \
            --api_listen=0.0.0.0:${API_PORT} \
            $@"
        ;;

    trex)
        API_PORT=$(getMinerApiPort trex)
        CMD_EXEC="${MINERS_DIR}/trex/t-rex"

        CMD_ARGS="-a ${ALGO} \
            -o stratum+tcp://${POOL_URL} \
            -u ${POOL_ADDRESS}.${WORKER_NAME} \
            -p x \
            --api-bind-http 127.0.0.1:${API_PORT} \
            $@"
        ;;

    gminer)
        API_PORT=$(getMinerApiPort gminer)
        CMD_EXEC="${MINERS_DIR}/gminer/miner"

        CMD_ARGS="--user ${POOL_ADDRESS}.${WORKER_NAME} \
            --server ${POOL_HOST} --port ${POOL_PORT} --pass x \
            --algo ${ALGO} \
            --api ${API_PORT} \
            $@"
        ;;

    all)
        if [ "$ACTION" != "ps" ]; then
            echo "Error: unknown service ${SERVICE}"
            exit 1
        fi
        CMD_EXEC="${MINERS_DIR}/nbminer/NOT_EXISING_FILE"
        ;;

    *)
        echo "Error: unknown service ${SERVICE}"
        exit 1
        ;;
esac


#echo $CMD_EXEC $CMD_ARGS
#exit

# ./service.sh start nbminer eu.jjpool.fr:3056 9i5bBBR828EUs79bXUJJpNAo6X2fdfigA4XkZvg7nDfPeUdjsRb maxomatic ergo
# ./service.sh start lolminer eu.jjpool.fr:3056 9i5bBBR828EUs79bXUJJpNAo6X2fdfigA4XkZvg7nDfPeUdjsRb maxomatic ergo
# ./service.sh start xmrig eu.jjpool.fr:3056 9i5bBBR828EUs79bXUJJpNAo6X2fdfigA4XkZvg7nDfPeUdjsRb maxomatic ergo
# ./service.sh start teamredminer eu.jjpool.fr:3056 9i5bBBR828EUs79bXUJJpNAo6X2fdfigA4XkZvg7nDfPeUdjsRb maxomatic ergo
# ./service.sh start trex eu.jjpool.fr:3056 9i5bBBR828EUs79bXUJJpNAo6X2fdfigA4XkZvg7nDfPeUdjsRb maxomatic ergo
# ./service.sh start gminer eu.jjpool.fr:3056 9i5bBBR828EUs79bXUJJpNAo6X2fdfigA4XkZvg7nDfPeUdjsRb maxomatic ergo

#########################################################################################################


# CHECK PARAMETERS
if [ "$ACTION" = "" ]; then
    usage
    exit 1
fi


# CHECK PARAMETERS (for start / restart)
if [ "$ACTION" = "start" -o "$ACTION" = "restart" ]; then
    if [ "$POOL_URL" = "" ]; then
        usage
        exit 1
    fi

    if [ "$POOL_ADDRESS" = "" ]; then
        usage
        exit 1
    fi

    if [ "$WORKER_NAME" = "" ]; then
        usage
        exit 1
    fi

    if [ "$ALGO" = "" ]; then
        usage
        exit 1
    fi
fi



PID=""
if test -f $PID_FILE; then
    echo PID_FILE=$PID_FILE
    PID=$(cat $PID_FILE)
fi



# STOP
if [ "$ACTION" = "stop" -o "$ACTION" = "start" -o "$ACTION" = "restart" ]; then
    rm -f $PID_FILE

    if [ "$PID" != "" ]; then
        echo "Stopping ${SERVICE} service"
        kill $PID 2>/dev/null
        pkill -P $PID 2>/dev/null
    fi

fi


# START / RESTART
if [ "$ACTION" = "start" -o "$ACTION" = "restart" ]; then
    echo "Starting ${SERVICE} service"

    $CMD_EXEC $CMD_ARGS >$LOG_FILE 2>&1 &

    #nohup $CMD_EXEC $CMD_ARGS 2>&1 |tee $LOG_FILE >/dev/null &

    PID=$!

    echo $PID > $PID_FILE
fi


# STATUS
if [ "$ACTION" = "status" ]; then
    if [ "$PID" != "" ]; then
        CMD_LINE=$(ps -p $PID -o args |tail -n +2)

        echo "Service ${SERVICE} is running. PID = ${PID}"
        echo
        echo "CMD = ${CMD_LINE}"
        echo
        echo "PID_FILE = ${PID_FILE}"
        echo "LOG_FILE = ${LOG_FILE}"

        if [ "$CMD_LINE" = "" ]; then
            echo
            echo "Process seems to be crashed"
            echo "run $0 kill ${SERVICE}"
            echo "then restart"
        fi

    else
        echo "service inactive"
    fi
fi


# INFO
if [ "$ACTION" = "info" ]; then
	#INFO=$(wget -qO- http://localhost:42999/rig/service/info?service=${SERVICE})
	INFO=$(../miners_api/json/${SERVICE}_api_json.sh)
    echo $INFO
fi


# LOG
if [ "$ACTION" = "log" ]; then
    ONCE=$POOL_URL

    if ! test -f $LOG_FILE; then
        exit
    fi

    if test -f $PID_FILE && test "$ONCE" != "once"; then
        tail -n 50 -f $LOG_FILE
    else
        tail -n 50 $LOG_FILE
    fi
fi


# PS
if [ "$ACTION" = "ps" ]; then
    PID=$(pgrep -af "$CMD_EXEC")

    if [ "$SERVICE" = "all" ]; then
        DIRNAME=$(dirname `dirname $CMD_EXEC`)
        PID=$(pgrep -af "$DIRNAME")
    fi

    if [ "$PID" != "" ]; then
        echo "$PID"
    fi
fi


# KILL
if [ "$ACTION" = "kill" ]; then
    echo "Killing ${SERVICE} process"
    PID=$(pgrep -f "$CMD_EXEC")

    rm -f $PID_FILE

    if [ "$PID" != "" ]; then
        kill $PID 2>/dev/null
        pkill -P $PID 2>/dev/null
        echo "Process(es) `echo $PID` killed"
    fi
fi


# CLEAN
if [ "$ACTION" = "clean" -o "$ACTION" = "kill" ]; then
    if test -f $PID_FILE; then
        echo "Cleaning PID file"
        rm -f $PID_FILE
    fi
fi

