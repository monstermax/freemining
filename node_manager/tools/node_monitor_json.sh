#!/bin/bash

cd `dirname $0`

source ../node_manager.sh
set -e



JSON_MONITOR_DIR="../miners_monitor/json"


NODE_NAME=$nodeName
NODE_HOSTNAME=$(hostname)
LOCAL_IP=$(hostname -I | cut -d' ' -f1)
NODE_MOTHERBOARD=$(cat /sys/devices/virtual/dmi/id/board_{name,vendor} | tr "\n" " ")

OS_VERSION=$(grep PRETTY_NAME /etc/os-release |cut -d'"' -f2)
UPTIME=$(cat /proc/uptime |cut -d" " -f1 |cut -d"." -f1)
LOAD_AVG=$(cat /proc/loadavg |cut -d" " -f1)
DATE=$(date +%s)

MEM=$(free --mega -t |tail -n1 |tr -s ' ')
MEM_TOTAL=$(echo $MEM |cut -d" " -f2)
MEM_USED=$(echo $MEM |cut -d" " -f3)


CPU_INFO=$(cat /proc/cpuinfo |grep "^model name" |cut -d":" -f2 |sort |uniq -c |head -n1 |tr -s " " " " |sed 's/^\s*//g')
CPU_NAME=$(echo $CPU_INFO |cut -d" " -f2-)
CPU_COUNT=$(echo $CPU_INFO |cut -d" " -f1)



function runService {
    service_name=$1

    service_cmd="${JSON_MONITOR_DIR}/${service_name}.sh"
    if [ -x $service_cmd ]; then
        #exec $service_cmd > ${DATA_DIR}/node_monitor_${service_name}.tmp.json
        true
        # TODO

    else
        #echo "Warning: service $service_cmd not found"
        rm -f ${DATA_DIR}/node_monitor_${service_name}.tmp.json
    fi
}


function readService {
    service_name=$1

    if ! test -f ${DATA_DIR}/node_monitor_${service_name}.tmp.json; then
        return
    fi

    SERVICE_JSON=$(cat ${DATA_DIR}/node_monitor_${service_name}.tmp.json)

    if [ "$SERVICE_JSON" != "" ]; then
        if [ "$SERVICES_JSON" != "" ]; then
            SERVICES_JSON="${SERVICES_JSON},
        "
        fi

        SERVICE_JSON=$(echo "$SERVICE_JSON" |sed  '2,9999s/^/        /g')

        SERVICES_JSON="${SERVICES_JSON}\"${service_name}\": ${SERVICE_JSON}"

    fi

}


#INSTALLED_MINERS=$(getAvailableMiners) # already loaded in node_manager.sh


SERVICES_JSON=""
if [ "$INSTALLED_MINERS" != "" ]; then
    DATA_DIR=$(mktemp -d)

    for service_name in $INSTALLED_MINERS; do
        runService $service_name &
    done

    wait

    for service_name in $INSTALLED_MINERS; do
        readService $service_name
    done

    rm -rf $DATA_DIR
fi



cat <<_EOF
{
    "infos": {
        "name": "${NODE_NAME}",
        "hostname": "${NODE_HOSTNAME}",
        "ip": "${LOCAL_IP}",
        "os": "${OS_VERSION}",
        "uptime": ${UPTIME}
    },
    "usage": {
        "loadAvg": ${LOAD_AVG},
        "memory": {
            "used": ${MEM_USED},
            "total": ${MEM_TOTAL}
        }
    },
    "devices": {
        "motherboard": "${NODE_MOTHERBOARD}",
        "cpu": {
            "name": "${CPU_NAME}",
            "threads": ${CPU_COUNT}
        }
    },
    "services": {
        ${SERVICES_JSON}
    },
    "dataDate": ${DATE}
}
_EOF
