#!/bin/bash

cd `dirname $0`

source ../node_manager.sh
set -e

# Usage:
# ./run_fullnode.sh ps
# or
# ./run_fullnode.sh {ACTION} {CHAIN}

# Actions: run start stop status debug log pid-log log-file pid-file pid ps


ACTION=$1
FULLNODE=$2
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
    echo "  $CMD [action] <params>"
    echo
    echo "    - $CMD run [chain]               # run ${FRM_PACKAGE}"
    echo "    - $CMD start [chain]             # start ${FRM_PACKAGE} in background"
    echo "    - $CMD restart [chain]           # start ${FRM_PACKAGE} in background"
    echo
    echo "  $CMD stop [chain]                  # stop background ${FRM_PACKAGE}"
    echo
    echo "  $CMD status [chain]                # show ${FRM_PACKAGE} status"
    echo
    echo "  $CMD log [chain]                   # tail ${FRM_PACKAGE} stdout"
    echo "  $CMD log-pid [chain]               # tail ${FRM_PACKAGE} stdout"
    echo
    echo "  $CMD ps                            # show all ${FRM_PACKAGE} running processes"
    echo

    showFullnodesList

    echo
}


################################################################################


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



if [ "$ACTION" = "" ]; then
    usage
    exit 0
fi

if [ "$FULLNODE" = "" ]; then
    if [ "$ACTION" != "ps" ]; then
        usage
        exit 1
    fi
fi



# STOP
if test "$ACTION" = "stop" || test "$ACTION" = "restart"; then
    daemonStop $DAEMON_NAME $DAEMON_OPTS

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


    mkdir -p ${nodeConfDir}/fullnodes/${FULLNODE}


    CMD_EXEC=""
    CMD_ARGS=""

    case "$FULLNODE" in
        callisto)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/geth-linux-amd64 --datadir ${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="--port 30303 --http.addr 0.0.0.0 --http.port 8545 --ws.addr 0.0.0.0 --ws.port 8546 $@"
            ;;

        ergo)
            CMD_EXEC="java -jar -Xmx4G ${fullnodesDir}/${FULLNODE}/ergo.jar --mainnet -c ${nodeConfDir}/fullnodes/${FULLNODE}/${FULLNODE}.conf"
            CMD_ARGS="$@"
            ;;

        ethereum_classic)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/geth --datadir ${nodeConfDir}/fullnodes/${FULLNODE} --classic"
            CMD_ARGS="--port 30303 --http.addr 0.0.0.0 --http.port 8545 --ws.addr 0.0.0.0 --ws.port 8546 $@"
            ;;

        firo)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-server -rpcuser=user -rpcpassword=pass -rpcbind=0.0.0.0 -rpcport=8888 -rpcallowip=127.0.0.1 -rpcallowip=${IP_CRYPTO} -port=8168 $@"
            ;;

        flux)
            CMD_EXEC="zelcashd -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-rpcuser=user -rpcpassword=pass -rpcport=16124 -rpcallowip=127.0.0.1 -rpcallowip=${IP_CRYPTO} -port=16125 $@"
            ;;

        kaspa)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d --appdir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="--utxoindex --rpclisten=16110 $@"
            ;;

        komodo)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-rpcuser=user -rpcpassword=pass -rpcbind=0.0.0.0 -rpcport=8332 -rpcallowip=127.0.0.1 -rpcallowip=${IP_CRYPTO} -port=7770 -exportdir=/tmp $@"
            ;;

        meowcoin)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-rpcuser=user -rpcpassword=pass -rpcallowip=127.0.0.1 -rpcbind=127.0.0.1 -rpcport=9766 $@"
            ;;

        monero)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d --data-dir ${nodeConfDir}/fullnodes/${FULLNODE} --non-interactive"
            CMD_ARGS="--daemon-address 127.0.0.1:18081 --disable-rpc-login --config-file ${nodeConfDir}/fullnodes/${FULLNODE}/monerod-wallet-rpc.conf --password-file ${nodeConfDir}/fullnodes/${FULLNODE}/monero_wallet/yomining.secret $@"
            ;;

        neoxa)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-rpcuser=user -rpcpassword=pass -rpcbind=0.0.0.0 -rpcport=9766 -rpcallowip=127.0.0.1 -rpcallowip=51.255.67.45 $@"
            ;;

        radiant)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-daemon -rpcuser=user -rpcpassword=pass -rpcallowip=127.0.0.1 -rpcallowip=51.255.67.45 -rpcbind=0.0.0.0 -rpcport=7332 $@"
            ;;

        raptoreum)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-rpcuser=user -rpcpassword=pass -rpcallowip=127.0.0.1 -rpcallowip=51.255.67.45 -rpcbind=0.0.0.0 -rpcport=10225 $@"
            ;;

        ravencoin)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-rpcuser=user -rpcpassword=pass -rpcbind=127.0.0.1 -rpcport=8766 -rpcallowip=127.0.0.1 -maxconnections=100 $@"
            ;;

        zcash)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-rpcuser=user -rpcpassword=pass -rpcallowip=127.0.0.1 -rpcbind=127.0.0.1 -rpcport=8232 $@"
            ;;

        *)
            echo "Error: unknown fullnode ${FULLNODE}"
            exit 1
            ;;
    esac


    if [ "$CMD_EXEC" != "" ]; then
        daemonStart "$DAEMON_NAME" "$CMD_EXEC $CMD_ARGS" "$DAEMON_OPTS"
        exit $?
    fi

    exit 1
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
    if [ "$FULLNODE" = "" ]; then
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.${FRM_MODULE}\.${FRM_PACKAGE}\.") |grep -e '\[free[m]ining.*\]' --color -B1
        exit $?
    fi

    daemonPidPs $DAEMON_NAME $DAEMON_OPTS
    exit $?
fi





usage

