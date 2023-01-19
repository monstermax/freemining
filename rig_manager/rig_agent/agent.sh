#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh
set -e


FRM_PACKAGE="agent"
DAEMON_NAME="freemining.${FRM_MODULE}.${FRM_PACKAGE}"

FRM_CMD_JS="${NODE} ./agent.js $@"
FRM_CMD_TS="${TS_NODE} ./agent.ts $@"

DAEMON_OPTS=""
#DAEMON_OPTS="background"


# START
if hasOpt start || hasOpt run; then
    x=$@ ; set -- $(removeOpt "$x" "start")
    x=$@ ; set -- $(removeOpt "$x" "run")

    if hasOpt start; then
        # set background
        DAEMON_OPTS="background"
    fi

    CMD="$FRM_CMD_JS"

    if test "$USE_TS" = "1" || hasOpt --ts; then
        # use typescript
        x=$@ ; set -- $(removeOpt "$x" "--ts")

        CMD="$FRM_CMD_TS"
    fi

    DAEMON_CHDIR=$PWD
    #DAEMON_DRY=1

    daemonStart $DAEMON_NAME "$CMD" $DAEMON_OPTS
    exit $?
fi


# STOP
if hasOpt stop; then
    x=$@ ; set -- $(removeOpt "$x" "stop")

    daemonStop $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi


# STATUS
if hasOpt status; then
    x=$@ ; set -- $(removeOpt "$x" "status")

    daemonStatus $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi


# LOG
if hasOpt log; then
    x=$@ ; set -- $(removeOpt "$x" "log")

    daemonLog $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi


# PID-LOG
if hasOpt pid-log; then
    x=$@ ; set -- $(removeOpt "$x" "pid-log")

    daemonPidLog $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# LOG-FILE
if hasOpt log-file; then
    x=$@ ; set -- $(removeOpt "$x" "log-file")

    daemonLogFile $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# PID-FILE
if hasOpt pid-file; then
    x=$@ ; set -- $(removeOpt "$x" "pid-file")

    daemonPidFile $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# PID
if hasOpt pid; then
    x=$@ ; set -- $(removeOpt "$x" "pid")

    daemonPid $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# PS
if hasOpt ps; then
    x=$@ ; set -- $(removeOpt "$x" "ps")

    daemonPidPs $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi




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
    echo "  $CMD run                       # start ${FRM_PACKAGE}"
    echo "  $CMD start                     # start ${FRM_PACKAGE} in background"
    echo "  $CMD stop                      # stop ${FRM_PACKAGE}"
    echo "  $CMD status                    # show ${FRM_PACKAGE} status"
    echo "  $CMD log                       # tail ${FRM_PACKAGE} stdout"
    echo "  $CMD pid-log                   # tail ${FRM_PACKAGE} stdout"
    echo
}

usage

