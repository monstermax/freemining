#!/bin/bash

cd `dirname $0`

source ../../pool_manager.sh


FRM_PACKAGE="miningcore"
DAEMON_NAME="freemining.${FRM_MODULE}.${FRM_PACKAGE}"

DAEMON_OPTS=""
#DAEMON_OPTS="background"




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


    ${POOL_APP_DIR}/pools_manager/patchs/miningcoreWebUI_api_config.sh -q

    CMD="${POOLS_ENGINE_DIR}/${FRM_PACKAGE}/Miningcore -c ${USER_CONF_DIR}/${FRM_MODULE}/${FRM_PACKAGE}/config.json $@"

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
    echo "  $CMD log-pid                   # tail ${FRM_PACKAGE} stdout"
    echo
}

usage

