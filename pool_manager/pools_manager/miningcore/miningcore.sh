#!/bin/bash

cd `dirname $0`

source ../../pool_manager.sh
set -e

# Usage:
# ./miningcore.sh {ACTION}

# Actions: run start stop status debug log pid-log log-file pid-file pid ps


FRM_PACKAGE="miningcore"
DAEMON_NAME="freemining.${FRM_MODULE}.${FRM_PACKAGE}"


function usage {
    CMD=$(basename $BASH_SOURCE)

    echo "=============="
    echo "| FreeMining | ==> [${FRM_MODULE^^}] ==> [${FRM_PACKAGE^^}]"
    echo "=============="
    echo

    echo "Usage:"
    echo
    echo "  $CMD [action] <params>"
    echo
    echo "  $CMD run                       # start ${FRM_PACKAGE}"
    echo "  $CMD start                     # start ${FRM_PACKAGE} in background"
    echo "  $CMD restart                   # restart ${FRM_PACKAGE} (background only)"
    echo "  $CMD stop                      # stop ${FRM_PACKAGE}"
    echo "  $CMD status                    # show ${FRM_PACKAGE} status"
    echo "  $CMD log                       # tail ${FRM_PACKAGE} stdout"
    echo "  $CMD pid-log                   # tail ${FRM_PACKAGE} stdout"
    echo "  $CMD ps                        # show ${FRM_PACKAGE} running process"
    echo
}


################################################################################


if ! test -d ${poolsEngineDir}/${FRM_PACKAGE}; then
    echo "Warning: ${FRM_PACKAGE} is not installed"
    exit 1
fi


ACTION=$1

if test "$ACTION" = "run" || test "$ACTION" = "start" || test "$ACTION" = "restart"; then
    # rebuild pool config
    ./build_miningcore_config.sh

    # rebuild API config
    ${poolAppDir}/pools_manager/patchs/miningcoreWebUI_api_config.sh -q
fi

DAEMON_CMD="${poolsEngineDir}/${FRM_PACKAGE}/Miningcore -c ${poolConfDir}/engines/${FRM_PACKAGE}/config.json"

daemon_manager $@

usage
