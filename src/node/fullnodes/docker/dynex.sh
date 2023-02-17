#!/bin/bash

set -e
cd `dirname $0`


# Dynex

## Config

WALLET_NAME="dynex"
DOCKER_IMAGE="ubuntu:22.04"

is_docker_installed=$(command -v docker | wc -l)
is_image_downloaded=$(docker images -f reference=${DOCKER_IMAGE} -q | wc -l)
is_container_running=$(docker container ls -a -f name="^/${WALLET_NAME}$" -q |wc -l)

## Install

### on physical host...

docker pull ${DOCKER_IMAGE}
docker run -i -t --name ${WALLET_NAME} --hostname docker-${WALLET_NAME} ${DOCKER_IMAGE}

#### in docker container...

apt-get update
apt-get install -y wget vim curl unzip screen

apt-get install -y libboost-all-dev libcurl4-openssl-dev
apt-get install -y libdb++-dev build-essential libtool autotools-dev automake pkg-config bsdmainutils ccache python3 python3-pip python3-setuptools python-setuptools
apt-get install -y libevent-dev python3-zmq python3-dev libboost-python-dev libboost-system-dev libboost-filesystem-dev libboost-test-dev libboost-thread-dev libminiupnpc-dev libzmq3-dev

mkdir /root/node
cd /root/node
wget https://github.com/dynexcoin/Dynex/releases/download/Dynex_2.2.2.b/Dynex-main-7106974-ubuntu-22.04-linux-x64-core2.zip

unzip Dynex-main-7106974-ubuntu-22.04-linux-x64-core2.zip
cd Dynex-main-7106974/
chmod +x *

screen ./dynexd

./simplewallet --generate-new-wallet /root/node/wallet.bin
exit

