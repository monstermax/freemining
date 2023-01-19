
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

POOL_CONFIG_FILE=$(realpath ./pool_manager.json)
poolAppDir=$(dirname $POOL_CONFIG_FILE)

if [ "$POOL_CONFIG_FILE" = "" -o ! -f "$POOL_CONFIG_FILE" ]; then
    echo "Missing pool_manager.json configuration file"
    exit 1
fi


poolConfDir=$(eval echo `jq -r ".poolConfDir" ${POOL_CONFIG_FILE} 2>/dev/null`)

poolLogDir=$(eval echo `jq -r ".poolLogDir" ${POOL_CONFIG_FILE} 2>/dev/null`)

poolPidDir=$(eval echo `jq -r ".poolPidDir" ${POOL_CONFIG_FILE} 2>/dev/null`)

poolsEngineDir=$(eval echo `jq -r ".poolsEngineDir" ${POOL_CONFIG_FILE} 2>/dev/null`)

poolsWebsitesDir=$(eval echo `jq -r ".poolsWebsitesDir" ${POOL_CONFIG_FILE} 2>/dev/null`)

poolDataDir=$(eval echo `jq -r ".poolDataDir" ${POOL_CONFIG_FILE} 2>/dev/null`)



if [ "$poolConfDir" = "" -o "$poolConfDir" = "null" ]; then
    poolConfDir=${frmConfDir}/${FRM_MODULE}
fi

if [ "$poolLogDir" = "" -o "$poolLogDir" = "null" ]; then
    poolLogDir=${frmLogDir}/${FRM_MODULE}
fi

if [ "$poolPidDir" = "" -o "$poolPidDir" = "null" ]; then
    poolPidDir=${frmPidDir}/${FRM_MODULE}
fi

if [ "$poolDataDir" = "" -o "$poolDataDir" = "null" ]; then
    poolDataDir=${frmDataDir}/${FRM_MODULE}
fi

if [ "$poolsEngineDir" = "" -o "$poolsEngineDir" = "null" ]; then
    poolsEngineDir="${poolDataDir}/engines"
fi

if [ "$poolsWebsitesDir" = "" -o "$poolsWebsitesDir" = "null" ]; then
    poolsWebsitesDir="${poolDataDir}/websites"
fi


DAEMON_LOG_DIR=$poolLogDir
DAEMON_PID_DIR=$poolPidDir
mkdir -p $DAEMON_LOG_DIR $DAEMON_PID_DIR

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
        echo "  $CMD miningcore <params>         # start/stop ${FRM_MODULE} miningcore"
        echo "  $CMD webserver  <params>         # start/stop the ${FRM_MODULE} webserver"
        echo
        echo "  $CMD install                     # install ${FRM_MODULE} manager"
        echo "  $CMD package-install <params>    # install a package (miningcore, miningcoreUi, miningcoreWebUI)"
        #echo "  $CMD config-firewall             # Not available. TODO"
        echo
    }

    if [ "$1" = "install" ]; then
        shift
        exec ./tools/install_pool_manager.sh $@

    elif [ "$1" = "package-install" ]; then
        shift
        exec ./pools_manager/install_package.sh $@

    elif [ "$1" = "miningcore" ]; then
        shift
        exec ./pools_manager/miningcore/miningcore.sh $@

    elif [ "$1" = "webserver" ]; then
        shift
        # run server nodejs (or use an external webserver like apache or nginx) to serve pools_ui static pages
        exec ./pool_server/webserver.sh $@

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

