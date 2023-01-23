#!/bin/bash

cd `dirname $0`

source ../node_manager.sh
set -e

# Usage:
# ./webserver.sh {ACTION}

# Actions: run start stop status debug log pid-log log-file pid-file pid ps


FRM_PACKAGE="webserver"
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


export CONFIGURED_FULLNODES
export INSTALLED_FULLNODES
export INSTALLABLE_FULLNODES


DAEMON_CMD="${NODE} ./webserver.js"
if test "$USE_TS" = "1"; then
    DAEMON_CMD="${TS_NODE} ./webserver.ts"
fi

daemon_manager $@

usage

