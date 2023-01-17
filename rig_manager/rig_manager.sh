
##### START #####

RIG_OLD_PWD=$PWD
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

CONFIG_FILE=$(realpath ./rig_manager.json)
RIG_APP_DIR=$(dirname $CONFIG_FILE)

if [ "$CONFIG_FILE" = "" -o ! -f "$CONFIG_FILE" ]; then
    echo "Missing rig_manager.json configuration file"
    exit 1
fi


USER_CONF_DIR=$(eval echo `jq -r ".userConfDir" ${CONFIG_FILE} 2>/dev/null`)

LOGS_DIR=$(eval echo `jq -r ".logsDir" ${CONFIG_FILE} 2>/dev/null`)

PIDS_DIR=$(eval echo `jq -r ".pidsDir" ${CONFIG_FILE} 2>/dev/null`)

MINERS_DIR=$(eval echo `jq -r ".minersDir" ${CONFIG_FILE} 2>/dev/null`)



if [ "$USER_CONF_DIR" = "" ]; then
    #echo "Missing userConfDir parameter. Set it in rig_manager.json"
    #exit 1

    if isRoot; then
        USER_CONF_DIR="/etc/freemining"
    else
        USER_CONF_DIR="~/.freemining"
    fi
fi


if [ "$LOGS_DIR" = "" ]; then
    #echo "Missing logsDir parameter. Set it in rig_manager.json"
    #exit 1

    if isRoot; then
        LOGS_DIR="/var/log/freemining"
    else
        LOGS_DIR="${USER_CONF_DIR}/logs"
    fi
fi

if [ "$PIDS_DIR" = "" ]; then
    #echo "Missing pidsDir parameter. Set it in rig_manager.json"
    #exit 1

    if isRoot; then
        PIDS_DIR="/var/run/freemining"
    else
        PIDS_DIR="${USER_CONF_DIR}/pids"
    fi
fi

if [ "$MINERS_DIR" = "" ]; then
    #echo "Missing minersDir parameter. Set it in rig_manager.json"
    #exit 1

    if isRoot; then
        POOLS_UI_DIR="/opt/freemining/miners"
    else
        POOLS_UI_DIR="~/local/opt/freemining/miners"
    fi
fi



##### FUNCTIONS #####


function getMinerApiPort {
    miner=$1

    API_PORT=$(eval echo `jq -r ".miners.${miner}.api.port" ${CONFIG_FILE} 2>/dev/null`)

    if [ "$API_PORT" = "null" ]; then
        API_PORT=""
    fi

    echo $API_PORT
}



function getInstalledMiners {
    MINERS=$(echo $(ls $MINERS_DIR))
    echo $MINERS
}


function getAvailableMiners {
    MINERS=$(jq -r ".miners | keys | join(\" \")" $CONFIG_FILE)
    echo $MINERS
    # TODO: filtrer/conserver uniquement les miners installés (si inclus dans getInstalledMiners)
}



##### MAIN #####

if [ "$0" = "$BASH_SOURCE" ]; then

    function usage {
        echo "Usage:"
        echo "$0 [action] <params>"
        echo
        echo "$0 install"
        echo "$0 miner-install [miner]"
        echo "$0 service <params>"
        echo "$0 txt-monitor"
        echo "$0 json-monitor"
        echo "$0 agent"
    }

    if [ "$1" = "install" ]; then
        shift
        exec ./install_rig_manager.sh $@

    elif [ "$1" = "status" ]; then
        shift
        ./tools/rig_monitor_txt.sh

    elif [ "$1" = "service" ]; then
        shift
        exec ./tools/service.sh $@

    elif [ "$1" = "miner-install" ]; then
        shift
        exec ./tools/install_miner.sh $@

    elif [ "$1" = "json-monitor" ]; then
        shift
        exec ./tools/rig_monitor_json.sh $@

    elif [ "$1" = "txt-monitor" ]; then
        shift
        exec ./tools/rig_monitor_txt.sh $@

    elif [ "$1" = "agent" ]; then
        shift
        exec ./rig_agent/agent.sh $@

    else
        usage
    fi

fi


##### END #####

cd $RIG_OLD_PWD
