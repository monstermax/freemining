#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh


SERVICES=$(jq -r ".miners | keys | join(\" \")" $CONFIG_FILE)


TXT_MONITOR_DIR="../miners_monitor/json"


#echo "###################################### RIG ###########################################"

RIG_NAME=$(hostname)
#echo "rig.hostname: $RIG_NAME"

LOCAL_IP=$(hostname -I | cut -d' ' -f1)
#echo "rig.ip: ${LOCAL_IP}"

OS_VERSION=$(grep PRETTY_NAME /etc/os-release |cut -d'"' -f2)
#echo "rig.os: ${OS_VERSION}"

UPTIME=$(cat /proc/uptime |cut -d" " -f1 |cut -d"." -f1)
#echo "rig.uptime: ${UPTIME}"

LOAD_AVG=$(cat /proc/loadavg |cut -d" " -f1)
#echo "rig.loadAvg: ${LOAD_AVG}"

MEM=$(free --mega -t |tail -n1 |tr -s ' ')
MEM_TOTAL=$(echo $MEM |cut -d" " -f2)
MEM_USED=$(echo $MEM |cut -d" " -f3)
#echo "rig.memory: ${MEM_USED}/${MEM_TOTAL} MB"

#DATE=$(date "+%F %T")
DATE=$(date +%s)
#echo "rig.date: ${DATE}"


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

    service_cmd="${TXT_MONITOR_DIR}/${service_name}.sh"
    exec $service_cmd > ${DATA_DIR}/rig_monitor_${service_name}.tmp.json
}


function readService {
    service_name=$1

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


SERVICES_JSON=""

DATA_DIR=$(mktemp -d)

for service_name in $SERVICES; do
    runService $service_name &
done

wait

for service_name in $SERVICES; do
    readService $service_name
done



cat <<_EOF
{
    "rig": {
        "hostname": "${RIG_NAME}",
        "ip": "${LOCAL_IP}",
        "os": "${OS_VERSION}",
        "uptime": "${UPTIME}",
        "loadAvg": "${LOAD_AVG}",
        "memory": {
            "used": "${MEM_USED}",
            "total": "${MEM_TOTAL}"
        },
        "devices": {
            "cpu": {
                "name": "${CPU_NAME}",
                "threads": "${CPU_COUNT}"
            },
            "gpu": [
                $VIDEO_CARDS_JSON
            ]
        },
        "dateRig": ${DATE}
    },
    "services": {
        ${SERVICES_JSON}
    }
}
_EOF
