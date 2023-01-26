#!/bin/bash

##### START #####

OLD_PWD=$PWD
cd `dirname $BASH_SOURCE`

CMD_ARGS=($@)

source ./common/bash/daemon.sh
source ./common/bash/functions.sh

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
        echo "  $CMD dir                          # show freemining folders"
        echo
    }

    ACTION=$1
    shift || true


    if [ "$ACTION" = "rig" ]; then
        exec ./rig_manager/rig_manager.sh $@

    elif [ "$ACTION" = "farm" ]; then
        exec ./farm_manager/farm_manager.sh $@

    elif [ "$ACTION" = "pool" ]; then
        exec ./pool_manager/pool_manager.sh $@

    elif [ "$ACTION" = "node" ]; then
        exec ./node_manager/node_manager.sh $@

    elif [ "$ACTION" = "miner" ]; then
        # shortcut to rig/miner
        exec ./rig_manager/tools/run_miner.sh $@

    elif [ "$ACTION" = "fullnode" ]; then
        # shortcut to node/fullnode
        exec ./node_manager/tools/run_fullnode.sh $@

    elif [ "$ACTION" = "bin-install" ]; then
        PARENT_DIR=$(dirname $BASH_SOURCE)

        mkdir -p $INSTALL_DIR

        echo "#!/bin/bash

cd $(realpath $PARENT_DIR)
$0 \$@
" > ${INSTALL_DIR}/frm

        chmod +x ${INSTALL_DIR}/frm

        # install autosuggest
        AUTOCOMPLETION_SCRIPT=$(realpath ./common/bash/frm_autocompletion.sh)

        if ! grep -q frm_autocompletion ~/.bashrc 2>/dev/null; then
            echo "source $AUTOCOMPLETION_SCRIPT" >> ~/.bashrc
        fi

    elif [ "$ACTION" = "modules-install" ]; then
        echo "Install modules" # JS modules

        INSTALL_LOG=/dev/null

        echo " - Installing common..."
        ./common/javascript/install_common.sh >${INSTALL_LOG}

        echo " - Installing rig_agent..."
        ./rig_manager/rig_agent/install_agent.sh >${INSTALL_LOG}

        echo " - Installing farm_server..."
        ./farm_manager/farm_webserver/install_webserver.sh >${INSTALL_LOG}

        echo " - Installing pool_server..."
        ./pool_manager/pool_webserver/install_webserver.sh >${INSTALL_LOG}

        echo " - Installing node_server..."
        ./node_manager/node_webserver/install_webserver.sh >${INSTALL_LOG}


    elif [ "$ACTION" = "compile" ]; then
        echo "Compile typescript in each modules..."

        echo " - Compiling common..."
        cd common/javascript; tsc; cd ../..

        echo " - Compiling rig_agent..."
        cd rig_manager/rig_agent; tsc; cd ../..

        echo " - Compiling farm_webserver..."
        cd farm_manager/farm_webserver; tsc; cd ../..

        echo " - Compiling pool_webserver..."
        cd pool_manager/pool_webserver; tsc; cd ../..

        echo " - Compiling node_webserver..."
        cd node_manager/node_webserver; tsc; cd ../..

    elif [ "$ACTION" = "update" ]; then
        git reset --hard
        git pull
        $BASH_SOURCE modules-install

    elif [ "$ACTION" = "pull" ]; then
        git reset --hard
        git pull

    elif [ "$ACTION" = "push" ]; then
        modified_files=$(git status -s |wc -l)
        if [ "$modified_files" != "0" ] ; then
            echo "Warning: ${modified_files} file(s) not committed"
            exit 1
        fi
        git push

    elif [ "$ACTION" = "commit" ]; then
        modified_files=$(git status -s |wc -l)
        if [ "$modified_files" = "0" ] ; then
            echo "Warning: no file to commit"
            exit 1
        fi
        message=$@
        if [ "$message" = "" ]; then
            echo "Error: missing commit message"
            exit 1
        fi
        git commit -am "${message}"

    elif [ "$ACTION" = "ps" ]; then
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

    elif [ "$ACTION" = "dir" ]; then
        echo "System: ${frmAppDir} [$((du -hs ${frmAppDir} 2>/dev/null || echo 0) |cut -f1)]"
        echo "App: ${frmDataDir} [$((du -hs ${frmDataDir} 2>/dev/null || echo 0) |cut -f1)]"
        echo "Data: ${frmConfDir} [$((du -hs ${frmConfDir} 2>/dev/null || echo 0) |cut -f1)]"
        echo "Log: ${frmLogDir} [$((du -hs ${frmLogDir} 2>/dev/null || echo 0) |cut -f1)]"
        echo "Pid: ${frmPidDir} [$((du -hs ${frmPidDir} 2>/dev/null || echo 0) |cut -f1)]"
        exit $?


    else
        usage
    fi

fi


##### END #####

cd $OLD_PWD
