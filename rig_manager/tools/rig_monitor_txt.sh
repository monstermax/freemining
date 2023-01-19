#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh
set -e

TXT_MONITOR_DIR=../miners_monitor/txt


echo "###################################### RIG ###########################################"

LOCAL_IP=$(ip route get 4.2.2.1 |grep dev |cut -d" " -f7)
OS_VERSION=$(grep PRETTY_NAME /etc/os-release |cut -d'"' -f2)
UPTIME=$(cat /proc/uptime |cut -d" " -f1 |cut -d"." -f1)
LOAD_AVG=$(cat /proc/loadavg |cut -d" " -f1)
MEM=$(free --mega -t |tail -n1 |tr -s ' ')
MEM_TOTAL=$(echo $MEM |cut -d" " -f2)
MEM_USED=$(echo $MEM |cut -d" " -f3)
DATE=$(date "+%F %T")

echo "rig.hostname: $(hostname)"
echo "rig.ip: ${LOCAL_IP}"
echo "rig.os: ${OS_VERSION}"
echo "rig.uptime: ${UPTIME}"
echo "rig.loadAvg: ${LOAD_AVG}"
echo "rig.memory: ${MEM_USED}/${MEM_TOTAL} MB"
echo "rig.date: ${DATE}"


echo "###################################### NBMiner #######################################"

# NBMiner
${TXT_MONITOR_DIR}/nbminer.sh || true

echo "###################################### lolMiner ######################################"

# lolMiner
${TXT_MONITOR_DIR}/lolminer.sh || true

echo "###################################### XMRig #########################################"

# XMRig
${TXT_MONITOR_DIR}/xmrig.sh || true

echo "###################################### GMiner ########################################"

# GMiner
${TXT_MONITOR_DIR}/gminer.sh || true

echo "###################################### T-Rex ########################################"

# T-Rex
${TXT_MONITOR_DIR}/trex.sh || true

echo "###################################### TeamRedMiner #################################"

# TeamRedMiner
${TXT_MONITOR_DIR}/teamredminer.sh || true

