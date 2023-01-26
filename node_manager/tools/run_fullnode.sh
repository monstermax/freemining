#!/bin/bash

cd `dirname $0`

source ../node_manager.sh
set -e

# Usage:
# ./run_fullnode.sh ps
# or
# ./run_fullnode.sh {ACTION} {CHAIN}

# Actions: run start stop status debug log pid-log log-file pid-file pid ps


FULLNODE=$1
ACTION=$2
shift 2 || true

FRM_PACKAGE="fullnode"
DAEMON_NAME="freemining.${FRM_MODULE}.${FRM_PACKAGE}.${FULLNODE}"


function usage {
    CMD=$(basename $BASH_SOURCE)

    echo "=============="
    echo "| FreeMining | ==> [${FRM_MODULE^^}] ==> [${FRM_PACKAGE^^}]"
    echo "=============="
    echo

    echo "Usage:"
    echo
    echo "  $CMD {chain} {action} <params>"
    echo
    echo "  $CMD {chain} run                         # run ${FRM_PACKAGE}"
    echo "  $CMD {chain} start                       # start ${FRM_PACKAGE} in background"
    echo "  $CMD {chain} restart                     # start ${FRM_PACKAGE} in background"
    echo
    echo "  $CMD {chain} stop                        # stop background ${FRM_PACKAGE}"
    echo
    echo "  $CMD {chain} status                      # show ${FRM_PACKAGE} status"
    echo
    echo "  $CMD {chain} log                         # tail ${FRM_PACKAGE} stdout"
    #echo "  $CMD {chain} log-pid                     # tail ${FRM_PACKAGE} stdout"
    echo
    echo "  $CMD {chain} ps                          # show ${FRM_PACKAGE} {chain} running process"
    echo
    echo "  $CMD ps                                  # show all ${FRM_PACKAGE} running processes"
    echo "  $CMD ps {chain}                          # show ${FRM_PACKAGE} {chain} running process"
    echo "  $CMD ps                                  # show all ${FRM_PACKAGE} running processes"
    echo
    echo "  $CMD dir {chain}                         # show ${FRM_PACKAGE} folders"
    echo

    showFullnodesList

    echo
}


################################################################################


FULLNODE_LOADED="0"
if [ "$FULLNODE" != "" -a "$FULLNODE" != "ps" -a "$FULLNODE" != "dir" ]; then
    if test -f ../fullnodes_support/${FULLNODE}.sh; then
        source ../fullnodes_support/${FULLNODE}.sh
        FULLNODE_LOADED="1"
    fi
fi


DAEMON_LOG_DIR=$nodeLogDir/fullnodes
DAEMON_PID_DIR=$nodePidDir/fullnodes
mkdir -p $DAEMON_LOG_DIR $DAEMON_PID_DIR


################################################################################


function showFullnodesList {
    _CONFIGURED_FULLNODES=$CONFIGURED_FULLNODES
    if [ "$_CONFIGURED_FULLNODES" = "" ]; then
        _CONFIGURED_FULLNODES="no fullnode configured"
    fi
    echo "    * configured fullnodes: $_CONFIGURED_FULLNODES"

    echo

    _INSTALLED_FULLNODES=$INSTALLED_FULLNODES
    if [ "$_INSTALLED_FULLNODES" = "" ]; then
        _INSTALLED_FULLNODES="no fullnode installed"
    fi
    echo "    * installed  fullnodes: $_INSTALLED_FULLNODES"
}


################################################################################


if [ "$FULLNODE" != "ps" -a "$FULLNODE" != "dir" -a "$ACTION" = "" ]; then
    # for "ps" & "dir", FULLNODE and ACTION are switched
    usage
    exit 1
fi




# STOP
if test "$ACTION" = "stop" || test "$ACTION" = "restart"; then
    daemonStop $DAEMON_NAME "$DAEMON_OPTS" $@

    if test "$ACTION" = "stop"; then
        exit $?
    fi
fi



# START
if test "$ACTION" = "run" || test "$ACTION" = "start" || test "$ACTION" = "restart" || test "$ACTION" = "debug"; then

    if test "$ACTION" = "start"; then
        # set background
        DAEMON_OPTS="background"
    fi

    #DAEMON_CHDIR=$PWD
    DAEMON_CHDIR=${fullnodesDir}/${FULLNODE}
    DAEMON_DRY=0

    if test "$ACTION" = "debug"; then
        DAEMON_DRY=1
    fi


    if ! test -d ${fullnodesDir}/${FULLNODE}; then
        echo "Error: Fullnode ${FULLNODE} is not installed"
        exit 1
    fi

    mkdir -p ${nodeConfDir}/fullnodes/${FULLNODE}


    if test "$FULLNODE_LOADED" != "1"; then
        echo "Error: ${FULLNODE} is not a valid fullnode"
        exit 1
    fi


    CMD_EXEC=$(fullnode_get_run_cmd "${FULLNODE}")
    CMD_ARGS=$(fullnode_get_run_args "${FULLNODE}" "${ALGO}" "${POOL_URL}" "${POOL_ACCOUNT}")

    if [ "$CMD_EXEC" != "" ]; then
        DAEMON_CMD="$CMD_EXEC $CMD_ARGS $@"

        daemonStart "$DAEMON_NAME" "$DAEMON_CMD" "$DAEMON_OPTS"
        exit $?

    else
        echo "Error: ${FULLNODE} is not supported"
        exit 1
    fi
fi


# STATUS
if test "$ACTION" = "status"; then
    daemonStatus $DAEMON_NAME "$DAEMON_OPTS" $@
    exit $?
fi


# LOG
if test "$ACTION" = "log"; then
    daemonLog $DAEMON_NAME "$DAEMON_OPTS" $@
    exit $?
fi


# PID-LOG
if test "$ACTION" = "pid-log"; then
    daemonPidLog $DAEMON_NAME "$DAEMON_OPTS" $@
    exit $?
fi

# LOG-FILE
if test "$ACTION" = "log-file"; then
    daemonLogFile $DAEMON_NAME "$DAEMON_OPTS" $@
    exit $?
fi

# PID-FILE
if test "$ACTION" = "pid-file"; then
    daemonPidFile $DAEMON_NAME "$DAEMON_OPTS" $@
    exit $?
fi

# PID
if test "$ACTION" = "pid"; then
    daemonPid $DAEMON_NAME "$DAEMON_OPTS" $@
    exit $?
fi

# PS
if test "$FULLNODE" = "ps" || test "$ACTION" = "ps"; then
    # for "ps", FULLNODE and ACTION are switched
    if test "$FULLNODE" = "ps"; then
        FULLNODE=$ACTION
        DAEMON_NAME="freemining.${FRM_MODULE}.${FRM_PACKAGE}.${FULLNODE}"
    fi
    if [ "$FULLNODE" = "" ]; then
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.${FRM_MODULE}\.${FRM_PACKAGE}\.") |grep -e '\[free[m]ining.*\]' --color -B1
        exit $?
    fi

    daemonPidPs $DAEMON_NAME "$DAEMON_OPTS" $@
    exit $?
fi


# DIR
if test "$FULLNODE" = "dir" || test "$ACTION" = "dir"; then
    # for "ps", FULLNODE and ACTION are switched
    if test "$FULLNODE" = "dir"; then
        FULLNODE=$ACTION
        DAEMON_NAME="freemining.${FRM_MODULE}.${FRM_PACKAGE}.${FULLNODE}"
    fi

    if [ "$FULLNODE" = "" ]; then
        echo "App: ${fullnodesDir} [$((du -hs ${fullnodesDir} 2>/dev/null || echo 0) |cut -f1)]"
        echo "Data: ${nodeConfDir}/fullnodes [$((du -hs ${nodeConfDir}/fullnodes 2>/dev/null || echo 0) |cut -f1)]"
        echo "Log: ${nodeLogDir}/fullnodes [$((du -hs ${nodeLogDir}/fullnodes 2>/dev/null || echo 0) |cut -f1)]"
        echo "Pid: ${nodePidDir}/fullnodes [$((du -hs ${nodePidDir}/fullnodes 2>/dev/null || echo 0) |cut -f1)]"
    else
        echo "App: ${fullnodesDir}/${FULLNODE} [$((du -hs ${fullnodesDir}/${FULLNODE} 2>/dev/null || echo 0) |cut -f1)]"
        echo "Data: ${nodeConfDir}/fullnodes/${FULLNODE} [$((du -hs ${nodeConfDir}/fullnodes/${FULLNODE} 2>/dev/null || echo 0) |cut -f1)]"
        echo "Log: ${nodeLogDir}/fullnodes/${FULLNODE}* [$((du -hsc ${nodeLogDir}/fullnodes/${FULLNODE}* 2>/dev/null || echo 0) |tail -n1 |cut -f1)]"
        echo "Pid: ${nodePidDir}/fullnodes/freemining.node.fullnode.${FULLNODE}.pid [$((du -hs ${nodePidDir}/fullnodes/freemining.node.fullnode.${FULLNODE}.pid 2>/dev/null || echo 0) |cut -f1)]"
    fi
    exit $?
fi




usage

