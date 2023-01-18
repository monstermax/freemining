
##### START #####

POOL_OLD_PWD=$PWD
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

CONFIG_FILE=$(realpath ./pool_manager.json)
POOL_APP_DIR=$(dirname $CONFIG_FILE)

if [ "$CONFIG_FILE" = "" -o ! -f "$CONFIG_FILE" ]; then
    echo "Missing pool_manager.json configuration file"
    exit 1
fi


USER_CONF_DIR=$(eval echo `jq -r ".userConfDir" ${CONFIG_FILE} 2>/dev/null`)

LOGS_DIR=$(eval echo `jq -r ".logsDir" ${CONFIG_FILE} 2>/dev/null`)

PIDS_DIR=$(eval echo `jq -r ".pidsDir" ${CONFIG_FILE} 2>/dev/null`)

NODES_DIR=$(eval echo `jq -r ".nodesDir" ${CONFIG_FILE} 2>/dev/null`)

POOLS_ENGINE_DIR=$(eval echo `jq -r ".poolsEngineDir" ${CONFIG_FILE} 2>/dev/null`)

POOLS_UI_DIR=$(eval echo `jq -r ".poolsUiDir" ${CONFIG_FILE} 2>/dev/null`)



if [ "$USER_CONF_DIR" = "" ]; then
    #echo "Missing userConfDir parameter. Set it in pool_manager.json"
    #exit 1

    if isRoot; then
        USER_CONF_DIR="/etc/freemining"
    else
        USER_CONF_DIR="~/.freemining"
    fi
fi


if [ "$LOGS_DIR" = "" ]; then
    #echo "Missing logsDir parameter. Set it in pool_manager.json"
    #exit 1

    if isRoot; then
        LOGS_DIR="/var/log/freemining"
    else
        LOGS_DIR="${USER_CONF_DIR}/logs"
    fi
fi

if [ "$PIDS_DIR" = "" ]; then
    #echo "Missing pidsDir parameter. Set it in pool_manager.json"
    #exit 1

    if isRoot; then
        PIDS_DIR="/var/run/freemining"
    else
        PIDS_DIR="${USER_CONF_DIR}/pids"
    fi
fi


if [ "$NODES_DIR" = "" ]; then
    #echo "Missing nodesDir parameter. Set it in pool_manager.json"
    #exit 1

    if isRoot; then
        NODES_DIR="/opt/freemining/fullnodes"
    else
        NODES_DIR="~/local/opt/freemining/fullnodes"
    fi
fi


if [ "$POOLS_ENGINE_DIR" = "" ]; then
    #echo "Missing poolsEngineDir parameter. Set it in pool_manager.json"
    #exit 1

    if isRoot; then
        POOLS_ENGINE_DIR="/opt/freemining/pools_engine"
    else
        POOLS_ENGINE_DIR="~/local/opt/freemining/pools_engine"
    fi
fi

if [ "$POOLS_UI_DIR" = "" ]; then
    #echo "Missing poolsUiDir parameter. Set it in pool_manager.json"
    #exit 1

    if isRoot; then
        POOLS_UI_DIR="/opt/freemining/pools_ui"
    else
        POOLS_UI_DIR="~/local/opt/freemining/pools_ui"
    fi
fi



##### FUNCTIONS #####




##### MAIN #####

if [ "$0" = "$BASH_SOURCE" ]; then

    function usage {
        echo "Usage:"
        echo "$0 [action] <params>"
        echo
        echo "$0 install"
        echo "$0 package-install <params>"
        echo "$0 fullnode-install [coin]"
        echo "$0 pools-engine #TODO"
        echo "$0 server #TODO"
        echo "$0 config-firewall #TODO"
    }

    if [ "$1" = "install" ]; then
        shift
        exec ./install_pool_manager.sh $@

    elif [ "$1" = "package-install" ]; then
        shift
        exec ./pools_manager/install_package.sh $@

    elif [ "$1" = "fullnode-install" ]; then
        shift
        exec ./tools/install_fullnode.sh $@

    elif [ "$1" = "pools-engine" ]; then
        shift
        exec ./pools_manager/miningcore/stop.sh
        exec ./pools_manager/miningcore/configure.sh
        exec ./pools_manager/miningcore/start.sh -bg -ts

    elif [ "$1" = "server" ]; then
        shift
        # TODO: run server nodejs (or use an external webserver like apache or nginx) to serve pools_ui static pages
        exec ./pool_server/server.sh -ts $@

    elif [ "$1" = "config-firewall" ]; then
        shift
        # TODO: add iptables rules for each stratum, rpc and/or daemons

    else
        usage
    fi

fi



##### END #####

cd $POOL_OLD_PWD

