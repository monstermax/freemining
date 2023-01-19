#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh
set -e

# Usage:
# ./miner.sh {ACTION} {MINER} -algo {ALGO} -url {POOL_URL} -user {POOL_ACCOUNT}

# Actions: start stop status log pid-log log-file pid-file pid ps


ACTION=$1
MINER=$2
shift || true
shift || true

ALGO=""
POOL_URL=""
POOL_ACCOUNT=""

while [ : ]; do

    case "$1" in
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



FRM_PACKAGE="miner"
DAEMON_NAME="freemining.${FRM_MODULE}.${FRM_PACKAGE}.${MINER}"


DAEMON_LOG_DIR=$rigLogDir/miners
DAEMON_PID_DIR=$rigPidDir/miners
mkdir -p $DAEMON_LOG_DIR $DAEMON_PID_DIR



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
    echo "    - $CMD run   ...                          # run ${FRM_PACKAGE}"
    echo "    - $CMD start ...                          # start ${FRM_PACKAGE} in background"
    echo
    echo "  $CMD stop [miner]                           # stop background ${FRM_PACKAGE}"
    echo
    echo "  $CMD status [miner]                         # show ${FRM_PACKAGE} status"
    echo
    echo "  $CMD log [miner]                            # tail ${FRM_PACKAGE} stdout"
    echo "  $CMD log-pid [miner]                        # tail ${FRM_PACKAGE} stdout"
    echo
    echo "  $CMD ps                                     # show all ${FRM_PACKAGE} running processes"
    echo
    echo

    showMinersList

    echo

}

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



if [ "$ACTION" = "" ]; then
    usage
    exit 1
fi

if [ "$MINER" = "" ]; then
    if [ "$ACTION" != "ps" ]; then
        usage
        exit 1
    fi
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


    if [ "$POOL_ACCOUNT" = "" -o "$ALGO" = "" ]; then
        usage
        exit 1
    fi

    POOL_HOST=$(echo $POOL_URL |cut -d":" -f1)
    POOL_PORT=$(echo $POOL_URL |cut -d":" -f2)

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
if test "$ACTION" = "ps"; then
    if [ "$MINER" = "" ]; then
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.${FRM_MODULE}\.${FRM_PACKAGE}\.") |grep -e '\[free[m]ining.*\]' --color -B1
        exit $?
    fi

    daemonPidPs $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi





usage

