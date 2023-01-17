#!/bin/bash

cd `dirname $0`

#source ../env


echo "###################################### RIG ###########################################"

echo "rig.hostname: $(hostname)"

LOCAL_IP=$(ip route get 4.2.2.1 |grep dev |cut -d" " -f7)
echo "rig.ip: ${LOCAL_IP}"

OS_VERSION=$(grep PRETTY_NAME /etc/os-release |cut -d'"' -f2)
echo "rig.os: ${OS_VERSION}"

UPTIME=$(cat /proc/uptime |cut -d" " -f1 |cut -d"." -f1)
echo "rig.uptime: ${UPTIME}"

LOAD_AVG=$(cat /proc/loadavg |cut -d" " -f1)
echo "rig.loadAvg: ${LOAD_AVG}"

MEM=$(free --mega -t |tail -n1 |tr -s ' ')
MEM_TOTAL=$(echo $MEM |cut -d" " -f2)
MEM_USED=$(echo $MEM |cut -d" " -f3)
echo "rig.memory: ${MEM_USED}/${MEM_TOTAL} MB"

DATE=$(date "+%F %T")
echo "rig.date: ${DATE}"

echo "###################################### NBMiner #######################################"

# NBMiner
../miners_api/txt/nbminer_api_txt.sh

echo "###################################### lolMiner ######################################"

# lolMiner
../miners_api/txt/lolminer_api_txt.sh

echo "###################################### XMRig #########################################"

# XMRig
../miners_api/txt/xmrig_api_txt.sh

echo "###################################### GMiner ########################################"

# GMiner
../miners_api/txt/gminer_api_txt.sh

echo "###################################### T-Rex ########################################"

# T-Rex
../miners_api/txt/trex_api_txt.sh

echo "###################################### TeamRedMiner #################################"

# TeamRedMiner
../miners_api/txt/teamredminer_api_txt.sh

