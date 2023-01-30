#!/bin/bash


# nvidia-smi --query-gpu=index,name,memory.used,memory.total,temperature.gpu,fan.speed,utilization.gpu,utilization.memory,power.draw,clocks.sm,clocks.mem,clocks.gr --format=csv


if [ "$1" == "-h" ]; then
    echo "Usage: "
    echo "      $0 -l           list cards"
    echo "      $0 -d 1         use card 1 (default 0)"
    exit 0
fi


VERBOSE=1
if grep -q -e "-q" <<< "$@"; then
    VERBOSE=0
fi


CARD_IDS=$(grep DRIVER=nvidia /sys/class/drm/card*/device/uevent |cut -d"/" -f5 |cut -c 5- | tr "\n" " ")
if [ "$VERBOSE" = "1" ]; then
    echo "Found cards ids: ${CARD_IDS}"
fi

if [ "$CARD_IDS" = "" ]; then
    echo "Error: no nvidia card found"
    exit 1
fi


CARD_ID=$(echo ${CARD_IDS} |cut -d" " -f1)
if [ "$VERBOSE" = "1" ]; then
    echo "Default card: ${CARD_ID}"
fi


if [ "$1" == "-d" ]; then
    CARD_ID=$2
    if [ "$VERBOSE" = "1" ]; then
        echo "Using card: ${CARD_ID}"
    fi

    if ! test -f "/sys/class/drm/card${CARD_ID}/device/uevent"; then
        echo "Error: card ${CARD_ID} not found"
        exit 1
    fi

    if ! grep -q DRIVER=nvidia /sys/class/drm/card${CARD_ID}/device/uevent; then
        echo "Error: invalid card ${CARD_ID} driver"
        exit 1
    fi
fi


if [ "$VERBOSE" = "1" ]; then
    echo "----------"
fi


if [ "$1" == "-l" ]; then
    nvidia-smi --query-gpu=name --format=csv,noheader
    exit 0
fi



GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader,nounits -i ${CARD_ID})
GPU_USAGE=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits -i ${CARD_ID})

VRAM_USED_MB=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits -i ${CARD_ID})
VRAM_TOTAL_MB=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits -i ${CARD_ID})

TEMP_ROUND=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits -i ${CARD_ID})

FANPOWER100=$(nvidia-smi --query-gpu=fan.speed --format=csv,noheader,nounits -i ${CARD_ID})

echo "${GPU_NAME} | GPU usage: ${GPU_USAGE}% | GPU temperature: $TEMP_ROUND° | GPU fan speed: ${FANPOWER100}% | VRAM usage: ${VRAM_USED_MB}/${VRAM_TOTAL_MB} MB"
