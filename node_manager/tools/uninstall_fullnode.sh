#!/bin/bash

cd `dirname $0`

source ../node_manager.sh
set -e

# Usage:
# ./uninstall_fullnode.sh ps


fullnode=$1
shift || true

FRM_PACKAGE="fullnode_uninstall"



function usage {
    CMD=$(basename $BASH_SOURCE)

    echo "=============="
    echo "| FreeMining | ==> [${FRM_MODULE^^}] ==> [${FRM_PACKAGE^^}]"
    echo "=============="
    echo

    echo "Usage:"
    echo
    echo "  $CMD {fullnode} [ -y ] [ --remove-user-data ]"
    echo
    echo

    #showFullnodesList

    echo
}


################################################################################



if test "$fullnode" = ""; then
    usage
    exit 0
fi


echo "Uninstalling fullnode ${fullnode}"

appDirExists=$(test -d ${fullnodesDir}/${fullnode} || echo "[not exists]" && echo "")
confDirExists=$(test -d ${nodeConfDir}/fullnodes/${fullnode} || echo "[not exists]" && echo "")
logDirExists=$(test -d ${nodeLogDir}/fullnodes/${fullnode} || echo "[not exists]" && echo "")
pidDirExists=$(test -d ${nodePidDir}/fullnodes/${fullnode} || echo "[not exists]" && echo "")
pidFileExists=$(test -d ${nodePidDir}/fullnodes/freemining.node.fullnode.${fullnode}.pid || echo "[not exists]" && echo "")
logFilesCount=$(find ${nodeLogDir}/fullnodes -type f -name freemining.node.fullnode.${fullnode}.* |wc -l)


if ! hasOpt -y; then
    echo
    echo "Folders to be deleted :"
    echo " - ${fullnodesDir}/${fullnode} $appDirExists"

    if hasOpt --remove-user-data; then
        echo " - ${nodeConfDir}/fullnodes/${fullnode} $confDirExists"
    fi

    echo " - ${nodeLogDir}/fullnodes/${fullnode} $logDirExists"
    #echo " - ${nodePidDir}/fullnodes/${fullnode} $pidDirExists"
    echo
    echo "Files to be deleted :"
    echo " - ${nodeLogDir}/fullnodes/freemining.node.fullnode.${fullnode}.* [$logFilesCount file(s)]"
    echo " - ${nodePidDir}/fullnodes/freemining.node.fullnode.${fullnode}.pid $pidFileExists"
    echo
    read -p "Press [enter] to continuer"
fi


# delete app
rm -rf ${fullnodesDir}/${fullnode}


# delete data (conf + data)
if hasOpt --remove-user-data; then
    rm -rf ${nodeConfDir}/fullnodes/${fullnode}
fi

# delete logs
rm -rf ${nodeLogDir}/fullnodes/${fullnode}/
rm -rf ${nodeLogDir}/fullnodes/freemining.node.fullnode.${fullnode}.*

# delete pids
#rm -rf ${nodePidDir}/fullnodes/${fullnode}
rm -rf ${nodePidDir}/fullnodes/freemining.node.fullnode.${fullnode}.pid


echo "Fullnode ${fullnode} is uninstalled"

