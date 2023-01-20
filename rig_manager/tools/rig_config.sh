#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh
set -e

# Usage:
# ./rig_config.sh


ACTION=$1

FRM_PACKAGE="rig_config"


function usage {
    CMD=$(basename $BASH_SOURCE)

    echo "=============="
    echo "| FreeMining | ==> [${FRM_MODULE^^}] ==> [${FRM_PACKAGE^^}]"
    echo "=============="
    echo

    echo "Usage:"
    echo
    echo "  $CMD <params>"
    echo
    echo

    echo
}


################################################################################



if [ "$ACTION" = "" ]; then
    usage
    exit 0
fi
shift


# SHOW
if test "$ACTION" = "show"; then
    KEY=$1
    shift || true

    if test "$KEY" = ""; then
        cat $RIG_CONFIG_FILE
        exit $?
    fi

    jq ".${KEY}" $RIG_CONFIG_FILE
    exit $?
fi


# SET
if test "$ACTION" = "set"; then
    KEY=$1
    VALUE=$2
    shift 2 || true

    if test "$KEY" = ""; then
        echo "Error: missing key"
        exit $?
    fi

    jq ".${KEY}" $RIG_CONFIG_FILE
    exit $?
fi

