#!/bin/bash


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


CARD_IDS=$(grep DRIVER=amdgpu /sys/class/drm/card*/device/uevent |cut -d"/" -f5 |cut -c 5- | tr "\n" " ")
if [ "$VERBOSE" = "1" ]; then
    echo "Found cards ids: ${CARD_IDS}"
fi

if [ "$CARD_IDS" = "" ]; then
    echo "Error: no amdgpu card found"
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

    if ! grep -q DRIVER=amdgpu /sys/class/drm/card${CARD_ID}/device/uevent; then
        echo "Error: invalid card ${CARD_ID} driver"
        exit 1
    fi
fi


if [ "$VERBOSE" = "1" ]; then
    echo "----------"
fi

if [ "$1" == "-l" ]; then
    # TODO
    exit 0
fi


GPU_USAGE=$(cat /sys/class/drm/card${CARD_ID}/device/gpu_busy_percent)
GPU_FREQ=$(cat /sys/class/drm/card${CARD_ID}/device/pp_dpm_sclk |grep "*" |cut -d" " -f2)
VRAM_FREQ=$(cat /sys/class/drm/card${CARD_ID}/device/pp_dpm_mclk |grep "*" |cut -d" " -f2)
VRAM_USED=$(cat /sys/class/drm/card${CARD_ID}/device/mem_info_vram_used)
VRAM_USED_MB=$(echo "${VRAM_USED}/1024/1024" |bc)
VRAM_TOTAL=$(cat /sys/class/drm/card${CARD_ID}/device/mem_info_vram_total)
VRAM_TOTAL_MB=$(echo "${VRAM_TOTAL}/1024/1024" |bc)
TEMP_DECIMAL=$(cat /sys/class/drm/card${CARD_ID}/device/hwmon/hwmon?/temp1_input)
TEMP_ROUND=$(echo "$TEMP_DECIMAL/1000" |bc)
FANPOWER255=$(cat /sys/class/drm/card${CARD_ID}/device/hwmon/hwmon?/pwm1)
FANPOWER100=$(echo "${FANPOWER255}*100/255" |bc)
echo "GPU usage: ${GPU_USAGE}% | GPU temperature: $TEMP_ROUND° | GPU fan speed: ${FANPOWER100}% | VRAM usage: ${VRAM_USED_MB}/${VRAM_TOTAL_MB} MB | GPU frequency: ${GPU_FREQ} | VRAM frequency: ${VRAM_FREQ}"

