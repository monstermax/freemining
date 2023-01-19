#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh
#set -e


FRM_PACKAGE="miner_install"

TMP_DIR=$(mktemp -d)

mkdir -p ${TMP_DIR}
mkdir -p ${minersDir}


# install basic tools
installBasicTools

# install nodejs + npm + typescript
installNodejsPackages




function install_lolminer {
    cd ${TMP_DIR}
    MINER="lolminer"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/Lolliedieb/lolMiner-releases/releases/download/1.65/lolMiner_v1.65_Lin64.tar.gz

    echo " - unziping..."
    mkdir -p lolminer
    tar zxf lolMiner_v1.65_Lin64.tar.gz -C lolminer

    echo " - installing..."
    rm -rf ${minersDir}/lolminer
    mkdir -p ${minersDir}/lolminer
    rm -rf ${minersDir}/lolminer
    cp -a lolminer/1.65 ${minersDir}/lolminer

    ${minersDir}/lolminer/lolMiner --list-device

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}

function install_gminer {
    cd ${TMP_DIR}
    MINER="gminer"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/develsoftware/GMinerRelease/releases/download/3.24/gminer_3_24_linux64.tar.xz

    echo " - unziping..."
    mkdir -p gminer
    tar -Jxf gminer_3_24_linux64.tar.xz -C gminer

    echo " - installing..."
    rm -rf ${minersDir}/gminer
    cp -a gminer ${minersDir}

    ${minersDir}/gminer/miner --list_devices

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_trex {
    cd ${TMP_DIR}
    MINER="trex"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/trexminer/T-Rex/releases/download/0.26.8/t-rex-0.26.8-linux.tar.gz

    echo " - unziping..."
    mkdir -p t-rex
    tar zxf t-rex-0.26.8-linux.tar.gz -C t-rex

    echo " - installing..."
    rm -rf ${minersDir}/trex
    cp -a t-rex ${minersDir}/trex

    ${minersDir}/t-rex/t-rex --devices-info

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_nbminer {
    cd ${TMP_DIR}
    MINER="nbminer"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/NebuTech/NBMiner/releases/download/v42.3/NBMiner_42.3_Linux.tgz

    echo " - unziping..."
    tar zxf NBMiner_42.3_Linux.tgz

    echo " - installing..."
    rm -rf ${minersDir}/nbminer
    cp -a NBMiner_Linux ${minersDir}/nbminer

    ${minersDir}/nbminer/nbminer --device-info

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_teamredminer {
    cd ${TMP_DIR}
    MINER="teamredminer"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/todxx/teamredminer/releases/download/v0.10.7/teamredminer-v0.10.7-linux.tgz

    echo " - unziping..."
    tar zxf teamredminer-v0.10.7-linux.tgz

    echo " - installing..."
    rm -rf ${minersDir}/teamredminer
    cp -a teamredminer-v0.10.7-linux ${minersDir}/teamredminer

    ${minersDir}/teamredminer/teamredminer --list_devices

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_bzminer {
    cd ${TMP_DIR}
    MINER="bzminer"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/bzminer/bzminer/releases/download/v12.2.0/bzminer_v12.2.0_linux.tar.gz

    echo " - unziping..."
    tar zxf bzminer_v12.2.0_linux.tar.gz

    echo " - installing..."
    rm -rf ${minersDir}/bzminer
    cp -a bzminer_v12.2.0_linux ${minersDir}/bzminer

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_claymore {
    cd ${TMP_DIR}
    MINER="claymore"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/Claymore-Dual/Claymore-Dual-Miner/releases/download/15.0/Claymore.s.Dual.Ethereum.AMD+NVIDIA.GPU.Miner.v15.0.-.LINUX.zip

    echo " - unziping..."
    unzip Claymore.s.Dual.Ethereum.AMD+NVIDIA.GPU.Miner.v15.0.-.LINUX.zip

    echo " - installing..."
    rm -rf ${minersDir}/claymore
    cp -a Claymore.s.Dual.Ethereum.AMD+NVIDIA.GPU.Miner.v15.0.-.LINUX ${minersDir}/claymore
    chmod +x ${minersDir}/claymore/ethdcrminer64

    ${minersDir}/claymore/ethdcrminer64 -list

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_nanominer {
    cd ${TMP_DIR}
    MINER="nanominer"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/nanopool/nanominer/releases/download/v3.7.6/nanominer-linux-3.7.6.tar.gz

    echo " - unziping..."
    mkdir -p nanominer
    tar zxf nanominer-linux-3.7.6.tar.gz -C nanominer

    echo " - installing..."
    rm -rf ${minersDir}/nanominer
    cp -a nanominer ${minersDir}

    ${minersDir}/nanominer/nanominer -d

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_miniz {
    cd ${TMP_DIR}
    MINER="miniz"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/miniZ-miner/miniZ/releases/download/v2.0b/miniZ_v2.0b_linux-x64.tar.gz

    echo " - unziping..."
    mkdir -p miniz
    tar zxf miniZ_v2.0b_linux-x64.tar.gz -C miniz

    echo " - installing..."
    rm -rf ${minersDir}/miniz
    cp -a miniz ${minersDir}/

    ${minersDir}/miniz/miniZ --cuda-info

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_firominer {
    cd ${TMP_DIR}
    MINER="firominer"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/firoorg/firominer/releases/download/1.1.0/firominer-Linux.7z

    echo " - unziping..."
    mkdir -p firominer
    7z -y x firominer-Linux.7z -ofirominer
    chmod +x firominer/firominer

    echo " - installing..."
    rm -rf ${minersDir}/firominer
    cp -a firominer ${minersDir}/

    ${minersDir}/firominer/firominer --list-devices

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_firominer_sources_amd {
    cd ${TMP_DIR}
    MINER="firominer_sources_amd"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    mkdir -p firominer-source && cd firominer-source
    git clone https://github.com/firoorg/firominer >/dev/null 2>&1
    cd firominer
    git submodule update --init --recursive

    echo " - compiling (1/2)..."
    mkdir build
    cd build
    cmake .. -DETHASHCUDA=OFF -DETHASHCL=ON -DAPICORE=ON
    # ERROR: cmake failed !

    echo " - compiling (2/2)..."
    make -sj $(nproc)

    echo " - installing..."
    mkdir -p ${minersDir}/firominer
    #cp -a firominer ${minersDir}/firominer/firominer-amd

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_wildrig {
    cd ${TMP_DIR}
    MINER="wildrig"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/andru-kun/wildrig-multi/releases/download/0.36.1b/wildrig-multi-linux-0.36.1b.tar.xz

    echo " - unziping..."
    mkdir -p wildrig
    tar -Jxf wildrig-multi-linux-0.36.1b.tar.xz -C wildrig

    echo " - installing..."
    rm -rf ${minersDir}/wildrig
    cp -a wildrig ${minersDir}

    ${minersDir}/wildrig/wildrig-multi --print-devices

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_kawpowminer_nvidia {
    cd ${TMP_DIR}
    MINER="kawpowminer_nvidia"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/RavenCommunity/kawpowminer/releases/download/1.2.4/kawpowminer-ubuntu20-cuda11-1.2.4.tar.gz

    echo " - unziping..."
    tar zxf kawpowminer-ubuntu20-cuda11-1.2.4.tar.gz

    echo " - installing..."
    mkdir -p ${minersDir}/kawpowminer
    rm -rf ${minersDir}/kawpowminer/kawpowminer-nvidia
    cp -a linux-ubuntu20-cuda11-1.2.4/kawpowminer ${minersDir}/kawpowminer/kawpowminer-nvidia

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_kawpowminer_amd {
    cd ${TMP_DIR}
    MINER="kawpowminer_amd"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/RavenCommunity/kawpowminer/releases/download/1.2.4/kawpowminer-ubuntu20-opencl-1.2.4.tar.gz

    echo " - unziping..."
    tar zxf kawpowminer-ubuntu20-opencl-1.2.4.tar.gz

    echo " - installing..."
    mkdir -p ${minersDir}/kawpowminer
    rm -rf ${minersDir}/kawpowminer/kawpowminer-amd
    cp -a linux-ubuntu20-opencl-1.2.4/kawpowminer ${minersDir}/kawpowminer/kawpowminer-amd

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_bminer {
    cd ${TMP_DIR}
    MINER="bminer"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://www.bminercontent.com/releases/bminer-v16.4.11-2849b5c-amd64.tar.xz

    echo " - unziping..."
    tar -Jxf bminer-v16.4.11-2849b5c-amd64.tar.xz

    echo " - installing..."
    rm -rf ${minersDir}/bminer
    cp -a bminer-v16.4.11-2849b5c ${minersDir}/bminer

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}



function install_autolykosv2_nvidia {
    cd ${TMP_DIR}
    MINER="autolykosv2_nvidia"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/mhssamadani/Autolykos2_NV_Miner/releases/download/4.2.0/NV_Miner_Linux_CUDA11_4.2.0.zip

    echo " - unziping..."
    unzip NV_Miner_Linux_CUDA11_4.2.0.zip -d NV_Miner

    echo " - installing..."
    mkdir -p ${minersDir}/autolykosv2
    rm -rf ${minersDir}/autolykosv2/nvidia
    cp -a NV_Miner/NV_Miner_Linux_CUDA11_4.2.0 ${minersDir}/autolykosv2/nvidia

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}

function install_autolykosv2_amd {
    cd ${TMP_DIR}
    MINER="autolykosv2_amd"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/mhssamadani/Autolykos2_AMD_Miner/releases/download/2.1/AMD_Miner_UBUNTU_2.1.zip

    echo " - unziping..."
    unzip AMD_Miner_UBUNTU_2.1.zip -d AMD_Miner

    echo " - installing..."
    mkdir -p ${minersDir}/autolykosv2
    rm -rf ${minersDir}/autolykosv2/amd
    cp -a AMD_Miner/AMD_Miner_UBUNTU_2.1 ${minersDir}/autolykosv2/amd

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_ethminer {
    cd ${TMP_DIR}
    MINER="ethminer"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/ethereum-mining/ethminer/releases/download/v0.18.0/ethminer-0.18.0-cuda-9-linux-x86_64.tar.gz

    echo " - unziping..."
    mkdir -p ethminer-0.18.0-cuda-9
    tar zxf ethminer-0.18.0-cuda-9-linux-x86_64.tar.gz -C ethminer-0.18.0-cuda-9
    rm -rf ${minersDir}/ethminer
    cp -a ethminer-0.18.0-cuda-9/bin ${minersDir}/ethminer

    ${minersDir}/ethminer/ethminer --list-devices

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_srbminer {
    cd ${TMP_DIR}
    MINER="srbminer"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/doktor83/SRBMiner-Multi/releases/download/2.0.1/SRBMiner-Multi-2-0-1-Linux.tar.xz

    echo " - unziping..."
    tar -xf SRBMiner-Multi-2-0-1-Linux.tar.xz

    echo " - installing..."
    rm -rf ${minersDir}/srbminer
    cp -a SRBMiner-Multi-2-0-1 ${minersDir}/srbminer

    echo " - testing..."
    ${minersDir}/srbminer/SRBMiner-MULTI --list-devices

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_xmrig {
    cd ${TMP_DIR}
    MINER="xmrig"

    echo "Installing ${MINER}..."
    echo " - downloading..."
    wget -q https://github.com/xmrig/xmrig/releases/download/v6.18.1/xmrig-6.18.1-linux-x64.tar.gz

    echo " - unziping..."
    tar zxf xmrig-6.18.1-linux-x64.tar.gz

    echo " - installing..."
    rm -rf ${minersDir}/${MINER}/xmrig
    mkdir -p ${minersDir}/${MINER}
    cp -a xmrig-6.18.1/{xmrig,config.json} ${minersDir}/${MINER}

    echo " - testing..."
    ${minersDir}/${MINER}/xmrig --print-platforms

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_xmrig_sources_free {
    cd ${TMP_DIR}
    MINER="xmrig"

    echo "Installing ${MINER} (sources/nofees)..."

    echo " -installing dev tools"
    rootRequired
    sudo apt-get update -qq --allow-releaseinfo-change
    sudo apt-get install -qq -y git build-essential cmake libuv1-dev libssl-dev libhwloc-dev automake libtool autoconf

    echo " - downloading..."
    mkdir -p xmrig-source && cd xmrig-source
    git clone https://github.com/xmrig/xmrig.git >/dev/null 2>&1

    echo " - compiling..."
    mkdir xmrig/build && cd xmrig/scripts
    sed -i "s/ = 1;/ = 0;/" ../src/donate.h
    ./build_deps.sh >/dev/null 2>&1
    cd ../build
    cmake .. -DXMRIG_DEPS=scripts/deps >/dev/null 2>&1
    make -j$(nproc) >/dev/null 2>&1

    echo " - installing..."
    rm -rf ${minersDir}/xmrig/xmrig-nofees
    mkdir -p ${minersDir}/xmrig
    cp -a xmrig ${minersDir}/xmrig/xmrig-nofees

    echo " - testing..."
    ${minersDir}/xmrig/xmrig-nofees --print-platforms

    echo
    echo "Miner successfully installed into ${minersDir}/${MINER}"
}


function install_xmrig_nvidia_cuda_support {
    cd ${TMP_DIR}
    MINER="xmrig"

    echo "Installing ${MINER} (cuda support)..."

    echo " - downloading..."
    mkdir -p xmrig-source && cd xmrig-source
    git clone https://github.com/xmrig/xmrig-cuda.git >/dev/null 2>&1

    echo " - compiling..."
    mkdir xmrig-cuda/build && cd xmrig-cuda/build
    cmake .. -DCUDA_LIB=/usr/local/cuda/lib64/stubs/libcuda.so -DCUDA_TOOLKIT_ROOT_DIR=/usr/local/cuda >/dev/null 2>&1
    make -j$(nproc) >/dev/null 2>&1

    echo " - installing..."
    rm -rf ${minersDir}/xmrig/libxmrig-cuda.so
    mkdir -p ${minersDir}/xmrig
    cp -a libxmrig-cuda.so ${minersDir}/xmrig/

    echo
    echo "Cuda support for XMRig successfully installed into ${minersDir}/${MINER}"
}


function clean_tmp_dir {
    rm -rf $TMP_DIR
}




##################################################################


function showMinersList {
    _INSTALLABLE_MINERS=$INSTALLABLE_MINERS
    if [ "$_INSTALLABLE_MINERS" = "" ]; then
        _INSTALLABLE_MINERS="no miner installed"
    fi
    echo "    * installable miners: $_INSTALLABLE_MINERS"

    echo

    _INSTALLED_MINERS=$INSTALLED_MINERS
    if [ "$_INSTALLED_MINERS" = "" ]; then
        _INSTALLED_MINERS="no miner installed"
    fi
    echo "    * installed   miners: $_INSTALLED_MINERS"
}

INSTALLABLE_MINERS="autolykosv2_amd autolykosv2_nvidia bminer bzminer claymore ethminer firominer firominer_sources_amd gminer kawpowminer_amd kawpowminer_nvidia lolminer miniz nanominer nbminer srbminer teamredminer trex wildrig xmrig xmrig_sources_free xmrig_nvidia_cuda_support"


miner=$1


if [ "$miner" = "" ]; then
    CMD=$(basename $BASH_SOURCE)

    echo "=============="
    echo "| FreeMining | ==> [${FRM_MODULE^^}] ==> [${FRM_PACKAGE^^}]"
    echo "=============="
    echo

    echo "Usage:"
    echo
    echo "  $CMD <miner>"
    echo
    echo

    showMinersList

    echo

    exit
fi



if ! test -d ${minersDir}; then
    echo "Creating miners folder: ${minersDir}"

    PARENT_DIR=$(dirname $minersDir)

    if test -w ${PARENT_DIR}; then
        mkdir -p ${minersDir}
        chown $USER: ${minersDir}

    else
        echo "Folder $PARENT_DIR is not writable"
        rootRequired
        sudo mkdir -p ${minersDir}
        sudo chown $USER: ${minersDir}
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

if [ "$miner" = "firominer" ]; then
    install_firominer
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

if [ "$miner" = "xmrig" ]; then
    install_xmrig
fi

if [ "$miner" = "xmrig_sources_free" ]; then
    install_xmrig_sources_free
fi

if [ "$miner" = "xmrig_nvidia_cuda_support" ]; then
    install_xmrig_nvidia_cuda_support
fi


clean_tmp_dir

