#!/bin/bash

##### START #####

OLD_PWD=$PWD
cd `dirname $BASH_SOURCE`

CMD_ARGS=($@)

source ./common/bash/daemon.sh

##### CONFIG #####

IP_CRYPTO="51.255.67.45"


NODE="/usr/bin/node"
TS_NODE="/usr/bin/node -r ts-node/register"
TSC="tsc"
USE_TS="1"


NO_COLOR="\e[0m"
COLOR_RED="\e[31m"
COLOR_GREEN="\e[32m"
COLOR_YELLOW="\e[33m"



CONFIG_FILE=$(realpath ./freemining.json)
frmAppDir=$(dirname $CONFIG_FILE)

if [ "$CONFIG_FILE" = "" -o ! -f "$CONFIG_FILE" ]; then
    echo "Missing freemining.json configuration file"
    exit 1
fi

frmConfDir=$(eval echo `jq -r ".frmConfDir" ${CONFIG_FILE} 2>/dev/null`)
frmLogDir=$(eval echo `jq -r ".frmLogDir" ${CONFIG_FILE} 2>/dev/null`)
frmPidDir=$(eval echo `jq -r ".frmPidDir" ${CONFIG_FILE} 2>/dev/null`)
frmDataDir=$(eval echo `jq -r ".frmDataDir" ${CONFIG_FILE} 2>/dev/null`)



if [ "$frmConfDir" = "" ]; then
    #echo "Missing frmConfDir parameter. Set it in rig_manager.json"
    #exit 1

    if isRoot; then
        frmConfDir="/etc/freemining"
    else
        frmConfDir="~/.freemining/conf"
    fi
fi

if [ "$frmLogDir" = "" ]; then
    #echo "Missing frmLogDir parameter. Set it in rig_manager.json"
    #exit 1

    if isRoot; then
        frmLogDir="/var/log/freemining"
    else
        frmLogDir="~/.freemining/log"
    fi
fi

if [ "$frmPidDir" = "" ]; then
    #echo "Missing frmPidDir parameter. Set it in rig_manager.json"
    #exit 1

    if isRoot; then
        frmPidDir="/var/run/freemining"
    else
        frmPidDir="~/.freemining/run"
    fi
fi

if [ "$frmDataDir" = "" ]; then
    #echo "Missing frmDataDir parameter. Set it in rig_manager.json"
    #exit 1

    if isRoot; then
        frmDataDir="/opt/freemining"
    else
        frmDataDir="~/local/share/freemining"
    fi
fi



##### FUNCTIONS #####

function getCmdPath {
    command -v $1
}


function rootRequired {
    echo "   [root required]"
    read -p "Press Enter to continue. CTRL+C to stop"
    sudo true
    echo "      => root acces granted"
}


function isRoot {
    if [ "$(id -u)" = "0" ]; then
        #echo 1
        return 0
    else
        #echo 0
        return 1
    fi
}


#function getConfDir {
#    coin=$1
#
#    if isRoot; then
#        CONF_DIR="/etc/freemining"
#    else
#        CONF_DIR="~/.freemining"
#    fi
#
#    echo $CONF_DIR
#}


function installBasicTools {
    INSTALLS=""
    if [ "`getCmdPath curl`" = "" ]; then
        INSTALLS="$INSTALLS curl"
    fi

    if [ "`getCmdPath wget`" = "" ]; then
        INSTALLS="$INSTALLS wget"
    fi

    if [ "`getCmdPath jq`" = "" ]; then
        INSTALLS="$INSTALLS jq"
    fi

    if [ "`getCmdPath bc`" = "" ]; then
        INSTALLS="$INSTALLS bc"
    fi

    if [ "`getCmdPath vim`" = "" ]; then
        INSTALLS="$INSTALLS vim"
    fi

    if [ "`getCmdPath /sbin/ifconfig`" = "" ]; then
        INSTALLS="$INSTALLS net-tools"
    fi

    if [ "$INSTALLS" != "" ]; then
        echo "Installing packages: $INSTALLS"
        rootRequired
        sudo apt-get install -y $INSTALLS
    fi
}



function installPhp {
    if [ "`getCmdPath php`" = "" ]; then
        # install NodeJS + NPM
        echo "Installing PHP"
        rootRequired
        sudo apt-get install -y php-cli
    fi
}


function installNodejs {
    if [ "`getCmdPath node`" = "" ]; then
        # install NodeJS + NPM
        echo "Installing NodeJS + NPM"
        rootRequired
        sudo apt-get install -y nodejs npm
    fi
}


function installNodejsPackages {
    if [ "`getCmdPath ts-node`" = "" ]; then
        # install typescript
        echo "Installing NPM packages: typescript"
        rootRequired
        sudo npm install -g typescript ts-node tslib @types/node
    fi
}


function hasOpt {
    key=$1
    if [[ " ${CMD_ARGS[*]} " =~ " ${key} " ]]; then
        # has opt
        return 0
    else
        # DO NOT has opt
        return 1
    fi
}

function getOpt {
    key=$1
    for i in "${!CMD_ARGS[@]}"; do
        if [[ "${CMD_ARGS[$i]}" = "${key}" ]]; then
            let $((j = i + 1))
            echo ${CMD_ARGS[$j]}
            break
        fi
    done
}

#function removeOpt {
#    echo $(echo $(echo " $1 " | sed -e "s# $2 # #"))
#
#    # use like this (to remove -ts from script arguments) :
#    # x=$@ ; set -- $(removeOpt "$x" "-ts")
#}




##### MAIN #####

if [ "$0" = "$BASH_SOURCE" ]; then

    if isRoot; then
        INSTALL_DIR=/usr/local/bin
    else
        INSTALL_DIR=~/.local/bin
    fi

    function usage {
        CMD=$(basename $BASH_SOURCE)

        echo "======================"
        echo "| ⛏️   FreeMining  ⛏️  |"
        echo "======================"
        echo

        echo "Usage:"
        echo
        echo "  $CMD [action] <params>"
        echo
        echo "  $CMD rig  <params>                # manage a mining rig"
        echo "  $CMD farm <params>                # manage a farm of mining rigs"
        echo "  $CMD node <params>                # manage local fullnodes"
        echo "  $CMD pool <params>                # manage a mining pool"
        echo
        echo "  $CMD bin-install                  # install freemining.sh to ${INSTALL_DIR}/frm"
        echo "  $CMD modules-install              # install all modules (rig, farm, node, pool)"
        echo "  $CMD compile                      # compile typescript for all modules"
        echo
        echo "  $CMD ps                           # show all running processes"
        echo "  $CMD update                       # update freemining to last version"
        echo
    }

    if [ "$1" = "rig" ]; then
        shift
        exec ./rig_manager/rig_manager.sh $@

    elif [ "$1" = "farm" ]; then
        shift
        exec ./farm_manager/farm_manager.sh $@

    elif [ "$1" = "pool" ]; then
        shift
        exec ./pool_manager/pool_manager.sh $@

    elif [ "$1" = "node" ]; then
        shift
        exec ./node_manager/node_manager.sh $@

    elif [ "$1" = "bin-install" ]; then
        PARENT_DIR=$(dirname $BASH_SOURCE)

        mkdir -p $INSTALL_DIR

        echo "#!/bin/bash

cd $(realpath $PARENT_DIR)
$0 \$@
" > ${INSTALL_DIR}/frm

        chmod +x ${INSTALL_DIR}/frm

    elif [ "$1" = "modules-install" ]; then
        shift

        echo "Install modules"

        INSTALL_LOG=/dev/null

        echo " - Installing rig_agent..."
        ./rig_manager/rig_agent/install_agent.sh >${INSTALL_LOG}

        echo " - Installing farm_server..."
        ./farm_manager/farm_webserver/install_webserver.sh >${INSTALL_LOG}

        echo " - Installing pool_server..."
        ./pool_manager/pool_webserver/install_webserver.sh >${INSTALL_LOG}

        echo " - Installing node_server..."
        ./node_manager/node_webserver/install_webserver.sh >${INSTALL_LOG}


    elif [ "$1" = "compile" ]; then
        shift

        echo "Compile typescript in each modules..."

        echo " - Compiling rig_agent..."
        cd rig_manager/rig_agent; tsc; cd ../..

        echo " - Compiling farm_webserver..."
        cd farm_manager/farm_webserver; tsc; cd ../..

        echo " - Compiling pool_webserver..."
        cd pool_manager/pool_webserver; tsc; cd ../..

        echo " - Compiling node_webserver..."
        cd node_manager/node_webserver; tsc; cd ../..

    elif [ "$1" = "update" ]; then
        shift
        git pull
        $BASH_SOURCE modules-install

    elif [ "$1" = "ps" ]; then
        shift
        #ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.") |grep -e '\[free[m]ining.*\]' --color -B1

        echo "=============="
        echo "| FreeMining | ==> all processes"
        echo "=============="

        echo
        echo "==== RIG ===="
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.rig\.") |grep -e '\[free[m]ining.*\]' --color -B1 || echo "No process"

        echo
        echo "==== FARM ===="
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.farm\.") |grep -e '\[free[m]ining.*\]' --color -B1 || echo "No process"

        echo
        echo "==== NODE ===="
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.node\.") |grep -e '\[free[m]ining.*\]' --color -B1 || echo "No process"

        echo
        echo "==== POOL ===="
        ps -o pid,pcpu,pmem,user,command $(pgrep -f "\[freemining\.pool\.") |grep -e '\[free[m]ining.*\]' --color -B1 || echo "No process"
        echo

    else
        usage
    fi

fi


##### END #####

cd $OLD_PWD
