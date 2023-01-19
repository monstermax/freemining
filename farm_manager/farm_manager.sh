
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

FARM_CONFIG_FILE=$(realpath ./farm_manager.json)
farmAppDir=$(dirname $FARM_CONFIG_FILE)

if [ "$FARM_CONFIG_FILE" = "" -o ! -f "$FARM_CONFIG_FILE" ]; then
    echo "Missing farm_manager.json configuration file"
    exit 1
fi


farmConfDir=$(eval echo `jq -r ".farmConfDir" ${FARM_CONFIG_FILE} 2>/dev/null`)

farmLogDir=$(eval echo `jq -r ".farmLogDir" ${FARM_CONFIG_FILE} 2>/dev/null`)

farmPidDir=$(eval echo `jq -r ".farmPidDir" ${FARM_CONFIG_FILE} 2>/dev/null`)

farmDataDir=$(eval echo `jq -r ".farmDataDir" ${FARM_CONFIG_FILE} 2>/dev/null`)


if [ "$farmConfDir" = "" -o "$farmConfDir" = "null" ]; then
    farmConfDir=${frmConfDir}/${FRM_MODULE}
fi

if [ "$farmLogDir" = "" -o "$farmLogDir" = "null" ]; then
    farmLogDir=${frmLogDir}/${FRM_MODULE}
fi

if [ "$farmPidDir" = "" -o "$farmPidDir" = "null" ]; then
    farmPidDir=${frmPidDir}/${FRM_MODULE}
fi

if [ "$farmDataDir" = "" -o "$farmDataDir" = "null" ]; then
    farmDataDir=${frmDataDir}/${FRM_MODULE}
fi


DAEMON_LOG_DIR=$farmLogDir
DAEMON_PID_DIR=$farmPidDir
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
        echo "  $CMD webserver <params>          # start/stop the ${FRM_MODULE} websocket & web servers"
        echo
        echo "  $CMD rigs                        # show ${FRM_MODULE} rigs list"
        echo "  $CMD json                        # show ${FRM_MODULE} status (JSON formatted)"
        echo
        echo "  $CMD install                     # install ${FRM_MODULE} manager"
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

