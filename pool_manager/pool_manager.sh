
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

FRM_MODULE="pool"

DAEMON_LOG_DIR=~/.freemining/log/${FRM_MODULE}
DAEMON_PID_DIR=~/.freemining/run/${FRM_MODULE}

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

CONFIGURED_FULLNODES=$(eval echo `jq -r ".fullnodes | keys | join(\" \")" ${CONFIG_FILE} 2>/dev/null`)

INSTALLED_FULLNODES=$(find $NODES_DIR -mindepth 1 -maxdepth 1 -type d 2>/dev/null | xargs -I '{}' basename {} | sort | tr "\n" " ")


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
        echo "  $CMD package-install <params>    # install a package (miningcore, miningcoreUi, miningcoreWebUI)"
        echo "  $CMD fullnode-install [chain]    # install a fullnode"
        echo "  $CMD fullnode-uninstall [chain]  # install a fullnode"
        echo
        echo "  $CMD ps                          # show ${FRM_MODULE} running processes"
        echo
        echo "  $CMD fullnode                    # start/stop a fullnode"
        echo "  $CMD miningcore                  # start/stop ${FRM_MODULE} miningcore"
        echo "  $CMD webserver                   # start/stop the ${FRM_MODULE} webserver"
        echo
        echo "  $CMD config-firewall             # Not available. TODO"
        echo
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

    elif [ "$1" = "fullnode-uninstall" ]; then
        FULLNODE=$2
        if [ "$FULLNODE" = "" ]; then
            usage
            exit 1
        fi

        echo "Uninstalling fullnode ${FULLNODE}..."
        echo

        echo "Deleting binaries: ${NODES_DIR}/${FULLNODE}"
        echo "[Press Enter to continue]"
        read
        rm -rf ${NODES_DIR}/${FULLNODE}/

        echo "Deleting data & configuration: ${USER_CONF_DIR}/pool/fullnode/${FULLNODE}"
        echo "[Press Enter to continue]"
        read
        rm -rf ${USER_CONF_DIR}/pool/fullnode/${FULLNODE}/

    elif [ "$1" = "fullnode" ]; then
        shift
        exec ./tools/fullnode.sh $@

    elif [ "$1" = "miningcore" ]; then
        shift
        exec ./pools_manager/miningcore/miningcore.sh $@

    elif [ "$1" = "webserver" ]; then
        shift
        # run server nodejs (or use an external webserver like apache or nginx) to serve pools_ui static pages
        exec ./pool_server/server.sh $@

    elif [ "$1" = "ps" ]; then
        shift
        #pgrep -fa "\[freemining\.${FRM_MODULE}\." |grep -e '\[free[m]ining.*\]' --color
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.${FRM_MODULE}\.") |grep -e '\[free[m]ining.*\]' --color -B1

    elif [ "$1" = "config-firewall" ]; then
        shift
        # TODO: add iptables rules for each stratum, rpc and/or daemons

    else
        usage
    fi

fi



##### END #####

cd $POOL_OLD_PWD

