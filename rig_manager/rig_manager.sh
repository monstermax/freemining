
##### START #####

OLD_PWD=$PWD
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

if [ "$CONFIG_FILE" = "" -o ! -f "$CONFIG_FILE" ]; then
    echo "Missing rig_manager.json configuration file"
    exit 1
fi


LOGS_DIR=$(eval echo `jq -r ".logsDir" ${CONFIG_FILE} 2>/dev/null`)

PIDS_DIR=$(eval echo `jq -r ".pidsDir" ${CONFIG_FILE} 2>/dev/null`)

MINERS_DIR=$(eval echo `jq -r ".minersDir" ${CONFIG_FILE} 2>/dev/null`)


if [ "$LOGS_DIR" = "" ]; then
    #echo "Missing logsDir parameter. Set it in rig_manager.json"
    #exit 1
    if isRoot; then
        LOGS_DIR="/var/log/freemining"
    else
        LOGS_DIR="~/.freemining/logs"
    fi
fi

if [ "$PIDS_DIR" = "" ]; then
    #echo "Missing pidsDir parameter. Set it in rig_manager.json"
    #exit 1
    if isRoot; then
        PIDS_DIR="/var/run/freemining"
    else
        PIDS_DIR="~/.freemining/pids"
    fi
fi

if [ "$MINERS_DIR" = "" ]; then
    echo "Missing minersDir parameter. Set it in rig_manager.json"
    exit 1
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



##### XXXX #####


if [ "$0" = "$BASH_SOURCE" ]; then

    function usage {
        echo "$0 [action] <params>"
        echo
        echo "  $0 service <params>"
        echo "  $0 txt-monitor"
        echo "  $0 json-monitor"
        echo "  $0 miner-install [miner]"
    }

    if [ "$1" = "service" ]; then
        shift
        ./tools/service.sh $@

    elif [ "$1" = "miner-install" ]; then
        shift
        ./tools/install_miner.sh $@

    elif [ "$1" = "json-monitor" ]; then
        shift
        ./tools/rig_monitor_json.sh $@

    elif [ "$1" = "txt-monitor" ]; then
        shift
        ./tools/rig_monitor_txt.sh $@

    else
        usage
    fi

fi


##### END #####

cd $OLD_PWD
