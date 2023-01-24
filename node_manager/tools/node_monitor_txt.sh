#!/bin/bash

cd `dirname $0`

source ../node_manager.sh
set -e

TXT_MONITOR_DIR=../miners_monitor/txt


#echo "###################################### NODE ###########################################"

#LOCAL_IP=$(ip route get 4.2.2.1 2>/dev/null |grep dev |cut -d" " -f7)
LOCAL_IP=$(hostname -I | cut -d' ' -f1)
OS_VERSION=$(grep PRETTY_NAME /etc/os-release |cut -d'"' -f2)
NODE_MOTHERBOARD=$(cat /sys/devices/virtual/dmi/id/board_{name,vendor} | tr "\n" " ")
UPTIME=$(cat /proc/uptime |cut -d" " -f1 |cut -d"." -f1)
LOAD_AVG=$(cat /proc/loadavg |cut -d" " -f1)
MEM=$(free --mega -t |tail -n1 |tr -s ' ')
MEM_TOTAL=$(echo $MEM |cut -d" " -f2)
MEM_USED=$(echo $MEM |cut -d" " -f3)
DATE=$(date "+%F %T")

#VIDEO_CARDS=$(lspci 2>/dev/null |grep VGA |cut -d":" -f3- |sed 's/^\s*//g')
#VIDEO_CARDS_DRIVERS=$(realpath /sys/class/drm/card*/device/driver 2>/dev/null |rev |cut -d"/" -f1 |rev)


echo "node.hostname: $(hostname)"
echo "node.ip: ${LOCAL_IP}"
echo "node.os: ${OS_VERSION}"
echo "node.motherBoard: ${NODE_MOTHERBOARD}"
echo "node.uptime: ${UPTIME}"
echo "node.loadAvg: ${LOAD_AVG}"
echo "node.memory: ${MEM_USED}/${MEM_TOTAL} MB"
echo "node.date: ${DATE}"



function runService {
    service_name=$1

    service_cmd="${TXT_MONITOR_DIR}/${service_name}.sh"
    if [ -x $service_cmd ]; then
        #exec $service_cmd > ${DATA_DIR}/node_monitor_${service_name}.tmp.txt
        true
        # TODO

    else
        #echo "Warning: service $service_cmd not found"
        rm -f ${DATA_DIR}/node_monitor_${service_name}.tmp.txt
    fi
}


function readService {
    service_name=$1

    if ! test -f ${DATA_DIR}/node_monitor_${service_name}.tmp.txt; then
        return
    fi

    SERVICE_TXT=$(cat ${DATA_DIR}/node_monitor_${service_name}.tmp.txt)

    if [ "$SERVICE_TXT" != "" ]; then
        SERVICES_TXT="${SERVICES_TXT}
==== ${service_name} ====
${SERVICE_TXT}
"

    fi

}



#INSTALLED_MINERS=$(getInstalledMiners) # already loaded in node_manager.sh


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

