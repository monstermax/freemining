#!/bin/bash

cd `dirname $0`

source ../fullnode_manager.sh
set -e


ACTION=$1
FULLNODE=$2

FRM_PACKAGE="fullnode"
DAEMON_NAME="freemining.${FRM_MODULE}.${FRM_PACKAGE}.${FULLNODE}"

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
    echo "  $CMD run|start [chain]"
    echo
    echo "  $CMD run       [chain]          # run ${FRM_PACKAGE}"
    echo "  $CMD start     [chain]          # start ${FRM_PACKAGE} in background"
    echo
    echo "  $CMD stop      [chain]          # stop background ${FRM_PACKAGE}"
    echo
    echo "  $CMD status    [chain]          # show ${FRM_PACKAGE} status"
    echo "  $CMD log       [chain]          # tail ${FRM_PACKAGE} stdout"
    echo "  $CMD log-pid   [chain]          # tail ${FRM_PACKAGE} stdout"
    echo

    showFullnodesList

    echo
}

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



# START
if hasOpt start || hasOpt run || hasOpt debug; then
    shift

    if hasOpt start; then
        # set background
        DAEMON_OPTS="background"
    fi

    #DAEMON_CHDIR=$PWD
    DAEMON_CHDIR=${fullnodesDir}/${FULLNODE}
    DAEMON_DRY=0

    if hasOpt debug; then
        DAEMON_DRY=1
    fi


    if [ "$FULLNODE" = "" ]; then
        usage
        exit 1
    fi
    shift

    CMD_EXEC=""

    case "$FULLNODE" in
        ergo)
            CMD_EXEC="java -jar -Xmx4G ${fullnodesDir}/ergo/ergo.jar --mainnet -c ${nodeConfDir}/fullnodes/${FULLNODE}/${FULLNODE}.conf $@"
            ;;

        monero)
            CMD_EXEC="${fullnodesDir}/monero/monerod --data-dir ${nodeConfDir}/fullnodes/${FULLNODE} --non-interactive $@"
            ;;

        firo)
            CMD_EXEC="${fullnodesDir}/firo/firod -datadir=${nodeConfDir}/fullnodes/${FULLNODE} $@"
            ;;

        *)
            echo "Error: unknown fullnode ${FULLNODE}"
            exit 1
            ;;
    esac


    if [ "$CMD_EXEC" != "" ]; then
        daemonStart "$DAEMON_NAME" "$CMD_EXEC" "$DAEMON_OPTS"
        exit $?
    fi

fi


# STOP
if hasOpt stop; then
    x=$@ ; set -- $(removeOpt "$x" "stop")

    if [ "$FULLNODE" = "" ]; then
        usage
        exit 1
    fi

    daemonStop $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi


# STATUS
if hasOpt status; then
    x=$@ ; set -- $(removeOpt "$x" "status")

    if [ "$FULLNODE" = "" ]; then
        usage
        exit 1
    fi

    daemonStatus $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi


# LOG
if hasOpt log; then
    x=$@ ; set -- $(removeOpt "$x" "log")

    if [ "$FULLNODE" = "" ]; then
        usage
        exit 1
    fi

    daemonLog $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi


# PID-LOG
if hasOpt pid-log; then
    x=$@ ; set -- $(removeOpt "$x" "pid-log")

    if [ "$FULLNODE" = "" ]; then
        usage
        exit 1
    fi

    daemonPidLog $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# LOG-FILE
if hasOpt log-file; then
    x=$@ ; set -- $(removeOpt "$x" "log-file")

    if [ "$FULLNODE" = "" ]; then
        usage
        exit 1
    fi

    daemonLogFile $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# PID-FILE
if hasOpt pid-file; then
    x=$@ ; set -- $(removeOpt "$x" "pid-file")

    if [ "$FULLNODE" = "" ]; then
        usage
        exit 1
    fi

    daemonPidFile $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# PID
if hasOpt pid; then
    x=$@ ; set -- $(removeOpt "$x" "pid")

    if [ "$FULLNODE" = "" ]; then
        usage
        exit 1
    fi

    daemonPid $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi

# PS
if hasOpt ps; then
    x=$@ ; set -- $(removeOpt "$x" "ps")

    if [ "$FULLNODE" = "" ]; then
        #usage
        #exit 1
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.${FRM_MODULE}\.${FRM_PACKAGE}\.") |grep -e '\[free[m]ining.*\]' --color -B1
    fi

    daemonPidPs $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi





usage

