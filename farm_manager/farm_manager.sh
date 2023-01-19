
##### START #####

FARM_OLD_PWD=$PWD
cd `dirname $BASH_SOURCE`

SOURCE_PWD=$PWD
source ../freemining.sh
cd $SOURCE_PWD


##### CHECK JQ #####

if [ "$(command -v jq)" = "" ]; then
    echo "jq is missing"
    rootRequired
    sudo apt-get install -y jq
fi


##### CONFIG #####

FRM_MODULE="farm"

DAEMON_LOG_DIR=~/.freemining/log/${FRM_MODULE}
DAEMON_PID_DIR=~/.freemining/run/${FRM_MODULE}

CONFIG_FILE=$(realpath ./farm_manager.json)
FARM_APP_DIR=$(dirname $CONFIG_FILE)

if [ "$CONFIG_FILE" = "" -o ! -f "$CONFIG_FILE" ]; then
    echo "Missing farm_manager.json configuration file"
    exit 1
fi


USER_CONF_DIR=$(eval echo `jq -r ".userConfDir" ${CONFIG_FILE} 2>/dev/null`)

LOGS_DIR=$(eval echo `jq -r ".logsDir" ${CONFIG_FILE} 2>/dev/null`)

PIDS_DIR=$(eval echo `jq -r ".pidsDir" ${CONFIG_FILE} 2>/dev/null`)



if [ "$USER_CONF_DIR" = "" ]; then
    #echo "Missing userConfDir parameter. Set it in farm_manager.json"
    #exit 1

    if isRoot; then
        USER_CONF_DIR="/etc/freemining"
    else
        USER_CONF_DIR="~/.freemining"
    fi
fi


if [ "$LOGS_DIR" = "" ]; then
    #echo "Missing logsDir parameter. Set it in farm_manager.json"
    #exit 1

    if isRoot; then
        LOGS_DIR="/var/log/freemining"
    else
        LOGS_DIR="${USER_CONF_DIR}/logs"
    fi
fi


if [ "$PIDS_DIR" = "" ]; then
    #echo "Missing pidsDir parameter. Set it in farm_manager.json"
    #exit 1

    if isRoot; then
        PIDS_DIR="/var/run/freemining"
    else
        PIDS_DIR="${USER_CONF_DIR}/pids"
    fi
fi



##### FUNCTIONS #####




##### MAIN #####

if [ "$0" = "$BASH_SOURCE" ]; then

    function usage {
        CMD=$(basename $BASH_SOURCE)

        echo "=============="
        echo "| FreeMining | ==> [${FRM_MODULE^^}]"
        echo "=============="
        echo

        echo "Usage:"
        echo
        echo "  $CMD [action] <params>"
        echo
        echo "  $CMD install                     # install ${FRM_MODULE} manager"
        echo
        echo "  $CMD rigs                        # show rigs list"
        echo
        echo "  $CMD ps                          # show ${FRM_MODULE} running processes"
        echo "  $CMD json                        # show ${FRM_MODULE} status (JSON formatted)"
        echo
        echo "  $CMD webserver                   # start/stop the ${FRM_MODULE} websocket & web servers"
        echo
    }

    if [ "$1" = "install" ]; then
        shift
        exec ./install_farm_manager.sh $@

    elif [ "$1" = "json" ]; then
        shift
        wget -qO- http://localhost:4200/status.json

    elif [ "$1" = "webserver" ]; then
        shift
        exec ./farm_server/server.sh $@

    elif [ "$1" = "rigs" ]; then
        shift
        wget -qO- http://localhost:4200/status.json | jq -r ". | keys | join(\" \")"

    elif [ "$1" = "ps" ]; then
        shift
        #pgrep -fa "\[freemining\.${FRM_MODULE}\." |grep -e '\[free[m]ining.*\]' --color
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.${FRM_MODULE}\.") |grep -e '\[free[m]ining.*\]' --color -B1

    else
        usage
    fi

fi



##### END #####

cd $FARM_OLD_PWD

