#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh
set -e

TXT_MONITOR_DIR=../miners_monitor/txt


#echo "###################################### RIG ###########################################"

#LOCAL_IP=$(ip route get 4.2.2.1 2>/dev/null |grep dev |cut -d" " -f7)
LOCAL_IP=$(hostname -I | cut -d' ' -f1)
OS_VERSION=$(grep PRETTY_NAME /etc/os-release |cut -d'"' -f2)
RIG_MOTHERBOARD=$(cat /sys/devices/virtual/dmi/id/board_{name,vendor} 2>/dev/null | tr "\n" " ")

CPU_INFO=$(cat /proc/cpuinfo |grep "^model name" |cut -d":" -f2 |sort |uniq -c |head -n1 |tr -s " " " " |sed 's/^\s*//g')
CPU_NAME=$(echo $CPU_INFO |cut -d" " -f2-)
CPU_COUNT=$(echo $CPU_INFO |cut -d" " -f1)

#TMP_JSON_FILE=$(mktemp)
#inxi -sC --output json --output-file ${TMP_JSON_FILE}  2>&1 || true
#CPU_TEMP=$(jq -r '.["001#1#0#Sensors"][] | select( .["001#0#2#cpu"] != null ) | .["001#0#2#cpu"]' ${TMP_JSON_FILE} | cut -d" " -f1)
#rm -f ${TMP_JSON_FILE}

UPTIME=$(cat /proc/uptime |cut -d" " -f1 |cut -d"." -f1)
LOAD_AVG=$(cat /proc/loadavg |cut -d" " -f1)
MEM=$(free --mega -t |tail -n1 |tr -s ' ')
MEM_TOTAL=$(echo $MEM |cut -d" " -f2)
MEM_USED=$(echo $MEM |cut -d" " -f3)
DATE=$(date "+%F %T")

echo "rig.hostname: $(hostname)"
echo "rig.ip: ${LOCAL_IP}"
echo "rig.os: ${OS_VERSION}"
echo "rig.motherBoard: ${RIG_MOTHERBOARD}"
echo "rig.cpu: ${CPU_NAME} [${CPU_COUNT} threads]"
echo "rig.uptime: ${UPTIME}"
echo "rig.loadAvg: ${LOAD_AVG}"
echo "rig.memory: ${MEM_USED}/${MEM_TOTAL} MB"
echo "rig.date: ${DATE}"



function runService {
    local MINER=$1

    if [ -x ../miners_support/${MINER}.sh ]; then
        source ../miners_support/${MINER}.sh

    else
        MINER_FROM_ALIAS=$(jq -r ".miners[\"${MINER}\"].miner | select(. != null) // \"\"" $RIG_CONFIG_FILE 2>/dev/null)

        if test -x ../miners_support/${MINER_FROM_ALIAS}.sh; then
            source ../miners_support/${MINER_FROM_ALIAS}.sh

        else
            rm -f ${DATA_DIR}/rig_monitor_${MINER}.tmp.txt
            return
        fi
    fi

    miner_status_txt $MINER >${DATA_DIR}/rig_monitor_${MINER}.tmp.txt 2>/dev/null || true
}


function readService {
    local MINER=$1

    if ! test -f ${DATA_DIR}/rig_monitor_${MINER}.tmp.txt; then
        return
    fi

    local SERVICE_TXT=$(cat ${DATA_DIR}/rig_monitor_${MINER}.tmp.txt)

    if [ "$SERVICE_TXT" != "" ]; then
        SERVICES_TXT="${SERVICES_TXT}
==== ${MINER} ====
${SERVICE_TXT}
"

    fi

}



#INSTALLED_MINERS=$(getInstalledMiners) # already loaded in rig_manager.sh


if [ "$INSTALLED_MINERS" != "" ]; then
    SERVICES_TXT=""
    DATA_DIR=$(mktemp -d)

    for MINER in $INSTALLED_MINERS; do
        runService $MINER &
    done

    wait

    for MINER in $INSTALLED_MINERS; do
        readService $MINER
    done

    rm -rf $DATA_DIR

    echo "$SERVICES_TXT"
fi
