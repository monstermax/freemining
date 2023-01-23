#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh
set -e

# Usage:
# ./install_miner.sh ps


miner=$1
shift || true

FRM_PACKAGE="miner_install"


function usage {
    CMD=$(basename $BASH_SOURCE)

    echo "=============="
    echo "| FreeMining | ==> [${FRM_MODULE^^}] ==> [${FRM_PACKAGE^^}]"
    echo "=============="
    echo

    echo "Usage:"
    echo
    echo "  $CMD {miner} [ --daemon ]"
    echo
    echo

    showMinersList

    echo
}


################################################################################


TMP_DIR=$(mktemp -d)
mkdir -p ${TMP_DIR}

mkdir -p ${rigLogDir}/miners
mkdir -p ${rigPidDir}/miners
mkdir -p ${rigDataDir}/miners
mkdir -p ${minersDir}


# install basic tools
installBasicTools

# install nodejs + npm + typescript
installNodejsPackages


################################################################################


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
    rm -rf ${minersDir}/${MINER}
    cp -a lolminer/1.65 ${minersDir}/${MINER}

    ${minersDir}/${MINER}/lolMiner --list-device

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
    rm -rf ${minersDir}/${MINER}
    cp -a gminer ${minersDir}

    ${minersDir}/${MINER}/miner --list_devices

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
    rm -rf ${minersDir}/${MINER}
    cp -a t-rex ${minersDir}/${MINER}

    ${minersDir}/${MINER}/t-rex --devices-info

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
    rm -rf ${minersDir}/${MINER}
    cp -a NBMiner_Linux ${minersDir}/${MINER}

    ${minersDir}/${MINER}/nbminer --device-info

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
    rm -rf ${minersDir}/${MINER}
    cp -a teamredminer-v0.10.7-linux ${minersDir}/${MINER}

    ${minersDir}/${MINER}/teamredminer --list_devices

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
    rm -rf ${minersDir}/${MINER}
    cp -a bzminer_v12.2.0_linux ${minersDir}/${MINER}

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
    rm -rf ${minersDir}/${MINER}
    cp -a Claymore.s.Dual.Ethereum.AMD+NVIDIA.GPU.Miner.v15.0.-.LINUX ${minersDir}/${MINER}
    chmod +x ${minersDir}/${MINER}/ethdcrminer64

    ${minersDir}/${MINER}/ethdcrminer64 -list

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
    rm -rf ${minersDir}/${MINER}
    cp -a nanominer ${minersDir}/${MINER}

    ${minersDir}/${MINER}/nanominer -d

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
    rm -rf ${minersDir}/${MINER}
    cp -a miniz ${minersDir}/${MINER}

    ${minersDir}/${MINER}/miniZ --cuda-info

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
    rm -rf ${minersDir}/${MINER}
    cp -a firominer ${minersDir}/${MINER}

    ${minersDir}/${MINER}/firominer --list-devices

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
    #echo "FAILED"

    echo " - compiling (2/2)..."
    make -sj $(nproc)

    echo " - installing..."
    #rm -rf ${minersDir}/${MINER}
    #mkdir -p ${minersDir}/${MINER}
    #cp -a firominer ${minersDir}/${MINER}/firominer-amd

    echo
    #echo "Miner successfully installed into ${minersDir}/firominer"
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
    rm -rf ${minersDir}/${MINER}
    cp -a wildrig ${minersDir}/${MINER}

    ${minersDir}/${MINER}/wildrig-multi --print-devices

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
    rm -rf ${minersDir}/${MINER}
    mkdir -p ${minersDir}/${MINER}
    cp -a linux-ubuntu20-cuda11-1.2.4/kawpowminer ${minersDir}/${MINER}/kawpowminer-nvidia

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
    rm -rf ${minersDir}/${MINER}
    mkdir -p ${minersDir}/${MINER}
    cp -a linux-ubuntu20-opencl-1.2.4/kawpowminer ${minersDir}/${MINER}/kawpowminer-amd

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
    rm -rf ${minersDir}/${MINER}
    cp -a bminer-v16.4.11-2849b5c ${minersDir}/${MINER}

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
    rm -rf ${minersDir}/${MINER}
    mkdir -p ${minersDir}/${MINER}
    cp -a NV_Miner/NV_Miner_Linux_CUDA11_4.2.0 ${minersDir}/${MINER}/autolykosv2-nvidia

    echo
    echo "Miner successfully installed into ${minersDir}/autolykosv2"
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
    rm -rf ${minersDir}/${MINER}
    mkdir -p ${minersDir}/${MINER}
    cp -a AMD_Miner/AMD_Miner_UBUNTU_2.1 ${minersDir}/${MINER}/autolykosv2-amd

    echo
    echo "Miner successfully installed into ${minersDir}/autolykosv2"
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
    rm -rf ${minersDir}/${MINER}
    cp -a ethminer-0.18.0-cuda-9/bin ${minersDir}/${MINER}

    ${minersDir}/${MINER}/ethminer --list-devices

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
    rm -rf ${minersDir}/${MINER}
    cp -a SRBMiner-Multi-2-0-1 ${minersDir}/${MINER}

    echo " - testing..."
    ${minersDir}/${MINER}/SRBMiner-MULTI --list-devices

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
    rm -rf ${minersDir}/${MINER}/${MINER}
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
    rm -rf ${minersDir}/${MINER}
    mkdir -p ${minersDir}/${MINER}
    cp -a xmrig ${minersDir}/${MINER}/xmrig-nofees
    if ! test -d ${minersDir}/xmrig; then
        cd ${minersDir}
        ln -s xmrig ${MINER}
    fi

    echo " - testing..."
    ${minersDir}/${MINER}/xmrig-nofees --print-platforms

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
    echo "Cuda support for XMRig successfully installed into ${minersDir}/xmrig"
}


################



function clean_tmp_dir {
    rm -rf $TMP_DIR
}


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



################################################################################


if [ "$miner" = "" ]; then
    usage
    exit 0
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
    true
elif [ "$miner" = "gminer" ]; then
    true
elif [ "$miner" = "trex" ]; then
    true
elif [ "$miner" = "nbminer" ]; then
    true
elif [ "$miner" = "teamredminer" ]; then
    true
elif [ "$miner" = "bzminer" ]; then
    true
elif [ "$miner" = "claymore" ]; then
    true
elif [ "$miner" = "nanominer" ]; then
    true
elif [ "$miner" = "miniz" ]; then
    true
elif [ "$miner" = "firominer" ]; then
    true
elif [ "$miner" = "firominer_sources_amd" ]; then
    true
elif [ "$miner" = "wildrig" ]; then
    true
elif [ "$miner" = "kawpowminer_nvidia" ]; then
    true
elif [ "$miner" = "kawpowminer_amd" ]; then
    true
elif [ "$miner" = "bminer" ]; then
    true
elif [ "$miner" = "autolykosv2_nvidia" ]; then
    true
elif [ "$miner" = "autolykosv2_amd" ]; then
    true
elif [ "$miner" = "ethminer" ]; then
    true
elif [ "$miner" = "srbminer" ]; then
    true
elif [ "$miner" = "xmrig" ]; then
    true
elif [ "$miner" = "xmrig_sources_free" ]; then
    true
elif [ "$miner" = "xmrig_nvidia_cuda_support" ]; then
    true
else
    usage
    exit 1
fi


if hasOpt --daemon; then
    # run in daemon mode
    x=$@ ; set -- $(removeOpt "$x" "--daemon")

    DAEMON_NAME="freemining.${FRM_MODULE}.${FRM_PACKAGE}.${miner}"
    DAEMON_CMD="$0 ${miner}"
    DAEMON_CMD="python3 ../../common/bash/exec_name.py $DAEMON_NAME $DAEMON_CMD" # wrap to change the shell process name
    daemon_manager $@

else
    # normal run
    install_${miner}
fi


clean_tmp_dir

