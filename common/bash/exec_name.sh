#!/bin/bash

#cd `dirname $0`

CURRENT_DIR=$PWD

TMP_DIR=$(mktemp -d)
cd $TMP_DIR

processName=$1
cmd=$2
shift 2 || true

if [ "$processName" = "" -o "$cmd" = "" ]; then
    echo "Error: missing {processName} and/or {cmd}"
    exit 1
fi

cmdFile=$(echo $cmd | cut -d" " -f1)
cmdFile=$(command -v $cmdFile)

if [ "$cmdFile" = "" ]; then
    echo "Error: invalid {cmd}"
    exit 1
fi

cmdFileBasename=$(basename $cmdFile)
processName="[$processName] $cmdFileBasename"

ln -s $cmdFile "$processName"

cd $CURRENT_DIR

PATH="$PATH:${TMP_DIR}"

exec "${processName}" "$@"

