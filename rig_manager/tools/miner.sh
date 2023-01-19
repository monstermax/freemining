#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh


ACTION=$1
MINER=$2
#MINER=$(getOpt -miner)
ALGO=$(getOpt -algo)
POOL_URL=$(getOpt -url)
POOL_ACCOUNT=$(getOpt -user)

x=$@ ; set -- $(removeOpt "$x" "-miner")
x=$@ ; set -- $(removeOpt "$x" "-algo")
x=$@ ; set -- $(removeOpt "$x" "-url")
x=$@ ; set -- $(removeOpt "$x" "-user")
shift 5

FRM_PACKAGE="miner"
DAEMON_NAME="freemining.${FRM_MODULE}.${FRM_PACKAGE}.${MINER}"

DAEMON_OPTS=""
#DAEMON_OPTS="background"




function usage {
    CMD=$(basename $BASH_SOURCE)

    echo "=============="
    echo "| FreeMining | ==> [${FRM_MODULE^^}] ==> [${FRM_PACKAGE^^}]"
    echo "=============="
    echo

    echo "Usage:"
    echo
    echo "  $CMD [action] <params>"
    echo
    echo "  $CMD run|start [miner] -algo [algo] -url [pool_url] -user [pool_account] <optional args>"
    echo
    echo "  $CMD run   <params>                         # run ${FRM_PACKAGE}"
    echo "  $CMD start <params>                         # start ${FRM_PACKAGE} in background"
    echo
    echo "  $CMD stop                                   # stop background ${FRM_PACKAGE}"
    echo
    echo "  $CMD status                                 # show ${FRM_PACKAGE} status"
    echo "  $CMD log                                    # tail ${FRM_PACKAGE} stdout"
    echo "  $CMD log-pid                                # tail ${FRM_PACKAGE} stdout"
    echo

    showMinersList
    echo

    echo "    * installed miners"

    ( find $MINERS_DIR -mindepth 1 -maxdepth 1 -type d 2>/dev/null || echo "no miner installed" ) | xargs -I '{}' basename {} | sed 's/^/      - /g' | sort
    echo

}

function showMinersList {
    echo "   * configured miners"

    if [ "$CONFIGURED_MINERS" = "" ]; then
        echo "No miner configured"

    else
        for miner in $CONFIGURED_MINERS; do
            echo "     - $miner"
        done
    fi

}



# START
if hasOpt start || hasOpt run || hasOpt debug; then
    x=$@ ; set -- $(removeOpt "$x" "start")
    x=$@ ; set -- $(removeOpt "$x" "run")
    x=$@ ; set -- $(removeOpt "$x" "debug")

    if hasOpt start; then
        # set background
        DAEMON_OPTS="background"
    fi

    DAEMON_CHDIR=$PWD
    DAEMON_DRY=0

    if hasOpt debug; then
        DAEMON_DRY=1
    fi


    if [ "$MINER" = "" -o "$POOL_ACCOUNT" = "" -o "$ALGO" = "" ]; then
        usage
        exit 1
    fi

    POOL_HOST=$(echo $POOL_URL |cut -d":" -f1)
    POOL_PORT=$(echo $POOL_URL |cut -d":" -f2)

    CMD_EXEC=""

    case "$MINER" in
        nbminer)
            API_PORT=$(getMinerApiPort nbminer)
            CMD_EXEC="${MINERS_DIR}/nbminer/nbminer"

            CMD_ARGS="-a ${ALGO} \
                -o stratum+tcp://${POOL_URL} \
                -u ${POOL_ACCOUNT} \
                --api 127.0.0.1:${API_PORT} \
                $@"
            ;;

        lolminer)
            API_PORT=$(getMinerApiPort lolminer)
            CMD_EXEC="${MINERS_DIR}/lolminer/lolMiner"

            CMD_ARGS="--algo ${ALGO} \
                --pool ${POOL_URL} \
                --user ${POOL_ACCOUNT} \
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
                --user=${POOL_ACCOUNT} \
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
                -u ${POOL_ACCOUNT} \
                -p x \
                --api_listen=0.0.0.0:${API_PORT} \
                $@"
            ;;

        trex)
            API_PORT=$(getMinerApiPort trex)
            CMD_EXEC="${MINERS_DIR}/trex/t-rex"

            CMD_ARGS="-a ${ALGO} \
                -o stratum+tcp://${POOL_URL} \
                -u ${POOL_ACCOUNT} \
                -p x \
                --api-bind-http 127.0.0.1:${API_PORT} \
                $@"
            ;;

        gminer)
            API_PORT=$(getMinerApiPort gminer)
            CMD_EXEC="${MINERS_DIR}/gminer/miner"

            CMD_ARGS="--user ${POOL_ACCOUNT} \
                --server ${POOL_HOST} --port ${POOL_PORT} --pass x \
                --algo ${ALGO} \
                --api ${API_PORT} \
                $@"
            ;;

        "")
            ;;

        *)
            echo "Error: unknown service ${MINER}"
            exit 1
            ;;
    esac


    if [ "$CMD_EXEC" != "" ]; then
        CMD="$CMD_EXEC $CMD_ARGS"

        daemonStart $DAEMON_NAME "$CMD" $DAEMON_OPTS
        exit $?
    fi

fi


# STOP
if hasOpt stop; then
    x=$@ ; set -- $(removeOpt "$x" "stop")

    if [ "$MINER" = "" ]; then
        usage
        exit 1
    fi

    daemonStop $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi


# STATUS
if hasOpt status; then
    x=$@ ; set -- $(removeOpt "$x" "status")

    if [ "$MINER" = "" ]; then
        usage
        exit 1
    fi

    daemonStatus $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi


# LOG
if hasOpt log; then
    x=$@ ; set -- $(removeOpt "$x" "log")

    if [ "$MINER" = "" ]; then
        usage
        exit 1
    fi

    daemonLog $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi


# PID-LOG
if hasOpt pid-log; then
    x=$@ ; set -- $(removeOpt "$x" "pid-log")

    if [ "$MINER" = "" ]; then
        usage
        exit 1
    fi

    daemonPidLog $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# LOG-FILE
if hasOpt log-file; then
    x=$@ ; set -- $(removeOpt "$x" "log-file")

    if [ "$MINER" = "" ]; then
        usage
        exit 1
    fi

    daemonLogFile $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# PID-FILE
if hasOpt pid-file; then
    x=$@ ; set -- $(removeOpt "$x" "pid-file")

    if [ "$MINER" = "" ]; then
        usage
        exit 1
    fi

    daemonPidFile $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# PID
if hasOpt pid; then
    x=$@ ; set -- $(removeOpt "$x" "pid")

    if [ "$MINER" = "" ]; then
        usage
        exit 1
    fi

    daemonPid $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# PS
if hasOpt ps; then
    x=$@ ; set -- $(removeOpt "$x" "ps")

    if [ "$MINER" = "" ]; then
        usage
        exit 1
    fi

    daemonPidPs $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi





usage

