#!/bin/bash

cd `dirname $0`

source ../env


TMP_DIR=$(mktemp -d)

mkdir -p ${TMP_DIR}



function getCmdPath {
    command -v $1
}


INSTALLS=""
if [ "`getCmdPath curl`" = "" ]; then
    INSTALLS="$INSTALLS curl"
fi

if [ "`getCmdPath wget`" = "" ]; then
    INSTALLS="$INSTALLS wget"
fi

if [ "`getCmdPath jq`" = "" ]; then
    INSTALLS="$INSTALLS jq"
fi

if [ "`getCmdPath php`" = "" ]; then
    INSTALLS="$INSTALLS php-cli"
fi

if [ "`getCmdPath bc`" = "" ]; then
    INSTALLS="$INSTALLS bc"
fi

if [ "`getCmdPath vim`" = "" ]; then
    INSTALLS="$INSTALLS vim"
fi

if [ "`getCmdPath node`" = "" ]; then
    INSTALLS="$INSTALLS nodejs npm"
fi

if [ "`getCmdPath /sbin/ifconfig`" = "" ]; then
    INSTALLS="$INSTALLS net-tools"
fi

if [ "$INSTALLS" != "" ]; then
    echo "Installing packages: $INSTALLS"
    echo " => root required. Continue ? (Press Enter to continue. CTRL+C to stop)"; read
    sudo apt-get install -y $INSTALLS
fi



if [ "`getCmdPath ts-node`" = "" ]; then
    # install typescript
    echo "Installing NPM packages: typescript"
    echo " => root required. Continue ? (Press Enter to continue. CTRL+C to stop)"; read
    sudo npm install -g typescript ts-node tslib @types/node
fi







function install_lolminer {
    cd ${TMP_DIR}
    wget https://github.com/Lolliedieb/lolMiner-releases/releases/download/1.65/lolMiner_v1.65_Lin64.tar.gz
    mkdir -p lolminer
    tar zxvf lolMiner_v1.65_Lin64.tar.gz -C lolminer
    rm -rf ${MINERS_DIR}/lolminer
    mkdir -p ${MINERS_DIR}/lolminer
    rm -rf ${MINERS_DIR}/lolminer
    cp -a lolminer/1.65 ${MINERS_DIR}/lolminer

    ${MINERS_DIR}/lolminer/lolMiner --list-device
}

function install_gminer {
    cd ${TMP_DIR}
    wget https://github.com/develsoftware/GMinerRelease/releases/download/3.24/gminer_3_24_linux64.tar.xz
    mkdir -p gminer
    tar -Jxvf gminer_3_24_linux64.tar.xz -C gminer
    rm -rf ${MINERS_DIR}/gminer
    cp -a gminer ${MINERS_DIR}

    ${MINERS_DIR}/gminer/miner --list_devices
}


function install_trex {
    cd ${TMP_DIR}
    wget https://github.com/trexminer/T-Rex/releases/download/0.26.8/t-rex-0.26.8-linux.tar.gz
    mkdir -p t-rex
    tar zxvf t-rex-0.26.8-linux.tar.gz -C t-rex
    rm -rf ${MINERS_DIR}/trex
    cp -a t-rex ${MINERS_DIR}/trex

    ${MINERS_DIR}/t-rex/t-rex --devices-info
}


function install_nbminer {
    cd ${TMP_DIR}
    wget https://github.com/NebuTech/NBMiner/releases/download/v42.3/NBMiner_42.3_Linux.tgz
    tar zxvf NBMiner_42.3_Linux.tgz
    rm -rf ${MINERS_DIR}/nbminer
    cp -a NBMiner_Linux ${MINERS_DIR}/nbminer

    ${MINERS_DIR}/nbminer/nbminer --device-info
}


function install_teamredminer {
    cd ${TMP_DIR}
    wget https://github.com/todxx/teamredminer/releases/download/v0.10.7/teamredminer-v0.10.7-linux.tgz
    tar zxvf teamredminer-v0.10.7-linux.tgz
    rm -rf ${MINERS_DIR}/teamredminer
    cp -a teamredminer-v0.10.7-linux ${MINERS_DIR}/teamredminer

    ${MINERS_DIR}/teamredminer/teamredminer --list_devices
}


function install_bzminer {
    cd ${TMP_DIR}
    wget https://github.com/bzminer/bzminer/releases/download/v12.2.0/bzminer_v12.2.0_linux.tar.gz
    tar zxvf bzminer_v12.2.0_linux.tar.gz
    rm -rf ${MINERS_DIR}/bzminer
    cp -a bzminer_v12.2.0_linux ${MINERS_DIR}/bzminer
}


function install_claymore {
    cd ${TMP_DIR}
    wget https://github.com/Claymore-Dual/Claymore-Dual-Miner/releases/download/15.0/Claymore.s.Dual.Ethereum.AMD+NVIDIA.GPU.Miner.v15.0.-.LINUX.zip
    unzip Claymore.s.Dual.Ethereum.AMD+NVIDIA.GPU.Miner.v15.0.-.LINUX.zip
    rm -rf ${MINERS_DIR}/claymore
    cp -a Claymore.s.Dual.Ethereum.AMD+NVIDIA.GPU.Miner.v15.0.-.LINUX ${MINERS_DIR}/claymore
    chmod +x ${MINERS_DIR}/claymore/ethdcrminer64

    ${MINERS_DIR}/claymore/ethdcrminer64 -list
}


function install_nanominer {
    cd ${TMP_DIR}
    wget https://github.com/nanopool/nanominer/releases/download/v3.7.6/nanominer-linux-3.7.6.tar.gz
    mkdir -p nanominer
    tar zxvf nanominer-linux-3.7.6.tar.gz -C nanominer
    rm -rf ${MINERS_DIR}/nanominer
    cp -a nanominer ${MINERS_DIR}

    ${MINERS_DIR}/nanominer/nanominer -d
}


function install_miniz {
    cd ${TMP_DIR}
    wget https://github.com/miniZ-miner/miniZ/releases/download/v2.0b/miniZ_v2.0b_linux-x64.tar.gz
    mkdir -p miniz
    tar zxvf miniZ_v2.0b_linux-x64.tar.gz -C miniz
    rm -rf ${MINERS_DIR}/miniz
    cp -a miniz ${MINERS_DIR}/

    ${MINERS_DIR}/miniz/miniZ --cuda-info
}


function install_firominer_release {
    cd ${TMP_DIR}
    wget https://github.com/firoorg/firominer/releases/download/1.1.0/firominer-Linux.7z
    mkdir -p firominer
    7z -y x firominer-Linux.7z -ofirominer
    chmod +x firominer/firominer
    rm -rf ${MINERS_DIR}/firominer
    cp -a firominer ${MINERS_DIR}/

    ${MINERS_DIR}/firominer/firominer --list-devices
}


function install_firominer_sources_amd {
    cd ${TMP_DIR}
    mkdir -p firominer-source && cd firominer-source
    git clone https://github.com/firoorg/firominer
    cd firominer
    git submodule update --init --recursive
    mkdir build
    cd build
    cmake .. -DETHASHCUDA=OFF -DETHASHCL=ON -DAPICORE=ON
    # ERROR: cmake failed !
    make -sj $(nproc)

    #cp -a firominer ${MINERS_DIR}/firominer/firominer-amd
}


function install_wildrig {
    cd ${TMP_DIR}
    wget https://github.com/andru-kun/wildrig-multi/releases/download/0.36.1b/wildrig-multi-linux-0.36.1b.tar.xz
    mkdir -p wildrig
    tar -Jxvf wildrig-multi-linux-0.36.1b.tar.xz -C wildrig
    rm -rf ${MINERS_DIR}/wildrig
    cp -a wildrig ${MINERS_DIR}

    ${MINERS_DIR}/wildrig/wildrig-multi --print-devices
}


function install_kawpowminer_nvidia {
    cd ${TMP_DIR}
    wget https://github.com/RavenCommunity/kawpowminer/releases/download/1.2.4/kawpowminer-ubuntu20-cuda11-1.2.4.tar.gz
    tar zxvf kawpowminer-ubuntu20-cuda11-1.2.4.tar.gz
    mkdir -p ${MINERS_DIR}/kawpowminer
    rm -rf ${MINERS_DIR}/kawpowminer/kawpowminer-nvidia
    cp -a linux-ubuntu20-cuda11-1.2.4/kawpowminer ${MINERS_DIR}/kawpowminer/kawpowminer-nvidia
}


function install_kawpowminer_amd {
    cd ${TMP_DIR}
    wget https://github.com/RavenCommunity/kawpowminer/releases/download/1.2.4/kawpowminer-ubuntu20-opencl-1.2.4.tar.gz
    tar zxvf kawpowminer-ubuntu20-opencl-1.2.4.tar.gz
    mkdir -p ${MINERS_DIR}/kawpowminer
    rm -rf ${MINERS_DIR}/kawpowminer/kawpowminer-amd
    cp -a linux-ubuntu20-opencl-1.2.4/kawpowminer ${MINERS_DIR}/kawpowminer/kawpowminer-amd
}


function install_bminer {
    cd ${TMP_DIR}
    wget https://www.bminercontent.com/releases/bminer-v16.4.11-2849b5c-amd64.tar.xz
    tar -Jxvf bminer-v16.4.11-2849b5c-amd64.tar.xz
    rm -rf ${MINERS_DIR}/bminer
    cp -a bminer-v16.4.11-2849b5c ${MINERS_DIR}/bminer
}



function install_autolykosv2_nvidia {
    cd ${TMP_DIR}
    wget https://github.com/mhssamadani/Autolykos2_NV_Miner/releases/download/4.2.0/NV_Miner_Linux_CUDA11_4.2.0.zip
    unzip NV_Miner_Linux_CUDA11_4.2.0.zip -d NV_Miner
    mkdir -p ${MINERS_DIR}/autolykosv2
    rm -rf ${MINERS_DIR}/autolykosv2/nvidia
    cp -a NV_Miner/NV_Miner_Linux_CUDA11_4.2.0 ${MINERS_DIR}/autolykosv2/nvidia
}

function install_autolykosv2_amd {
    cd ${TMP_DIR}
    wget https://github.com/mhssamadani/Autolykos2_AMD_Miner/releases/download/2.1/AMD_Miner_UBUNTU_2.1.zip
    unzip AMD_Miner_UBUNTU_2.1.zip -d AMD_Miner
    mkdir -p ${MINERS_DIR}/autolykosv2
    rm -rf ${MINERS_DIR}/autolykosv2/amd
    cp -a AMD_Miner/AMD_Miner_UBUNTU_2.1 ${MINERS_DIR}/autolykosv2/amd
}


function install_ethminer {
    cd ${TMP_DIR}
    wget https://github.com/ethereum-mining/ethminer/releases/download/v0.18.0/ethminer-0.18.0-cuda-9-linux-x86_64.tar.gz
    mkdir -p ethminer-0.18.0-cuda-9
    tar zxvf ethminer-0.18.0-cuda-9-linux-x86_64.tar.gz -C ethminer-0.18.0-cuda-9
    rm -rf ${MINERS_DIR}/ethminer
    cp -a ethminer-0.18.0-cuda-9/bin ${MINERS_DIR}/ethminer

    ${MINERS_DIR}/ethminer/ethminer --list-devices
}


function install_srbminer {
    cd ${TMP_DIR}
    wget https://github.com/doktor83/SRBMiner-Multi/releases/download/2.0.1/SRBMiner-Multi-2-0-1-Linux.tar.xz
    tar -xvf SRBMiner-Multi-2-0-1-Linux.tar.xz
    rm -rf ${MINERS_DIR}/srbminer
    cp -a SRBMiner-Multi-2-0-1 ${MINERS_DIR}/srbminer

    ${MINERS_DIR}/srbminer/SRBMiner-MULTI --list-devices
}


function install_xmrig_release {
    cd ${TMP_DIR}
    wget https://github.com/xmrig/xmrig/releases/download/v6.18.1/xmrig-6.18.1-linux-x64.tar.gz
    tar zxvf xmrig-6.18.1-linux-x64.tar.gz
    rm -rf ${MINERS_DIR}/xmrig/xmrig
    cp -a xmrig-6.18.1 ${MINERS_DIR}/xmrig

    ${MINERS_DIR}/xmrig/xmrig --print-platforms
}


function install_xmrig_sources_free {
    cd ${TMP_DIR}
    echo "Installing dev tools"
    echo " => root required. Continue ? (Press Enter to continue. CTRL+C to stop)"; read
    sudo apt-get update --allow-releaseinfo-change
    sudo apt-get install -y git build-essential cmake libuv1-dev libssl-dev libhwloc-dev automake libtool autoconf
    mkdir -p xmrig-source && cd xmrig-source
    git clone https://github.com/xmrig/xmrig.git
    mkdir xmrig/build && cd xmrig/scripts
    sed -i "s/ = 1;/ = 0;/" ../src/donate.h
    ./build_deps.sh && cd ../build
    cmake .. -DXMRIG_DEPS=scripts/deps
    make -j$(nproc)
    rm -rf ${MINERS_DIR}/xmrig/xmrig-nofees
    mkdir -p ${MINERS_DIR}/xmrig
    cp -a xmrig ${MINERS_DIR}/xmrig/xmrig-nofees

    ${MINERS_DIR}/xmrig/xmrig-nofees --print-platforms
}


function install_xmrig_nvidia_cuda_support {
    cd ${TMP_DIR}
    mkdir -p xmrig-source && cd xmrig-source
    git clone https://github.com/xmrig/xmrig-cuda.git
    mkdir xmrig-cuda/build && cd xmrig-cuda/build
    cmake .. -DCUDA_LIB=/usr/local/cuda/lib64/stubs/libcuda.so -DCUDA_TOOLKIT_ROOT_DIR=/usr/local/cuda
    make -j$(nproc)

    rm -rf ${MINERS_DIR}/xmrig/libxmrig-cuda.so
    mkdir -p ${MINERS_DIR}/xmrig
    cp -a libxmrig-cuda.so ${MINERS_DIR}/xmrig/
}


function clean_tmp_dir {
    rm -rf $TMP_DIR
}




##################################################################



miner=$1


if [ "$miner" = "" ]; then
    echo "Usage: $0 <miner>"
    echo
    echo " miners list:"
    echo "  - lolminer"
    echo "  - gminer"
    echo "  - trex"
    echo "  - nbminer"
    echo "  - teamredminer"
    echo "  - bzminer"
    echo "  - claymore"
    echo "  - nanominer"
    echo "  - miniz"
    echo "  - firominer_release"
    echo "  - firominer_sources_amd"
    echo "  - wildrig"
    echo "  - kawpowminer_nvidia"
    echo "  - kawpowminer_amd"
    echo "  - bminer"
    echo "  - ethminer"
    echo "  - srbminer"
    #echo "  - ccminer"
    echo "  - autolykosv2_nvidia"
    echo "  - autolykosv2_amd"
    echo "  - xmrig_release"
    echo "  - xmrig_sources_free"
    echo "  - xmrig_nvidia_cuda_support"

    exit
fi



if ! test -d ${MINERS_DIR}; then
    echo "Creating miners folder: ${MINERS_DIR}"

    PARENT_DIR=$(dirname $MINERS_DIR)

    if test -w ${PARENT_DIR}; then
        mkdir -p ${MINERS_DIR}
        chown $USER: ${MINERS_DIR}

    else
        echo "Folder $PARENT_DIR is not writable"
        echo " => root required. Continue ? (Press Enter to continue. CTRL+C to stop)"; read
        sudo mkdir -p ${MINERS_DIR}
        sudo chown $USER: ${MINERS_DIR}
    fi
fi





if [ "$miner" = "lolminer" ]; then
    install_lolminer
fi

if [ "$miner" = "gminer" ]; then
    install_gminer
fi

if [ "$miner" = "trex" ]; then
    install_trex
fi

if [ "$miner" = "nbminer" ]; then
    install_nbminer
fi

if [ "$miner" = "teamredminer" ]; then
    install_teamredminer
fi

if [ "$miner" = "bzminer" ]; then
    install_bzminer
fi

if [ "$miner" = "claymore" ]; then
    install_claymore
fi

if [ "$miner" = "nanominer" ]; then
    install_nanominer
fi

if [ "$miner" = "miniz" ]; then
    install_miniz
fi

if [ "$miner" = "firominer_release" ]; then
    install_firominer_release
fi

if [ "$miner" = "firominer_sources_amd" ]; then
    install_firominer_sources_amd
fi

if [ "$miner" = "wildrig" ]; then
    install_wildrig
fi

if [ "$miner" = "kawpowminer_nvidia" ]; then
    install_kawpowminer_nvidia
fi

if [ "$miner" = "kawpowminer_amd" ]; then
    install_kawpowminer_amd
fi

if [ "$miner" = "bminer" ]; then
    install_bminer
fi

if [ "$miner" = "autolykosv2_nvidia" ]; then
    install_autolykosv2_nvidia
fi

if [ "$miner" = "autolykosv2_amd" ]; then
    install_autolykosv2_amd
fi

if [ "$miner" = "ethminer" ]; then
    install_ethminer
fi

if [ "$miner" = "srbminer" ]; then
    install_srbminer
fi

if [ "$miner" = "xmrig_release" ]; then
    install_xmrig_release
fi

if [ "$miner" = "xmrig_sources_free" ]; then
    install_xmrig_sources_free
fi

if [ "$miner" = "xmrig_nvidia_cuda_support" ]; then
    install_xmrig_nvidia_cuda_support
fi


clean_tmp_dir

