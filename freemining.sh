#!/bin/bash

##### START #####

OLD_PWD=$PWD
cd `dirname $BASH_SOURCE`

CMD_ARGS=($@)

##### CONFIG #####

IP_CRYPTO="51.255.67.45"


NODE="/usr/bin/node"
TS_NODE="/usr/bin/node -r ts-node/register"
TSC="tsc"
USE_TS="1"

DAEMON_LOG_DIR=~/.freemining/log
DAEMON_PID_DIR=~/.freemining/run
DAEMON_USER=""
DAEMON_CHDIR=""
DAEMONER_CMD="/sbin/start-stop-daemon"

NO_COLOR="\e[0m"
COLOR_RED="\e[31m"
COLOR_GREEN="\e[32m"
COLOR_YELLOW="\e[33m"



CONFIG_FILE=$(realpath ./freemining.json)
frmAppDir=$(dirname $CONFIG_FILE)

if [ "$CONFIG_FILE" = "" -o ! -f "$CONFIG_FILE" ]; then
    echo "Missing freemining.json configuration file"
    exit 1
fi

frmConfDir=$(eval echo `jq -r ".frmConfDir" ${CONFIG_FILE} 2>/dev/null`)
frmLogDir=$(eval echo `jq -r ".frmLogDir" ${CONFIG_FILE} 2>/dev/null`)
frmPidDir=$(eval echo `jq -r ".frmPidDir" ${CONFIG_FILE} 2>/dev/null`)
frmDataDir=$(eval echo `jq -r ".frmDataDir" ${CONFIG_FILE} 2>/dev/null`)



if [ "$frmConfDir" = "" ]; then
    #echo "Missing frmConfDir parameter. Set it in rig_manager.json"
    #exit 1

    if isRoot; then
        frmConfDir="/etc/freemining"
    else
        frmConfDir="~/.freemining/conf"
    fi
fi

if [ "$frmLogDir" = "" ]; then
    #echo "Missing frmLogDir parameter. Set it in rig_manager.json"
    #exit 1

    if isRoot; then
        frmLogDir="/var/log/freemining"
    else
        frmLogDir="~/.freemining/log"
    fi
fi

if [ "$frmPidDir" = "" ]; then
    #echo "Missing frmPidDir parameter. Set it in rig_manager.json"
    #exit 1

    if isRoot; then
        frmPidDir="/var/run/freemining"
    else
        frmPidDir="~/.freemining/run"
    fi
fi

if [ "$frmDataDir" = "" ]; then
    #echo "Missing frmDataDir parameter. Set it in rig_manager.json"
    #exit 1

    if isRoot; then
        frmDataDir="/opt/freemining"
    else
        frmDataDir="~/local/share/freemining"
    fi
fi



##### FUNCTIONS #####

function getCmdPath {
    command -v $1
}


function rootRequired {
    echo "   [root required]"
    read -p "Press Enter to continue. CTRL+C to stop"
    sudo true
    echo "      => root acces granted"
}


function isRoot {
    if [ "$(id -u)" = "0" ]; then
        #echo 1
        return 0
    else
        #echo 0
        return 1
    fi
}


#function getConfDir {
#    coin=$1
#
#    if isRoot; then
#        CONF_DIR="/etc/freemining"
#    else
#        CONF_DIR="~/.freemining"
#    fi
#
#    echo $CONF_DIR
#}


function installBasicTools {
    INSTALLS=""
    if [ "`getCmdPath curl`" = "" ]; then
        INSTALLS="$INSTALLS curl"
    fi

    if [ "`getCmdPath wget`" = "" ]; then
        INSTALLS="$INSTALLS wget"
    fi

    if [ "`getCmdPath jq`" = "" ]; then
        INSTALLS="$INSTALLS jq"
    fi

    if [ "`getCmdPath bc`" = "" ]; then
        INSTALLS="$INSTALLS bc"
    fi

    if [ "`getCmdPath vim`" = "" ]; then
        INSTALLS="$INSTALLS vim"
    fi

    if [ "`getCmdPath /sbin/ifconfig`" = "" ]; then
        INSTALLS="$INSTALLS net-tools"
    fi

    if [ "$INSTALLS" != "" ]; then
        echo "Installing packages: $INSTALLS"
        rootRequired
        sudo apt-get install -y $INSTALLS
    fi
}



function installPhp {
    if [ "`getCmdPath php`" = "" ]; then
        # install NodeJS + NPM
        echo "Installing PHP"
        rootRequired
        sudo apt-get install -y php-cli
    fi
}


function installNodejs {
    if [ "`getCmdPath node`" = "" ]; then
        # install NodeJS + NPM
        echo "Installing NodeJS + NPM"
        rootRequired
        sudo apt-get install -y nodejs npm
    fi
}


function installNodejsPackages {
    if [ "`getCmdPath ts-node`" = "" ]; then
        # install typescript
        echo "Installing NPM packages: typescript"
        rootRequired
        sudo npm install -g typescript ts-node tslib @types/node
    fi
}


function hasOpt {
    key=$1
    if [[ " ${CMD_ARGS[*]} " =~ " ${key} " ]]; then
        # has opt
        return 0
    else
        # DO NOT has opt
        return 1
    fi
}

function getOpt {
    key=$1
    for i in "${!CMD_ARGS[@]}"; do
        if [[ "${CMD_ARGS[$i]}" = "${key}" ]]; then
            let $((j = i + 1))
            echo ${CMD_ARGS[$j]}
            break
        fi
    done
}

#function removeOpt {
#    echo $(echo $(echo " $1 " | sed -e "s# $2 # #"))
#
#    # use like this (to remove -ts from script arguments) :
#    # x=$@ ; set -- $(removeOpt "$x" "-ts")
#}



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

    tail -f $LOG_FILE $@
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

    tail -f /proc/$PID/fd/1
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

    CMD="$DAEMON_CMD $@"

    DAEMON_CHDIR=$PWD

    if test "$ACTION" = "debug"; then
        DAEMON_DRY=1
    fi

    daemonStart "$DAEMON_NAME" "$CMD" "$DAEMON_OPTS"
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


##### MAIN #####

if [ "$0" = "$BASH_SOURCE" ]; then

    if isRoot; then
        INSTALL_DIR=/usr/local/bin
    else
        INSTALL_DIR=~/.local/bin
    fi

    function usage {
        CMD=$(basename $BASH_SOURCE)

        echo "======================"
        echo "| ⛏️   FreeMining  ⛏️  |"
        echo "======================"
        echo

        echo "Usage:"
        echo
        echo "  $CMD [action] <params>"
        echo
        echo "  $CMD rig  <params>                # manage a mining rig"
        echo "  $CMD farm <params>                # manage a farm of mining rigs"
        echo "  $CMD node <params>                # manage local fullnodes"
        echo "  $CMD pool <params>                # manage a mining pool"
        echo
        echo "  $CMD bin-install                  # install freemining.sh to ${INSTALL_DIR}/frm"
        echo "  $CMD modules-install              # install all modules (rig, farm, node, pool)"
        echo "  $CMD compile                      # compile typescript for all modules"
        echo
        echo "  $CMD ps                           # show all running processes"
        echo "  $CMD update                       # update freemining to last version"
        echo
    }

    if [ "$1" = "rig" ]; then
        shift
        exec ./rig_manager/rig_manager.sh $@

    elif [ "$1" = "farm" ]; then
        shift
        exec ./farm_manager/farm_manager.sh $@

    elif [ "$1" = "pool" ]; then
        shift
        exec ./pool_manager/pool_manager.sh $@

    elif [ "$1" = "node" ]; then
        shift
        exec ./node_manager/node_manager.sh $@

    elif [ "$1" = "bin-install" ]; then
        PARENT_DIR=$(dirname $BASH_SOURCE)

        mkdir -p $INSTALL_DIR

        echo "#!/bin/bash

cd $(realpath $PARENT_DIR)
$0 \$@
" > ${INSTALL_DIR}/frm

        chmod +x ${INSTALL_DIR}/frm

    elif [ "$1" = "modules-install" ]; then
        shift

        echo "Install modules"

        INSTALL_LOG=/dev/null

        echo " - Installing rig_agent..."
        ./rig_manager/rig_agent/install_agent.sh >${INSTALL_LOG}

        echo " - Installing farm_server..."
        ./farm_manager/farm_server/install_webserver.sh >${INSTALL_LOG}

        echo " - Installing pool_server..."
        ./pool_manager/pool_server/install_webserver.sh >${INSTALL_LOG}

        echo " - Installing node_server..."
        ./node_manager/node_server/install_webserver.sh >${INSTALL_LOG}


    elif [ "$1" = "compile" ]; then
        shift

        echo "Compile typescript in each modules..."

        echo " - Compiling rig_agent..."
        cd rig_manager/rig_agent; tsc; cd ../..

        echo " - Compiling farm_webserver..."
        cd farm_manager/farm_webserver; tsc; cd ../..

        echo " - Compiling pool_webserver..."
        cd pool_manager/pool_webserver; tsc; cd ../..

        echo " - Compiling node_webserver..."
        cd pool_manager/node_webserver; tsc; cd ../..

    elif [ "$1" = "update" ]; then
        shift
        git pull
        $BASH_SOURCE modules-install

    elif [ "$1" = "ps" ]; then
        shift
        #ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.") |grep -e '\[free[m]ining.*\]' --color -B1

        echo "=============="
        echo "| FreeMining | ==> all processes"
        echo "=============="

        echo
        echo "==== RIG ===="
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.rig\.") |grep -e '\[free[m]ining.*\]' --color -B1 || echo "No process"

        echo
        echo "==== FARM ===="
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.farm\.") |grep -e '\[free[m]ining.*\]' --color -B1 || echo "No process"

        echo
        echo "==== NODE ===="
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.node\.") |grep -e '\[free[m]ining.*\]' --color -B1 || echo "No process"

        echo
        echo "==== POOL ===="
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.pool\.") |grep -e '\[free[m]ining.*\]' --color -B1 || echo "No process"
        echo

    else
        usage
    fi

fi


##### END #####

cd $OLD_PWD
