#!/bin/bash

cd `dirname $0`

source ../farm_manager.sh
set -e


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
    echo
}

################################################################################

FRM_PACKAGE="webserver"
DAEMON_NAME="freemining.${FRM_MODULE}.${FRM_PACKAGE}"

DAEMON_CMD="${NODE} ./webserver.js"
if test "$USE_TS" = "1"; then
    DAEMON_CMD="${TS_NODE} ./webserver.ts"
fi

################################################################################


DAEMON_OPTS=""
#DAEMON_OPTS="background"

daemon_manager $1

usage

