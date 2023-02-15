
# Dynex


docker pull ubuntu:22.04
docker run -i -t --name dynex --hostname docker-dynex ubuntu:22.04

# in docker container

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

