
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
        echo "| FreeMining | ==> [FARM]"
        echo "=============="
        echo

        echo "Usage:"
        echo
        echo "  $CMD [action] <params>"
        echo
        echo "  $CMD install"
        echo "  $CMD server"
        echo
    }

    if [ "$1" = "install" ]; then
        shift
        exec ./install_farm_manager.sh $@

    elif [ "$1" = "server" ]; then
        shift
        exec ./farm_server/server.sh $@

    else
        usage
    fi

fi



##### END #####

cd $FARM_OLD_PWD

