#!/bin/bash

commonBashDir=$(realpath `dirname $BASH_SOURCE`)


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




######################## RIG ########################



function getInstalledMiners {
    MINERS=$(find $minersDir -mindepth 1 -maxdepth 1 -type d 2>/dev/null | xargs -I '{}' basename {} | sort | tr "\n" " ")
    #MINERS=$(echo $(ls $minersDir))
    echo $MINERS
}


function getAvailableMiners {
    MINERS=$(eval echo `jq -r ".miners | keys | join(\" \")" ${RIG_CONFIG_FILE} 2>/dev/null`)
    #MINERS=$(jq -r ".miners | keys | join(\" \")" $RIG_CONFIG_FILE)
    echo $MINERS
}


function getInstalledAvailableMiners {
    FILE_AV=$(mktemp)
    FILE_IN=$(mktemp)
    echo $INSTALLED_MINERS |tr " " "\n" > $FILE_IN
    echo $CONFIGURED_MINERS |tr " " "\n" > $FILE_AV
    MINERS=$(comm -12 $FILE_IN $FILE_AV | tr "\n" " ")
    rm -f $FILE_IN $FILE_AV
    echo $MINERS
}


function getMinerApiPort {
    miner=$1

    API_PORT=$(eval echo `jq -r ".miners.${miner}.api.port" ${RIG_CONFIG_FILE} 2>/dev/null`)

    if [ "$API_PORT" = "null" ]; then
        API_PORT=""
    fi

    echo $API_PORT
}

function getInstallableAvailableMiners {
    #MINERS="autolykosv2_amd autolykosv2_nvidia bminer bzminer claymore ethminer firominer firominer_sources_amd gminer kawpowminer_amd kawpowminer_nvidia lolminer miniz nanominer nbminer srbminer teamredminer trex wildrig xmrig xmrig_sources_free xmrig_nvidia_cuda_support"

    local current_dir=$commonBashDir
    local install_miner=${current_dir}/../../rig_manager/tools/install_miner.sh
    MINERS=$(grep "function install_" $install_miner | cut -d_ -f2- | cut -d" " -f1 | tr "\n" " ")

    echo $MINERS
}




######################## FARM ########################



######################## NODE ########################


function getInstalledFullnodes {
    FULLNODES=$(find $fullnodesDir -mindepth 1 -maxdepth 1 -type d 2>/dev/null | xargs -I '{}' basename {} | sort | tr "\n" " ")
    #FULLNODES=$(echo $(ls $fullnodesDir))
    echo $FULLNODES
}


function getAvailableFullnodes {
    FULLNODES=$(eval echo `jq -r ".fullnodes | keys | join(\" \")" ${RIG_CONFIG_FILE} 2>/dev/null`)
    #FULLNODES=$(jq -r ".fullnodes | keys | join(\" \")" $RIG_CONFIG_FILE)
    echo $FULLNODES
}

function getInstalledAvailableFullnodes {
    FILE_AV=$(mktemp)
    FILE_IN=$(mktemp)
    echo $INSTALLED_FULLNODES |tr " " "\n" > $FILE_IN
    echo $CONFIGURED_FULLNODES |tr " " "\n" > $FILE_AV
    FULLNODES=$(comm -12 $FILE_IN $FILE_AV | tr "\n" " ")
    rm -f $FILE_IN $FILE_AV
    FULLNODES $FULLNODES
}


function getInstallableAvailableFullnodes {
    #FULLNODES="bitcoincash bitcoinsv callisto dogecoin ergo ethereum ethereum_classic firo flux kadena kaspa komodo meowcoin monero neoxa radiant raptoreum ravencoin siacoin zcash"

    local current_dir=$commonBashDir
    local install_fullnode=${current_dir}/../../node_manager/tools/install_fullnode.sh
    FULLNODES=$(grep "function install_" $install_fullnode | cut -d_ -f2- | cut -d" " -f1 | tr "\n" " ")

    echo $FULLNODES
}


######################## POOL ########################


