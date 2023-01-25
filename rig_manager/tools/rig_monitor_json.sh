#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh
set -e



JSON_MONITOR_DIR="../miners_monitor/json"


RIG_NAME=$rigName
RIG_HOSTNAME=$(hostname)
LOCAL_IP=$(hostname -I | cut -d' ' -f1)
RIG_MOTHERBOARD=$(cat /sys/devices/virtual/dmi/id/board_{name,vendor} 2>/dev/null | tr "\n" " ")

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

VIDEO_CARDS=$(lspci 2>/dev/null |grep VGA |cut -d":" -f3- |sed 's/^\s*//g')

VIDEO_CARDS_DRIVERS=$(realpath /sys/class/drm/card*/device/driver 2>/dev/null |rev |cut -d"/" -f1 |rev)

VIDEO_CARDS_JSON=""
VIDEO_CARD_ID=0
while read VIDEO_CARD_NAME; do
    if [ "$VIDEO_CARDS_JSON" != "" ]; then
        VIDEO_CARDS_JSON="${VIDEO_CARDS_JSON},
"
    fi

    let "VIDEO_CARD_NEXT_ID = VIDEO_CARD_ID + 1"

    VIDEO_CARD_DRIVER=$(echo "$VIDEO_CARDS_DRIVERS" | tail -n +${VIDEO_CARD_NEXT_ID} |head -n1)

    #VIDEO_CARD_JSON="\"$VIDEO_CARD_NAME ($VIDEO_CARD_ID ${VIDEO_CARD_DRIVER})\""
    VIDEO_CARD_JSON=$(
        cat <<_EOF
        {
            "id": "$VIDEO_CARD_ID",
            "name": "$VIDEO_CARD_NAME",
            "driver": "$VIDEO_CARD_DRIVER"
        }
_EOF
    )

    VIDEO_CARDS_JSON="${VIDEO_CARDS_JSON}${VIDEO_CARD_JSON}"

    VIDEO_CARD_ID=$VIDEO_CARD_NEXT_ID
done <<< $(echo "$VIDEO_CARDS")


function runService {
    service_name=$1

    service_cmd="${JSON_MONITOR_DIR}/${service_name}.sh"
    if [ -x $service_cmd ]; then
        exec $service_cmd > ${DATA_DIR}/rig_monitor_${service_name}.tmp.json

    else
        #echo "Warning: service $service_cmd not found"
        rm -f ${DATA_DIR}/rig_monitor_${service_name}.tmp.json
    fi
}


function readService {
    service_name=$1

    if ! test -f ${DATA_DIR}/rig_monitor_${service_name}.tmp.json; then
        return
    fi

    SERVICE_JSON=$(cat ${DATA_DIR}/rig_monitor_${service_name}.tmp.json)

    if [ "$SERVICE_JSON" != "" ]; then
        if [ "$SERVICES_JSON" != "" ]; then
            SERVICES_JSON="${SERVICES_JSON},
        "
        fi

        SERVICE_JSON=$(echo "$SERVICE_JSON" |sed  '2,9999s/^/        /g')

        SERVICES_JSON="${SERVICES_JSON}\"${service_name}\": ${SERVICE_JSON}"

    fi

}


#INSTALLED_MINERS=$(getAvailableMiners) # already loaded in rig_manager.sh


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
        "name": "${RIG_NAME}",
        "hostname": "${RIG_HOSTNAME}",
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
        "motherboard": "${RIG_MOTHERBOARD}",
        "cpu": {
            "name": "${CPU_NAME}",
            "threads": ${CPU_COUNT}
        },
        "gpu": [
            $VIDEO_CARDS_JSON
        ]
    },
    "services": {
        ${SERVICES_JSON}
    },
    "dataDate": ${DATE}
}
_EOF
