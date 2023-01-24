#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh
set -e

# Usage:
# ./uninstall_miner.sh ps


miner=$1
shift || true

FRM_PACKAGE="miner_uninstall"



function usage {
    CMD=$(basename $BASH_SOURCE)

    echo "=============="
    echo "| FreeMining | ==> [${FRM_MODULE^^}] ==> [${FRM_PACKAGE^^}]"
    echo "=============="
    echo

    echo "Usage:"
    echo
    echo "  $CMD {miner} [ -y ] [ --remove-user-data ]"
    echo
    echo

    #showMinersList

    echo
}


################################################################################



if test "$miner" = ""; then
    usage
    exit 0
fi


echo "Uninstalling miner ${miner}"

appDirExists=$(test -d ${minersDir}/${miner} || echo "[not exists]" && echo "")
confDirExists=$(test -d ${rigConfDir}/miners/${miner} || echo "[not exists]" && echo "")
logDirExists=$(test -d ${rigLogDir}/miners/${miner} || echo "[not exists]" && echo "")
pidDirExists=$(test -d ${rigPidDir}/miners/${miner} || echo "[not exists]" && echo "")
pidFileExists=$(test -d ${rigPidDir}/miners/freemining.rig.miner.${miner}.pid || echo "[not exists]" && echo "")
logFilesCount=$(find ${rigLogDir}/miners -type f -name freemining.rig.miner.${miner}.* |wc -l)

if ! hasOpt -y; then
    echo
    echo "Folders to be deleted :"
    echo " - ${minersDir}/${miner} $appDirExists"

    if hasOpt --remove-user-data; then
        echo " - ${rigConfDir}/miners/${miner} $confDirExists"
    fi

    echo " - ${rigLogDir}/miners/${miner} $logDirExists"
    #echo " - ${rigPidDir}/miners/${miner} $pidDirExists"
    echo
    echo "Files to be deleted :"
    echo " - ${rigLogDir}/miners/freemining.rig.miner.${miner}.* [$logFilesCount file(s)]"
    echo " - ${rigPidDir}/miners/freemining.rig.miner.${miner}.pid $pidFileExists"
    echo
    read -p "Press [enter] to continuer"
fi



# delete app
rm -rf ${minersDir}/${miner}


# delete data (conf + data)
if hasOpt --remove-user-data; then
    rm -rf ${rigConfDir}/miners/${miner}
fi

# delete logs
rm -rf ${rigLogDir}/miners/${miner}/
rm -rf ${rigLogDir}/miners/freemining.rig.miner.${miner}.*

# delete pids
#rm -rf ${rigPidDir}/miners/${miner}
rm -rf ${rigPidDir}/miners/freemining.rig.miner.${miner}.pid


echo "Miner ${miner} is uninstalled"

