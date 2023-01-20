
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

RIG_CONFIG_FILE=$(realpath ./rig_manager.json)
rigAppDir=$(dirname $RIG_CONFIG_FILE)

if [ "$RIG_CONFIG_FILE" = "" -o ! -f "$RIG_CONFIG_FILE" ]; then
    echo "Missing rig_manager.json configuration file"
    exit 1
fi


rigConfDir=$(eval echo `jq -r ".rigConfDir" ${RIG_CONFIG_FILE} 2>/dev/null`)

rigLogDir=$(eval echo `jq -r ".rigLogDir" ${RIG_CONFIG_FILE} 2>/dev/null`)

rigPidDir=$(eval echo `jq -r ".rigPidDir" ${RIG_CONFIG_FILE} 2>/dev/null`)

rigDataDir=$(eval echo `jq -r ".rigDataDir" ${RIG_CONFIG_FILE} 2>/dev/null`)


minersDir=$(eval echo `jq -r ".minersDir" ${RIG_CONFIG_FILE} 2>/dev/null`)



if [ "$rigConfDir" = "" -o "$rigConfDir" = "null" ]; then
    rigConfDir=${frmConfDir}/${FRM_MODULE}
fi

if [ "$rigLogDir" = "" -o "$rigLogDir" = "null" ]; then
    rigLogDir=${frmLogDir}/${FRM_MODULE}
fi

if [ "$rigPidDir" = "" -o "$rigPidDir" = "null" ]; then
    rigPidDir=${frmPidDir}/${FRM_MODULE}
fi

if [ "$rigDataDir" = "" -o "$rigDataDir" = "null" ]; then
    rigDataDir=${frmDataDir}/${FRM_MODULE}
fi

if [ "$minersDir" = "" -o "$minersDir" = "null" ]; then
    minersDir=${rigDataDir}/miners
fi



CONFIGURED_MINERS=$(eval echo `jq -r ".miners | keys | join(\" \")" ${RIG_CONFIG_FILE} 2>/dev/null`)
INSTALLED_MINERS=$(find $minersDir -mindepth 1 -maxdepth 1 -type d 2>/dev/null | xargs -I '{}' basename {} | sort | tr "\n" " ")

DAEMON_LOG_DIR=$rigLogDir
DAEMON_PID_DIR=$rigPidDir
mkdir -p $DAEMON_LOG_DIR $DAEMON_PID_DIR

##### FUNCTIONS #####


function getMinerApiPort {
    miner=$1

    API_PORT=$(eval echo `jq -r ".miners.${miner}.api.port" ${RIG_CONFIG_FILE} 2>/dev/null`)

    if [ "$API_PORT" = "null" ]; then
        API_PORT=""
    fi

    echo $API_PORT
}



function getInstalledMiners {
    MINERS=$(echo $(ls $minersDir))
    echo $MINERS
}


function getAvailableMiners {
    MINERS=$(jq -r ".miners | keys | join(\" \")" $RIG_CONFIG_FILE)
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
        echo "  $CMD miner <params>              # start/stop ${FRM_MODULE} miners processes"
        echo "  $CMD agent <params>              # start/stop the ${FRM_MODULE} agent"
        echo
        echo "  $CMD ps                          # show ${FRM_MODULE} running processes"
        echo "  $CMD status                      # show ${FRM_MODULE} status"
        echo "  $CMD json                        # show ${FRM_MODULE} status (JSON formatted)"
        echo
        echo "  $CMD install                     # install ${FRM_MODULE} manager"
        echo "  $CMD miner-install [miner]       # install a miner"
        echo "  $CMD miner-uninstall [miner]     # uninstall a miner"
        echo
    }

    if [ "$1" = "install" ]; then
        shift
        exec ./tools/install_rig_manager.sh $@

    elif [ "$1" = "status" ]; then
        shift
        ./tools/rig_monitor_txt.sh

    elif [ "$1" = "miner" ]; then
        shift
        exec ./tools/run_miner.sh $@

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

        echo "Deleting binaries: ${minersDir}/${MINER}"
        echo "[Press Enter to continue]"
        read
        rm -rf ${minersDir}/${MINER}/

        echo "Deleting data & configuration: ${rigConfDir}/rig/miner/${MINER}"
        echo "[Press Enter to continue]"
        read
        rm -rf ${rigConfDir}/rig/miner/${MINER}/

    elif [ "$1" = "json" ]; then
        shift
        exec ./tools/rig_monitor_json.sh $@

    elif [ "$1" = "status" ]; then
        shift
        exec ./tools/rig_monitor_txt.sh $@

    elif [ "$1" = "config" ]; then
        shift
        exec ./tools/rig_config.sh $@

    elif [ "$1" = "agent" ]; then
        shift
        exec ./rig_agent/agent.sh $@

    elif [ "$1" = "ps" ]; then
        shift
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.${FRM_MODULE}\.") |grep -e '\[free[m]ining.*\]' --color -B1

    else
        usage
    fi

fi


##### END #####

cd $RIG_OLD_PWD
