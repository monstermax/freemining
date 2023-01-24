#!/bin/bash


DAEMON_LOG_DIR=~/.freemining/log
DAEMON_PID_DIR=~/.freemining/run
DAEMON_USER=""
DAEMON_CHDIR=""
DAEMONER_CMD="/sbin/start-stop-daemon"



#### DAEMONS 1/3 ####


function daemonStart {
    # daemonStart depends on $DAEMON_PID_DIR and $DAEMON_LOG_DIR

    local DAEMON_NAME=$1
    local DAEMON_CMD=$2
    local DAEMON_BG=$3

    local DAEMON_CMD_WITHOUT_ARGS=$(echo $DAEMON_CMD | cut -d" " -f1)
    local DAEMON_FULLNAME="[${DAEMON_NAME}] ${DAEMON_CMD_WITHOUT_ARGS}"

    local DAEMON_OUTPUT=""

    local LOG_FILE=${DAEMON_LOG_DIR}/${DAEMON_NAME}.daemon.log
    local PID_FILE=${DAEMON_PID_DIR}/${DAEMON_NAME}.pid

    local DAEMONER_ARGS="--pidfile $PID_FILE --make-pidfile --remove-pidfile"
    #DAEMONER_ARGS="$DAEMONER_ARGS --quiet"

    if [ "$DAEMON_BG" = "bg" -o "$DAEMON_BG" = "background" -o "$DAEMON_BG" = "daemon" ]; then
        DAEMONER_ARGS="$DAEMONER_ARGS --background"
        DAEMON_OUTPUT=">$LOG_FILE 2>&1"
    fi

    if [ "$DAEMON_USER" != "" -a "$DAEMON_USER" != "$USER" ]; then
        DAEMONER_ARGS="$DAEMONER_ARGS --chuid $DAEMON_USER"
    fi

    if [ "$DAEMON_CHDIR" != "" ]; then
        DAEMONER_ARGS="$DAEMONER_ARGS --chdir $DAEMON_CHDIR"
    fi

    mkdir -p $DAEMON_LOG_DIR
    mkdir -p $DAEMON_PID_DIR

    if [ "$DAEMON_DRY" = "1" ]; then
        DAEMONER_CMD="echo ${DAEMONER_CMD}"
        echo "Debugging daemon command : $DAEMON_CMD"
        echo

    #else
        #echo "Starting daemon : $DAEMON_NAME"
    fi

    set +e

    ${DAEMONER_CMD} --start $DAEMONER_ARGS --startas \
        /bin/bash -- -c "exec -a \"$DAEMON_FULLNAME\" $DAEMON_CMD $DAEMON_OUTPUT"
    RC=$?

    set -e

    if [ "$DAEMON_DRY" = "1" ]; then
        RC=-1
        echo
    fi

    if [ "$RC" = "0" ]; then
        echo -e "${COLOR_GREEN}[INFO]${NO_COLOR} Daemon $DAEMON_NAME started"

    elif [ "$RC" = "1" ]; then
        echo -e "${COLOR_RED}[ERROR]${NO_COLOR} Daemon $DAEMON_NAME not started (nothing done)"

    elif [ "$RC" = "2" ]; then
        echo -e "${COLOR_RED}[ERROR]${NO_COLOR} Daemon $DAEMON_NAME not started (no reason)"

    elif [ "$RC" = "3" ]; then
        echo -e "${COLOR_RED}[ERROR]${NO_COLOR} Daemon $DAEMON_NAME not started"
    fi

    return $RC
}


function daemonStatus {
    # daemonStatus depends on $DAEMON_PID_DIR

    local DAEMON_NAME=$1
    local PID_FILE=${DAEMON_PID_DIR}/${DAEMON_NAME}.pid
    local DAEMONER_ARGS="--pidfile $PID_FILE --remove-pidfile"
    #DAEMONER_ARGS="$DAEMONER_ARGS --quiet"

    set +e

    ${DAEMONER_CMD} --status $DAEMONER_ARGS
    RC=$?

    set -e

    if [ "$RC" = "0" ]; then
        echo -e "${COLOR_GREEN}[INFO]${NO_COLOR} Daemon $DAEMON_NAME is running"

    elif [ "$RC" = "1" ]; then
        echo -e "${COLOR_RED}[ERROR]${NO_COLOR} Daemon $DAEMON_NAME is not running (but PID exists)"

    elif [ "$RC" = "2" ]; then
        echo -e "${COLOR_RED}[ERROR]${NO_COLOR} Daemon $DAEMON_NAME is not running"

    elif [ "$RC" = "3" ]; then
        echo -e "${COLOR_RED}[ERROR]${NO_COLOR} Daemon $DAEMON_NAME is unknown"
    fi

    return $RC
}


function daemonStop {
    # daemonStop depends on $DAEMON_PID_DIR

    local DAEMON_NAME=$1
    local PID_FILE=${DAEMON_PID_DIR}/${DAEMON_NAME}.pid
    local DAEMONER_ARGS="--pidfile $PID_FILE --remove-pidfile"
    #DAEMONER_ARGS="$DAEMONER_ARGS --quiet"

    set +e

    ${DAEMONER_CMD} --stop $DAEMONER_ARGS
    RC=$?

    set -e

    if [ "$RC" = "0" ]; then
        echo -e "${COLOR_GREEN}[INFO]${NO_COLOR} Daemon $DAEMON_NAME stopped"

    elif [ "$RC" = "1" ]; then
        echo -e "${COLOR_RED}[ERROR]${NO_COLOR} Daemon $DAEMON_NAME not stopped (nothing done)"

    elif [ "$RC" = "2" ]; then
        echo -e "${COLOR_RED}[ERROR]${NO_COLOR} Daemon $DAEMON_NAME not stopped (still running)"

    elif [ "$RC" = "3" ]; then
        echo -e "${COLOR_RED}[ERROR]${NO_COLOR} Daemon $DAEMON_NAME not stopped"
    fi

    return $RC
}


function daemonLog {
    # daemonLog depends on $DAEMON_LOG_DIR

    local DAEMON_NAME=$1
    local LOG_FILE=${DAEMON_LOG_DIR}/${DAEMON_NAME}.daemon.log
    shift || true

    if ! test -f $LOG_FILE; then
        echo "Error: log file do not exists"
        return 1
    fi

    tail $LOG_FILE $@
}


function daemonPidLog {
    # daemonLogPid depends on $DAEMON_PID_DIR

    local DAEMON_NAME=$1
    local PID_FILE=${DAEMON_PID_DIR}/${DAEMON_NAME}.pid
    local PID=$(cat $PID_FILE 2>/dev/null)

    if [ "$PID" = "" ]; then
        echo "Error: no PID found"
        return 1
    fi

    if ! test -d /proc/$PID; then
        echo "Error: PID found but proccess is not running"
        return 1
    fi

    tail /proc/$PID/fd/1
}


function daemonLogFile {
    # daemonLogFile depends on $DAEMON_PID_DIR
    local DAEMON_NAME=$1
    local LOG_FILE=${DAEMON_LOG_DIR}/${DAEMON_NAME}.daemon.log
    echo $LOG_FILE
}


function daemonPid {
    # daemonPid depends on $DAEMON_PID_DIR
    local DAEMON_NAME=$1
    local PID_FILE=${DAEMON_PID_DIR}/${DAEMON_NAME}.pid
    local PID=$(cat $PID_FILE 2>/dev/null)
    echo $PID
}


function daemonPidFile {
    # daemonPidFile depends on $DAEMON_PID_DIR
    local DAEMON_NAME=$1
    local PID_FILE=${DAEMON_PID_DIR}/${DAEMON_NAME}.pid
    echo $PID_FILE
}


function daemonPidPs {
    # daemonPidPs depends on $DAEMON_PID_DIR
    local DAEMON_NAME=$1
    local PID_FILE=${DAEMON_PID_DIR}/${DAEMON_NAME}.pid
    local PID=$(cat $PID_FILE 2>/dev/null)

    if [ "$PID" != "" ]; then
        ps -o pid,pcpu,pmem,user,command $PID |grep -e '\[free[m]ining.*\]' --color -B1
    fi
}


#### DAEMONS 2/3 ####


function do_start {
    local ACTION=$1
    shift || true

    DAEMON_OPTS=""

    if test "$ACTION" = "start" || test "$ACTION" = "restart" || test "$ACTION" = "debug"; then
        # set background
        DAEMON_OPTS="background"
    fi

    if [ "$DAEMON_NAME" = "" ]; then
        local DAEMON_NAME="freemining.anonymous"
    fi

    DAEMON_CHDIR=$PWD

    if test "$ACTION" = "debug"; then
        DAEMON_DRY=1
    fi

    daemonStart "$DAEMON_NAME" "$DAEMON_CMD $@" "$DAEMON_OPTS"
}

function do_stop {
    daemonStop "$DAEMON_NAME" "$@"
}

function do_status {
    daemonStatus "$DAEMON_NAME" "$@"
}

function do_log {
    shift || true
    daemonLog "$DAEMON_NAME" "$@"
}

function do_log_file {
    daemonLogFile "$DAEMON_NAME" "$@"
}

function do_pid {
    daemonPid "$DAEMON_NAME" "$@"
}

function do_pid_file {
    daemonPidFile "$DAEMON_NAME" "$@"
}

function do_pid_log {
    daemonPidLog "$DAEMON_NAME" "$@"
}

function do_ps {
    daemonPidPs "$DAEMON_NAME" "$@"
}



#### DAEMONS 3/3 ####


function daemon_manager {
    ACTION=$1

    # STOP
    if test "$ACTION" = "stop" || test "$ACTION" = "restart"; then
        do_stop $@
        RC=$?

        if test "$ACTION" = "stop"; then
            exit $RC
        fi
    fi

    # START
    if test "$ACTION" = "run" || test "$ACTION" = "start" || test "$ACTION" = "restart" || test "$ACTION" = "debug"; then
        do_start $@
        exit $?
    fi

    # STATUS
    if test "$ACTION" = "status"; then
        do_status $@
        exit $?
    fi

    # LOG
    if test "$ACTION" = "log"; then
        do_log $@
        exit $?
    fi

    # LOG-FILE
    if test "$ACTION" = "log-file"; then
        do_log_file $@
        exit $?
    fi

    # PID
    if test "$ACTION" = "pid"; then
        do_pid $@
        exit $?
    fi

    # PID-FILE
    if test "$ACTION" = "pid-file"; then
        do_pid_file $@
        exit $?
    fi

    # PID-LOG
    if test "$ACTION" = "pid-log"; then
        do_pid_log $@
        exit $?
    fi

    # PS
    if test "$ACTION" = "ps"; then
        do_ps $@
        exit $?
    fi

}
