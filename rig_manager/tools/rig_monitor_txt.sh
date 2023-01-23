#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh
set -e

TXT_MONITOR_DIR=../miners_monitor/txt


#echo "###################################### RIG ###########################################"

#LOCAL_IP=$(ip route get 4.2.2.1 2>/dev/null |grep dev |cut -d" " -f7)
LOCAL_IP=$(hostname -I | cut -d' ' -f1)
OS_VERSION=$(grep PRETTY_NAME /etc/os-release |cut -d'"' -f2)
RIG_MOTHERBOARD=$(cat /sys/devices/virtual/dmi/id/board_{name,vendor} | tr "\n" " ")
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
echo "rig.uptime: ${UPTIME}"
echo "rig.loadAvg: ${LOAD_AVG}"
echo "rig.memory: ${MEM_USED}/${MEM_TOTAL} MB"
echo "rig.date: ${DATE}"



function runService {
    service_name=$1

    service_cmd="${TXT_MONITOR_DIR}/${service_name}.sh"
    if [ -x $service_cmd ]; then
        exec $service_cmd > ${DATA_DIR}/rig_monitor_${service_name}.tmp.txt

    else
        #echo "Warning: service $service_cmd not found"
        rm -f ${DATA_DIR}/rig_monitor_${service_name}.tmp.txt
    fi
}


function readService {
    service_name=$1

    if ! test -f ${DATA_DIR}/rig_monitor_${service_name}.tmp.txt; then
        return
    fi

    SERVICE_TXT=$(cat ${DATA_DIR}/rig_monitor_${service_name}.tmp.txt)

    if [ "$SERVICE_TXT" != "" ]; then
        SERVICES_TXT="${SERVICES_TXT}
==== ${service_name} ====
${SERVICE_TXT}
"

    fi

}



#INSTALLED_MINERS=$(getInstalledMiners) # already loaded in rig_manager.sh


if [ "$INSTALLED_MINERS" != "" ]; then
    SERVICES_TXT=""
    DATA_DIR=$(mktemp -d)

    for service_name in $INSTALLED_MINERS; do
        runService $service_name &
    done

    wait

    for service_name in $INSTALLED_MINERS; do
        readService $service_name
    done

    rm -rf $DATA_DIR

    echo "$SERVICES_TXT"
fi

