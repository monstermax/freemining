#!/bin/bash

##### START #####

OLD_PWD=$PWD
cd `dirname $BASH_SOURCE`

CMD_ARGS=($@)

##### CONFIG #####


NODE="node"
TS_NODE="ts-node"
TSC="tsc"


##### FUNCTIONS #####

function getCmdPath {
    command -v $1
}


function rootRequired {
    echo " => root required. Continue ? (Press Enter to continue. CTRL+C to stop)"
    read
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



##### MAIN #####

if [ "$0" = "$BASH_SOURCE" ]; then

    function usage {
        echo "Usage:"
        echo "$0 [action] <params>"
        echo
        echo "$0 rig <params>"
        echo "$0 pool <params>"
        echo "$0 farm <params>"
        echo "$0 compile"
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

    elif [ "$1" = "compile" ]; then
        shift
        cd rig_manager/rig_agent; tsc; cd ../..
        cd farm_manager/farm_server; tsc; cd ../..

    else
        usage
    fi

fi


##### END #####

cd $OLD_PWD
