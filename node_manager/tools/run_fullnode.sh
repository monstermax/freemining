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


    CMD_EXEC=""
    CMD_ARGS=""

    # TODO: remplacer/modifier le case par des appels de fonctions 'run_{fullnode}' (comme pour les installs)

    case "$FULLNODE" in

        bitcoin)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-server -rpcuser=user -rpcpassword=pass -rpcbind=0.0.0.0 -rpcport=8332 -rpcallowip=127.0.0.1 -rpcallowip=${IP_CRYPTO} -port=8333 $@"
            ;;

        bitcoincash)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/bitcoind -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-server -rpcuser=user -rpcpassword=pass -rpcbind=0.0.0.0 -rpcport=8332 -rpcallowip=127.0.0.1 -rpcallowip=${IP_CRYPTO} -port=8333 $@"
            ;;

        bitcoinsv)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/bitcoind -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-server -rpcuser=user -rpcpassword=pass -rpcbind=0.0.0.0 -rpcport=8332 -rpcallowip=127.0.0.1 -rpcallowip=${IP_CRYPTO} -port=8333 $@"
            # TODO
            ;;

        callisto)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/geth-linux-amd64 --datadir ${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="--port 30303 --http.addr 0.0.0.0 --http.port 8545 --ws.addr 0.0.0.0 --ws.port 8546 $@"
            ;;

        cosmos)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/gaiad"
            CMD_ARGS="$@"
            # TODO
            ;;

        dogecoin)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE} -printtoconsole"
            CMD_ARGS="-server -rpcuser=user -rpcpassword=pass -rpcbind=0.0.0.0 -rpcport=22555 -rpcallowip=127.0.0.1 -rpcallowip=${IP_CRYPTO} -port=22556 $@"
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
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE} -printtoconsole"
            CMD_ARGS="-server -rpcuser=user -rpcpassword=pass -rpcbind=0.0.0.0 -rpcport=8888 -rpcallowip=127.0.0.1 -rpcallowip=${IP_CRYPTO} -port=8168 $@"
            ;;

        flux)
            CMD_EXEC="zelcashd -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-rpcuser=user -rpcpassword=pass -rpcport=16124 -rpcallowip=127.0.0.1 -rpcallowip=${IP_CRYPTO} -port=16125 $@"
            ;;

        kadena)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/chainweb-node --database-directory ${nodeConfDir}/fullnodes/${FULLNODE} --config-file ${nodeConfDir}/fullnodes/${FULLNODE}/kadena.conf"
            CMD_ARGS="$@"
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
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE} -printtoconsole"
            CMD_ARGS="-rpcuser=user -rpcpassword=pass -rpcallowip=127.0.0.1 -rpcbind=127.0.0.1 -rpcport=9766 $@"
            ;;

        monero)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d --data-dir ${nodeConfDir}/fullnodes/${FULLNODE} --non-interactive"
            CMD_ARGS="--daemon-address 127.0.0.1:18081 --disable-rpc-login --config-file ${nodeConfDir}/fullnodes/${FULLNODE}/monerod-wallet-rpc.conf --password-file ${nodeConfDir}/fullnodes/${FULLNODE}/monero_wallet/yomining.secret $@"
            ;;

        neoxa)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE} -printtoconsole"
            CMD_ARGS="-rpcuser=user -rpcpassword=pass -rpcbind=0.0.0.0 -rpcport=9766 -rpcallowip=127.0.0.1 -rpcallowip=51.255.67.45 $@"
            ;;

        nervos)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/ckb run -C ${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="$@"
            ;;

        radiant)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-daemon -rpcuser=user -rpcpassword=pass -rpcallowip=127.0.0.1 -rpcallowip=51.255.67.45 -rpcbind=0.0.0.0 -rpcport=7332 $@"
            ;;

        raptoreum)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE} -printtoconsole"
            CMD_ARGS="-rpcuser=user -rpcpassword=pass -rpcallowip=127.0.0.1 -rpcallowip=51.255.67.45 -rpcbind=0.0.0.0 -rpcport=10225 $@"
            ;;

        ravencoin)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/${FULLNODE}d -datadir=${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="-rpcuser=user -rpcpassword=pass -rpcbind=127.0.0.1 -rpcport=8766 -rpcallowip=127.0.0.1 -maxconnections=100 $@"
            ;;

        siacoin)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/siad --sia-directory ${nodeConfDir}/fullnodes/${FULLNODE}"
            CMD_ARGS="--rpc-addr 127.0.0.1:9981 $@"
            ;;

        solana)
            CMD_EXEC="${fullnodesDir}/${FULLNODE}/bin/solana-validator"
            CMD_ARGS="--ful-rpc-apî --rpc-bind-address 127.0.0.1 --rpc-port 9981 $@"
            ;;

        tron)
            CMD_EXEC="java -Xmx24g -XX:+UseConcMarkSweepGC -jar ${fullnodesDir}/${FULLNODE}/Fullnode.jar -c ${nodeConfDir}/fullnodes/${FULLNODE}/main_net_config.conf"
            CMD_ARGS="$@"
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
        daemonStart "$DAEMON_NAME" "$CMD_EXEC $CMD_ARGS" "$DAEMON_OPTS" $@
        exit $?
    fi

    exit 1
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

