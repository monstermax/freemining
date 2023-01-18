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
        CMD=$(basename $BASH_SOURCE)

        if isRoot; then
            PREFIX="/usr/local"
        else
            PREFIX="~/local"
        fi

        echo "=============="
        echo "| FreeMining |"
        echo "=============="
        echo

        echo "Usage:"
        echo
        echo "  $CMD [action] <params>"
        echo
        echo "  $CMD rig  <params>                # manage rig"
        echo "  $CMD farm <params>                # manage farm"
        echo "  $CMD pool <params>                # manage pool"
        echo
        echo "  $CMD bin-install                  # install freemining.sh to ${PREFIX}/bin/fmin"
        echo "  $CMD modules-install              # install all modules (rig, farm, pool)"
        echo "  $CMD compile                      # compile typescript for all modules"
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

    elif [ "$1" = "bin-install" ]; then
        PARENT_DIR=$(dirname $BASH_SOURCE)

        if isRoot; then
            echo "#!/bin/bash

cd $(realpath $PARENT_DIR)
$0 \$@
" > /usr/local/bin/fmin

            chmod +x /usr/local/bin/fmin
        else
            echo "#!/bin/bash

cd $(realpath $PARENT_DIR)
$0 \$@
" > ~/local/bin/fmin

            chmod +x ~/local/bin/fmin
        fi


    elif [ "$1" = "modules-install" ]; then
        shift

        echo "Install modules"

        INSTALL_LOG=/dev/null

        echo " - Installing rig_agent..."
        ./rig_manager/rig_agent/install_agent.sh >${INSTALL_LOG}

        echo " - Installing farm_server..."
        ./farm_manager/farm_server/install_server.sh >${INSTALL_LOG}

        echo " - Installing pool_server..."
        ./pool_manager/pool_server/install_server.sh >${INSTALL_LOG}


    elif [ "$1" = "compile" ]; then
        shift

        echo "Compile typescript in each modules..."

        echo " - Compiling rig_agent..."
        cd rig_manager/rig_agent; tsc; cd ../..

        echo " - Compiling farm_server..."
        cd farm_manager/farm_server; tsc; cd ../..

        echo " - Compiling pool_server..."
        cd pool_manager/pool_server; tsc; cd ../..

    elif [ "$1" = "update" ]; then
        shift
        git pull
        $BASH_SOURCE modules-install

    else
        usage
    fi

fi


##### END #####

cd $OLD_PWD
