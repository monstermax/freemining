#!/bin/bash


##### START #####

if test -z "$BASH_SOURCE"; then
    BASH_SOURCE=$0
fi

COMMON_OLD_PWD=$PWD
cd `dirname $BASH_SOURCE`

SOURCE_PWD=$PWD
source ../../freemining.sh
cd $SOURCE_PWD





##### END #####

cd $COMMON_OLD_PWD

