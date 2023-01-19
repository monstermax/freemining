
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

FRM_MODULE="rig"

DAEMON_LOG_DIR=~/.freemining/log/${FRM_MODULE}
DAEMON_PID_DIR=~/.freemining/run/${FRM_MODULE}


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

CONFIGURED_MINERS=$(eval echo `jq -r ".miners | keys | join(\" \")" ${CONFIG_FILE} 2>/dev/null`)

INSTALLED_MINERS=$(find $MINERS_DIR -mindepth 1 -maxdepth 1 -type d 2>/dev/null | xargs -I '{}' basename {} | sort | tr "\n" " ")



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
        echo "  $CMD miner-install [miner]       # install a miner"
        echo "  $CMD miner-uninstall [miner]     # uninstall a miner"
        echo
        echo "  $CMD miner <params>              # manage ${FRM_MODULE} miners processes"
        echo
        echo "  $CMD ps                          # show ${FRM_MODULE} running processes"
        echo "  $CMD status                      # show ${FRM_MODULE} status"
        echo "  $CMD json                        # show ${FRM_MODULE} status (JSON formatted)"
        echo
        echo "  $CMD agent                       # start/stop the ${FRM_MODULE} agent"
        echo
    }

    if [ "$1" = "install" ]; then
        shift
        exec ./install_rig_manager.sh $@

    elif [ "$1" = "status" ]; then
        shift
        ./tools/rig_monitor_txt.sh

    elif [ "$1" = "miner" ]; then
        shift
        exec ./tools/miner.sh $@

    elif [ "$1" = "miner-install" ]; then
        shift
        exec ./tools/install_miner.sh $@

    elif [ "$1" = "miner-uninstall" ]; then
        MINER=$2
        if [ "$MINER" = "" ]; then
            usage
            exit 1
        fi

        echo "Uninstalling miner ${MINER}..."
        echo

        echo "Deleting binaries: ${MINERS_DIR}/${MINER}"
        echo "[Press Enter to continue]"
        read
        rm -rf ${MINERS_DIR}/${MINER}/

        echo "Deleting data & configuration: ${USER_CONF_DIR}/rig/miner/${MINER}"
        echo "[Press Enter to continue]"
        read
        rm -rf ${USER_CONF_DIR}/rig/miner/${MINER}/

    elif [ "$1" = "json" ]; then
        shift
        exec ./tools/rig_monitor_json.sh $@

    elif [ "$1" = "status" ]; then
        shift
        exec ./tools/rig_monitor_txt.sh $@

    elif [ "$1" = "agent" ]; then
        shift
        exec ./rig_agent/agent.sh $@

    elif [ "$1" = "ps" ]; then
        shift
        #pgrep -fa "\[freemining\.${FRM_MODULE}\." |grep -e '\[free[m]ining.*\]' --color
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.${FRM_MODULE}\.") |grep -e '\[free[m]ining.*\]' --color -B1

    else
        usage
    fi

fi


##### END #####

cd $RIG_OLD_PWD
