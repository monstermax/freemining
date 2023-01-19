
##### START #####

NODE_OLD_PWD=$PWD
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

FRM_MODULE="fullnode"

NODE_CONFIG_FILE=$(realpath ./fullnode_manager.json)
NODE_APP_DIR=$(dirname $NODE_CONFIG_FILE)

if [ "$NODE_CONFIG_FILE" = "" -o ! -f "$NODE_CONFIG_FILE" ]; then
    echo "Missing fullnode_manager.json configuration file"
    exit 1
fi


nodeConfDir=$(eval echo `jq -r ".nodeConfDir" ${NODE_CONFIG_FILE} 2>/dev/null`)

nodeLogDir=$(eval echo `jq -r ".nodeLogDir" ${NODE_CONFIG_FILE} 2>/dev/null`)

nodePidDir=$(eval echo `jq -r ".nodePidDir" ${NODE_CONFIG_FILE} 2>/dev/null`)

nodeDataDir=$(eval echo `jq -r ".nodeDataDir" ${NODE_CONFIG_FILE} 2>/dev/null`)

fullnodesDir=$(eval echo `jq -r ".fullnodesDir" ${NODE_CONFIG_FILE} 2>/dev/null`)



if [ "$nodeConfDir" = "" ]; then
    nodeConfDir=${frmConfDir}/${FRM_MODULE}
fi

if [ "$nodeLogDir" = "" ]; then
    nodeLogDir=${frmLogDir}/${FRM_MODULE}
fi

if [ "$nodePidDir" = "" ]; then
    nodePidDir=${frmPidDir}/${FRM_MODULE}
fi

if [ "$nodeDataDir" = "" ]; then
    nodeDataDir=${frmDataDir}/${FRM_MODULE}
fi


if [ "$fullnodesDir" = "" ]; then
    fullnodesDir="${nodeDataDir}/fullnodes"
fi




CONFIGURED_FULLNODES=$(eval echo `jq -r ".fullnodes | keys | join(\" \")" ${NODE_CONFIG_FILE} 2>/dev/null`)
INSTALLED_FULLNODES=$(find $fullnodesDir -mindepth 1 -maxdepth 1 -type d 2>/dev/null | xargs -I '{}' basename {} | sort | tr "\n" " ")

DAEMON_LOG_DIR=$nodeLogDir
DAEMON_PID_DIR=$nodePidDir

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
        echo "  $CMD ps                          # show ${FRM_MODULE} running processes"
        echo
        echo "  $CMD node <params>               # start/stop a fullnode"
        echo
        echo "  $CMD install                     # install ${FRM_MODULE} manager"
        echo "  $CMD node-install [chain]    # install a fullnode"
        echo "  $CMD node-uninstall [chain]  # install a fullnode"
        #echo "  $CMD config-firewall             # Not available. TODO"
        echo
    }

    if [ "$1" = "install" ]; then
        shift
        exec ./install_fullnode_manager.sh $@

    elif [ "$1" = "node" ]; then
        shift
        exec ./tools/fullnode.sh $@

    elif [ "$1" = "node-install" ]; then
        shift
        exec ./tools/install_fullnode.sh $@

    elif [ "$1" = "node-uninstall" ]; then
        FULLNODE=$2
        if [ "$FULLNODE" = "" ]; then
            usage
            exit 1
        fi

        echo "Uninstalling fullnode ${FULLNODE}..."
        echo

        echo "Deleting binaries: ${fullnodesDir}/${FULLNODE}"
        echo "[Press Enter to continue]"
        read
        rm -rf ${fullnodesDir}/${FULLNODE}/

        echo "Deleting data & configuration: ${nodeConfDir}/fullnode/${FULLNODE}"
        echo "[Press Enter to continue]"
        read
        rm -rf ${nodeConfDir}/fullnode/${FULLNODE}/

    elif [ "$1" = "fullnode" ]; then
        shift
        exec ./tools/fullnode.sh $@

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

cd $NODE_OLD_PWD

