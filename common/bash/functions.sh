#!/bin/bash


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

function getArrayOpt {
    key="$1"
    shift
    array=($@)

    for i in "${!array[@]}"; do

        if [[ "${array[$i]}" = "${key}" ]]; then
            let $((j = i + 1)) || true
            echo ${array[$j]}
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

