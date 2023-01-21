#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh
set -e

# Usage:
# ./run_miner.sh ps
# or
# ./run_miner.sh run|start|restart {MINER} -algo {ALGO} -url {POOL_URL} -user {POOL_ACCOUNT}
# or
# ./run_miner.sh {ACTION} {MINER}

# Actions: run start stop status debug log pid-log log-file pid-file pid ps


MINER=$1
ACTION=$2
shift 2 || true


FRM_PACKAGE="miner"
DAEMON_NAME="freemining.${FRM_MODULE}.${FRM_PACKAGE}.${MINER}"


function usage {
    CMD=$(basename $BASH_SOURCE)

    echo "=============="
    echo "| FreeMining | ==> [${FRM_MODULE^^}] ==> [${FRM_PACKAGE^^}]"
    echo "=============="
    echo

    echo "Usage:"
    echo
    echo "  $CMD {miner} {action} <params>"
    echo
    echo "  $CMD {miner} run|start -algo {algo} -url {pool_url} -user {pool_account} [ -- {optional args} ]"
    echo "  $CMD {miner} run|start -conf {confName}              # run/start a predefined configuration"
    echo "  $CMD {miner} run ...                                 # run ${FRM_PACKAGE}"
    echo "  $CMD {miner} start ...                               # start ${FRM_PACKAGE} in background"
    echo
    echo "  $CMD {miner} stop                                    # stop background ${FRM_PACKAGE}"
    echo
    echo "  $CMD {miner} status                                  # show ${FRM_PACKAGE} status"
    echo "  $CMD {miner} status-txt                              # show ${FRM_PACKAGE} detailed status"
    echo "  $CMD {miner} status-json                             # show ${FRM_PACKAGE} detailed status JSON formatted"
    echo
    echo "  $CMD {miner} log                                     # tail ${FRM_PACKAGE} stdout"
    #echo "  $CMD {miner} log-pid                                 # tail ${FRM_PACKAGE} stdout"
    echo
    echo "  $CMD {miner} ps                                      # show ${FRM_PACKAGE} {miner} running process"
    echo
    echo "  $CMD ps                                              # show all ${FRM_PACKAGE} running processes"
    echo "  $CMD ps {miner}                                      # show ${FRM_PACKAGE} {miner} running process"
    echo
    echo

    showMinersList

    echo
}


################################################################################



CONF_NAME=""
ALGO=""
POOL_URL=""
POOL_ACCOUNT=""

while [ : ]; do

    case "$1" in
        -conf)
            CONF_NAME="$2"
            shift 2 || echo "Error: missing argument"
            ;;

        -algo)
            ALGO="$2"
            shift 2 || echo "Error: missing argument"
            ;;

        -url)
            POOL_URL="$2"
            shift 2 || echo "Error: missing argument"
            ;;

        -user)
            POOL_ACCOUNT="$2"
            shift 2 || echo "Error: missing argument"
            ;;

        "")
            #echo "end of args"
            break
            ;;

        --)
            #echo "breaking"
            shift
            break
            ;;

        *)
            #echo "Warning: invalid argument $1"
            #exit 1
            shift
            ;;
    esac
done


DAEMON_LOG_DIR=$rigLogDir/miners
DAEMON_PID_DIR=$rigPidDir/miners
mkdir -p $DAEMON_LOG_DIR $DAEMON_PID_DIR



if [ "$CONF_NAME" != "" ]; then
    # load config and set variables
    ALGO=$(jq -r ".pools.${CONF_NAME}.algo" $RIG_CONFIG_FILE)
    POOL_URL=$(jq -r ".pools.${CONF_NAME}.poolUrl" $RIG_CONFIG_FILE)
    POOL_ACCOUNT=$(jq -r ".pools.${CONF_NAME}.poolAccount" $RIG_CONFIG_FILE)
fi


function showMinersList {
    _CONFIGURED_MINERS=$CONFIGURED_MINERS
    if [ "$_CONFIGURED_MINERS" = "" ]; then
        _CONFIGURED_MINERS="no miner configured"
    fi

    echo "    * configured miners: $_CONFIGURED_MINERS"

    echo

    _INSTALLED_MINERS=$INSTALLED_MINERS
    if [ "$_INSTALLED_MINERS" = "" ]; then
        _INSTALLED_MINERS="no miner installed"
    fi

    echo "    * installed  miners: $_INSTALLED_MINERS"
}



if [ "$MINER" != "ps" -a "$ACTION" = "" ]; then
    # for "ps", MINER and ACTION are switched
    usage
    exit 1
fi


DAEMON_OPTS=""


# START
if test "$ACTION" = "start" || test "$ACTION" = "run" || test "$ACTION" = "debug"; then
    if test "$ACTION" = "start"; then
        # set background
        DAEMON_OPTS="background"
    fi

    DAEMON_CHDIR=$PWD
    DAEMON_DRY=0

    if test "$ACTION" = "debug"; then
        DAEMON_DRY=1
    fi


    if [ "$POOL_ACCOUNT" = "" -o "$ALGO" = "" -o "$POOL_URL" = "" -o "$POOL_ACCOUNT" = "" ]; then
        usage
        exit 1
    fi

    POOL_HOST=$(echo "$POOL_URL" |cut -d":" -f1)
    POOL_PORT=$(echo "$POOL_URL" |cut -d":" -f2)

    CMD_EXEC=""

    case "$MINER" in
        nbminer)
            API_PORT=$(getMinerApiPort nbminer)
            CMD_EXEC="${minersDir}/nbminer/nbminer"

            CMD_ARGS="-a ${ALGO} \
                -o stratum+tcp://${POOL_URL} \
                -u ${POOL_ACCOUNT} \
                --api 127.0.0.1:${API_PORT} \
                $@"
            ;;

        lolminer)
            API_PORT=$(getMinerApiPort lolminer)
            CMD_EXEC="${minersDir}/lolminer/lolMiner"

            CMD_ARGS="--algo ${ALGO} \
                --pool ${POOL_URL} \
                --user ${POOL_ACCOUNT} \
                --apihost 127.0.0.1 --apiport ${API_PORT} \
                $@"
            ;;

        xmrig)
            API_PORT=$(getMinerApiPort xmrig)
            CMD_EXEC="${minersDir}/xmrig/xmrig-nofees"

            if [ "$ALGO" = "" ]; then
                ALGO="rx/0"
            fi

            LOG_FILE=${DAEMON_LOG_DIR}/${DAEMON_NAME}.daemon.log

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
            CMD_EXEC="${minersDir}/teamredminer/teamredminer"

            CMD_ARGS="-a ${ALGO} \
                -o stratum+tcp://${POOL_URL} \
                -u ${POOL_ACCOUNT} \
                -p x \
                --api_listen=0.0.0.0:${API_PORT} \
                $@"
            ;;

        trex)
            API_PORT=$(getMinerApiPort trex)
            CMD_EXEC="${minersDir}/trex/t-rex"

            CMD_ARGS="-a ${ALGO} \
                -o stratum+tcp://${POOL_URL} \
                -u ${POOL_ACCOUNT} \
                -p x \
                --api-bind-http 127.0.0.1:${API_PORT} \
                $@"
            ;;

        gminer)
            API_PORT=$(getMinerApiPort gminer)
            CMD_EXEC="${minersDir}/gminer/miner"

            CMD_ARGS="--user ${POOL_ACCOUNT} \
                --server ${POOL_HOST} --port ${POOL_PORT} --pass x \
                --algo ${ALGO} \
                --api ${API_PORT} \
                $@"
            ;;

        "")
            ;;

        *)
            echo "Error: unknown miner ${MINER}"
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
if test "$ACTION" = "stop"; then
    daemonStop $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi


# STATUS
if test "$ACTION" = "status"; then
    daemonStatus $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi


# LOG
if test "$ACTION" = "log"; then
    daemonLog $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi


# PID-LOG
if test "$ACTION" = "pid-log"; then
    daemonPidLog $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# LOG-FILE
if test "$ACTION" = "log-file"; then
    daemonLogFile $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# PID-FILE
if test "$ACTION" = "pid-file"; then
    daemonPidFile $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# PID
if test "$ACTION" = "pid"; then
    daemonPid $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# PS
if test "$MINER" = "ps" || test "$ACTION" = "ps"; then
    # for "ps", MINER and ACTION are switched
    if test "$MINER" = "ps"; then
        MINER=$ACTION
        DAEMON_NAME="freemining.${FRM_MODULE}.${FRM_PACKAGE}.${MINER}"
    fi
    if [ "$MINER" = "" ]; then
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.${FRM_MODULE}\.${FRM_PACKAGE}\.") |grep -e '\[free[m]ining.*\]' --color -B1
        exit $?
    fi

    daemonPidPs $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi



# STATUS JSON
if test "$ACTION" = "status-json"; then
    if ! test -x ../miners_monitor/json/${MINER}.sh; then
        echo "Error: ${MINER} is not  a valid miner"
        exit 1
    fi

    ../miners_monitor/json/${MINER}.sh
    exit $?
fi

# STATUS TXT
if test "$ACTION" = "status-txt"; then
    if ! test -x ../miners_monitor/txt/${MINER}.sh; then
        echo "Error: ${MINER} is not  a valid miner"
        exit 1
    fi

    ../miners_monitor/txt/${MINER}.sh
    exit $?
fi



usage

