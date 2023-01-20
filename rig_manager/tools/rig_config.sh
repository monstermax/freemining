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
    echo "  $CMD show                                         # show ${FRM_MODULE} manager config"
    echo
    echo "  $CMD set {key} {value}                            # set key/value"
    echo "  $CMD set {keylevel1.keylevel2.keylevel3} {value}  # set key/value"
    echo
    echo "  Example:"
    echo "  $CMD set database.host 127.0.0.1                  # => will set database.host = '127.0.0.1'"
    echo
    echo "  $CMD {} {key} [{value}]                           # create {} object containing {value}"
    echo "  $CMD [] {key} [{value}]                           # create [] object containing {value}"
    echo
    echo "  Example:"
    echo "  $CMD [] myvar                                     # => will set myvar as an empty array []"
    echo "  $CMD [] myvar 1,2,3                               # => will set myvar as [1, 2, 3]"
    echo "  $CMD {} myvar                                     # => will set myvar as an empty object {}"
    echo "  $CMD {} myvar {\"hello\":\"world\"}                   # => will set myvar as {\"hello\":\"world\"}"
    echo

    echo
}


################################################################################


TEMP_FILE=$(mktemp)


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

    jq --tab ".${KEY} = \"$VALUE\"" $RIG_CONFIG_FILE > $TEMP_FILE
    mv $TEMP_FILE $RIG_CONFIG_FILE
    exit $?
fi


# CREATE object {}
if test "$ACTION" = "{}"; then
    KEY=$1
    VALUE=$2
    shift 2 || true

    if test "$KEY" = ""; then
        echo "Error: missing key"
        exit $?
    fi

    jq --tab ".${KEY} = {$VALUE}" $RIG_CONFIG_FILE > $TEMP_FILE
    mv $TEMP_FILE $RIG_CONFIG_FILE
    exit $?
fi


# CREATE array []
if test "$ACTION" = "[]"; then
    KEY=$1
    VALUE=$2
    shift 2 || true

    if test "$KEY" = ""; then
        echo "Error: missing key"
        exit $?
    fi

    jq --tab ".${KEY} = [$VALUE]" $RIG_CONFIG_FILE > $TEMP_FILE
    mv $TEMP_FILE $RIG_CONFIG_FILE
    exit $?
fi


rm -f $TEMP_FILE
