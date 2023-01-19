#!/bin/bash

cd `dirname $0`

source ../node_manager.sh
set -e


FRM_PACKAGE="fullnode_install"

TMP_DIR=$(mktemp -d)
mkdir -p ${TMP_DIR}

mkdir -p ${nodeLogDir}/fullnodes
mkdir -p ${nodePidDir}/fullnodes
mkdir -p ${nodeDataDir}/fullnodes
mkdir -p ${fullnodesDir}


# install basic tools
installBasicTools

# install nodejs + npm + typescript
installNodejsPackages




function install_callisto {
    cd ${TMP_DIR}

    chain="callisto"
    VERSION="1.3.1"
    DL_URL="https://github.com/EthereumCommonwealth/go-callisto/releases/download/${VERSION}/geth-linux-amd64"
    DL_FILE=$(basename $DL_URL)
    #UNZIP_DIR="${chain}-unzipped"
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    echo "Installing ${chain} ${VERSION}..."

    echo " - Downloading ${chain}"
    wget -q $DL_URL
    chmod 775 ${DL_FILE}

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mkdir -p ${fullnodesDir}/${chain}
    mv ${DL_FILE} ${fullnodesDir}/${chain}/

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}


function install_ergo {
    cd ${TMP_DIR}

    chain="ergo"
    VERSION="5.0.5"
    DL_URL="https://github.com/ergoplatform/ergo/releases/download/v${VERSION}/ergo-${VERSION}.jar"
    DL_FILE=$(basename $DL_URL)
    UNZIP_DIR="${chain}-unzipped"
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    echo "Installing ${chain} ${VERSION}..."

    if [ "`getCmdPath java`" = "" ]; then
        echo " - Installing dependencies packages: Java-JDK"
        rootRequired
        sudo apt-get install -qq default-jdk -y
    fi

    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Preparing"
    CONF_DIR=${nodeConfDir}/fullnodes/${chain}
    mkdir -p $CONF_DIR

    poolName=$(jq '.poolName' $POOL_CONFIG_FILE)
    apiKeyHash=$(jq '.fullnodes.ergo.apiKeyHash' $POOL_CONFIG_FILE)

    CONF_DIR_REAL=$(realpath $CONF_DIR)

    cat << _EOF > ${CONF_DIR}/ergo.conf

ergo {
    directory = ${CONF_DIR}

    node {
        mining = true
    }

    chain {
        reemission {
            checkReemissionRules = true
        }
    }

}

scorex {
    restApi {
        #bindAddress = "0.0.0.0:9053"
        apiKeyHash = "${apiKeyHash}"
    }

    network {
        #nodeName = "ergo-yo"
        #bindAddress = "0.0.0.0:9020"
    }
}


_EOF

    cat << _EOF > start.sh
#!/bin/bash

java -jar -Xmx4G ${fullnodesDir}/${chain}/${DL_FILE} --mainnet -c ${CONF_DIR_REAL}/ergo.conf

_EOF

    cat << _EOF > stop.sh
#!/bin/bash

pkill -f jar.*ergo-.*\.jar

_EOF

    cat << _EOF > status.sh
#!/bin/bash

pgrep -f -a jar.*ergo-.*\.jar

_EOF

    chmod +x *.sh

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mkdir -p ${fullnodesDir}/${chain}
    cp -a *.jar *.sh ${fullnodesDir}/${chain}/
    cd ${fullnodesDir}/${chain}
    ln -s ${DL_FILE} ergo.jar

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}


function install_ethereum {
    cd ${TMP_DIR}

    chain="ethereum"
    VERSION="1.10.26-e5eb32ac"
    DL_URL="https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-${VERSION}.tar.gz"
    DL_FILE=$(basename $DL_URL)
    UNZIP_DIR="${chain}-unzipped"
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    echo "Installing ${chain} ${VERSION}..."

    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Unzipping"
    tar zxf $DL_FILE

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mv geth-linux-amd64-${VERSION} ${fullnodesDir}/${chain}

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}


function install_ethereum_classic {
    cd ${TMP_DIR}

    chain="ethereum_classic"
    VERSION="1.12.8"
    DL_URL="https://github.com/etclabscore/core-geth/releases/download/v${VERSION}/core-geth-linux-v${VERSION}.zip"
    DL_FILE=$(basename $DL_URL)
    UNZIP_DIR="${chain}-unzipped"
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    echo "Installing ${chain} ${VERSION}..."

    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Unzipping"
    unzip -q $DL_FILE -d $UNZIP_DIR

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mkdir -p ${fullnodesDir}/${chain}
    mv $UNZIP_DIR/* ${fullnodesDir}/${chain}/

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}


function install_firo {
    cd ${TMP_DIR}

    chain="firo"
    VERSION="0.14.12.0"
    DL_URL="https://github.com/firoorg/firo/releases/download/v${VERSION}/firo-${VERSION}-linux64.tar.gz"
    DL_FILE=$(basename $DL_URL)
    UNZIP_DIR="${chain}-unzipped"
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    echo "Installing ${chain} ${VERSION}..."

    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Unzipping"
    tar zxf $DL_FILE

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mv firo-*/bin ${fullnodesDir}/${chain}

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}


function install_flux {
    cd ${TMP_DIR}

    chain="flux"
    VERSION=""
    #DL_URL=""
    #DL_FILE=$(basename $DL_URL)
    #UNZIP_DIR="${chain}-unzipped"
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"

    zelnodePrivKey="YOUR_ZELNODE_PK"
    zelnodeOutPoint="YOUR_COLLATERAL_TXID"
    zelnodeIndex="TX_OUTPUT_INDEX"
    externalIp=$(wget -qO- https://api4.my-ip.io/ip)
    bindIp="0.0.0.0"

    ipAddress="SERVER_IP_ADDRESS"
    zelId="YOUR_ZELID"
    cruxId="YOUR_CRUXID"
    testNet="false"

    >${INSTALL_LOG}

    echo "Installing ${chain} ${VERSION}..."

    #echo " - Installing dependencies packages: build tools"
    #rootRequired

    #apt-get update -qq
    #apt-get install -qq -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common
    #curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/trusted.gpg.d/docker.asc >/dev/null
    #add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    #apt-get update -qq
    #apt-get install -qq -y docker-ce docker-ce-cli containerd.io

    #sudo apt-get update -qq
    #sudo apt-get upgrade -qq -y 
    #sudo apt-get install -qq -y build-essential pkg-config libc6-dev m4
    #sudo apt-get install -qq -y g++-multilib autoconf libtool ncurses-dev unzip git python
    #sudo apt-get install -qq -y python-zmq zlib1g-dev wget curl bsdmainutils automake

    mkdir -p ${nodeConfDir}/fullnodes/${chain}/zelcash
    touch ${nodeConfDir}/fullnodes/${chain}/zelcash/zelcash.conf

    cat << EOF > ${nodeConfDir}/fullnodes/${chain}/zelcash/zelcash.conf
rpcuser=user
rpcpassword=pass
rpcallowip=127.0.0.1
#rpcallowip=172.18.0.1
rpcport=16124
port=16125
#zelnode=1
#zelnodeprivkey=${zelnodePrivKey}
#zelnodeoutpoint=${zelnodeOutPoint}
#zelnodeindex=${zelnodeIndex}
server=1
daemon=1
txindex=1
listen=1
externalip=${externalIp}
bind=${bindIp}
addnode=explorer.zel.cash
addnode=explorer2.zel.cash
addnode=explorer.zel.zelcore.io
addnode=blockbook.zel.network
maxconnections=256
EOF

    # Bootstrap
    #wget https://www.dropbox.com/s/kyqe8ji3g1yetfx/zel-bootstrap.zip
    #unzip zel-bootstrap.zip -d ${nodeConfDir}/fullnodes/${chain}/zelcash
    #rm zel-bootstrap.zip

    if [ "`getCmdPath mongod`" = "" ]; then
        echo " - Installing MongoDB"
        rootRequired
        wget -qO- https://www.mongodb.org/static/pgp/server-4.2.asc | sudo tee /etc/apt/trusted.gpg.d/mongodb-server-4.2.asc >/dev/null
        echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list >/dev/null

        sudo apt-get update -qq
        sudo apt-get install -qq -y mongodb-org
        sudo service mongod start
        sudo systemctl enable mongod
    fi


    #echo " - Downloading dependencies: NVM, NodeJS"
    #VERSION="0.35.3"
    #wget https://raw.githubusercontent.com/nvm-sh/nvm/v${VERSION}/install.sh
    #bash install.sh
    #source ~/.profile
    #nvm install --lts


    # Installing zelcashd
    echo " - Installing ${chain}/zelcashd"
    rootRequired

    #echo 'deb https://apt.zel.cash/ all main' | sudo tee /etc/apt/sources.list.d/zelcash.list >/dev/null
    #echo 'deb https://zelcash.github.io/aptrepo/ all main' | sudo tee /etc/apt/sources.list.d/zelcash.list
    echo 'deb https://apt.runonflux.io/ '$(lsb_release -cs)' main' | sudo tee /etc/apt/sources.list.d/zelcash.list >/dev/null

    gpg --keyserver keyserver.ubuntu.com --recv 4B69CA27A986265D >/dev/null
    gpg --export 4B69CA27A986265D 2>/dev/null | sudo tee /etc/apt/trusted.gpg.d/zelcash.asc >/dev/null

    sudo apt-get update -qq
    sudo apt-get install -qq -y zelcash zelbench

    zelcash-fetch-params.sh >/dev/null



    echo " - Downloading ${chain}/zelflux"
    git clone https://github.com/zelcash/zelflux.git >>${INSTALL_LOG} 2>>${INSTALL_LOG}


    mkdir -p ${nodeConfDir}/fullnodes/${chain}/zelflux/config
    touch ${nodeConfDir}/fullnodes/${chain}/zelflux/config/userconfig.js

    cat << EOF > ${nodeConfDir}/fullnodes/${chain}/zelflux/config/userconfig.js
module.exports = {
    initial: {
        ipaddress: '${ipAddress}',
        zelid: '${zelId}',
        cruxid: '${cruxId}',
        testnet: ${testNet}
    }
}
EOF


    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mkdir -p ${fullnodesDir}/${chain}
    mv zelflux ${fullnodesDir}/${chain}/


    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"

    # Starting zelcashd
    #zelcashd -datadir=${nodeConfDir}/fullnodes/flux/zelcash >/dev/null 2>&1

    # Starting zelflux
    #cd ${fullnodesDir}/${chain}
    #./zelflux/start.sh
    #cd - >/dev/null

    # Cli
    #zelcash-cli -datadir=$HOME/.freemining/fullnodes/flux/zelcash getnetworkinfo
    #zelcash-cli -datadir=$HOME/.freemining/fullnodes/flux/zelcash getconnectioncount
    #zelcash-cli -datadir=$HOME/.freemining/fullnodes/flux/zelcash getblockchaininfo
    #zelcash-cli -datadir=$HOME/.freemining/fullnodes/flux/zelcash getblockcount
    #zelcash-cli -datadir=$HOME/.freemining/fullnodes/flux/zelcash getnewaddress
    #zelcash-cli -datadir=$HOME/.freemining/fullnodes/flux/zelcash z_getnewaddress
    #zelcash-cli -datadir=$HOME/.freemining/fullnodes/flux/zelcash dumpprivkey <address>
    #zelcash-cli -datadir=$HOME/.freemining/fullnodes/flux/zelcash help
}


function install_kaspa {
    cd ${TMP_DIR}

    chain="kaspa"
    VERSION="0.12.11"
    DL_URL="https://github.com/kaspanet/kaspad/releases/download/v${VERSION}/kaspad-v${VERSION}-linux.zip"
    DL_FILE=$(basename $DL_URL)
    UNZIP_DIR="${chain}-unzipped"
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    echo "Installing ${chain} ${VERSION}..."

    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Unzipping"
    unzip -q $DL_FILE -d $UNZIP_DIR

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mv $UNZIP_DIR/bin ${fullnodesDir}/${chain}

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}


function install_komodo {
    cd ${TMP_DIR}

    chain="komodo"
    VERSION=""
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    echo "Installing ${chain} ${VERSION}..."

    echo " - Installing dependencies packages: build tools"
    rootRequired
    sudo apt-get update -qq
    sudo apt-get upgrade -qq -y
    sudo apt-get install -qq -y build-essential pkg-config libc6-dev m4 g++-multilib autoconf libtool ncurses-dev unzip git zlib1g-dev wget curl bsdmainutils automake cmake clang ntp ntpdate nano >>${INSTALL_LOG} 2>>${INSTALL_LOG}


    echo " - Downloading ${chain}"
    git clone https://github.com/KomodoPlatform/komodo >>${INSTALL_LOG} 2>>${INSTALL_LOG}
    cd komodo

    echo " - Fetching params"
    ./zcutil/fetch-params.sh >>${INSTALL_LOG}

    echo " - Compiling ${chain}"
    ./zcutil/build.sh -j$(nproc) >>${INSTALL_LOG}

    CONF_DIR=${nodeConfDir}/fullnodes/${chain}
    mkdir -p $CONF_DIR

    cat << _EOF > ${CONF_DIR}/komodo.conf
rpcuser=user
rpcpassword=pass
txindex=1
bind=127.0.0.1
rpcbind=127.0.0.1
addnode=78.47.196.146
addnode=5.9.102.210
addnode=178.63.69.164
addnode=88.198.65.74
addnode=5.9.122.241
addnode=144.76.94.38
addnode=148.251.44.16
_EOF

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mkdir -p ${fullnodesDir}/${chain}
    cp -a src/{komodod,komodo-cli,komodo-tx} ${fullnodesDir}/${chain}/

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}


function install_meowcoin {
    cd ${TMP_DIR}

    chain="meowcoin"
    VERSION="1.0.3"
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    DL_URL="https://github.com/JustAResearcher/Meowcoin/releases/download/V${VERSION}/MEOW-${VERSION}-CLI-x86_64-linux-gnu.tar.gz"
    DL_FILE=$(basename $DL_URL)

    DL_URL_QT="https://github.com/JustAResearcher/Meowcoin/releases/download/V${VERSION}/MEOW-${VERSION}-Qt-x86_64-linux-gnu.tar.gz"
    DL_FILE_QT=$(basename $DL_URL_QT)

    UNZIP_DIR="${chain}-unzipped"

    echo "Installing ${chain} ${VERSION}..."

    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Unzipping"
    mkdir $UNZIP_DIR
    tar zxf ${DL_FILE} -C $UNZIP_DIR

    if [ "1" = "0" ]; then
        echo " - Downloading Qt fullnode"
        wget -q $DL_URL_QT

        echo " - Unzipping Qt fullnode"
        unzip -q ${DL_FILE_QT} -d $UNZIP_DIR
    fi

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mv $UNZIP_DIR ${fullnodesDir}/${chain}

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}


function install_monero {
    cd ${TMP_DIR}

    chain="monero"
    VERSION=""
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    DL_URL="https://downloads.getmonero.org/cli/linux64"

    echo "Installing ${chain} ${VERSION}..."

    echo " - Downloading ${chain}"
    wget -q --content-disposition $DL_URL
    DL_FILE=$(basename monero-linux-x64-v*.tar.bz2)

    echo " - Unzipping"
    tar xf $DL_FILE
    UNZIP_DIR=$(basename monero-x86_64-linux-gnu-v*)

    echo " - Preparing"
    CONF_DIR=${nodeConfDir}/fullnodes/${chain}
    mkdir -p $CONF_DIR

    CONF_DIR_REAL=$(realpath $CONF_DIR)

    cat << _EOF > ${CONF_DIR}/monerod.conf
#blockchain data / log locations
data-dir=${CONF_DIR_REAL}
log-file=${CONF_DIR_REAL}/monerod.log

#log options
log-level=0
max-log-file-size=0 # Prevent monerod from managing the log files; we want logrotate to take care of that

# P2P full node
p2p-bind-ip=0.0.0.0 # Bind to all interfaces (the default)
p2p-bind-port=18080 # Bind to default port
public-node=false # Advertises the RPC-restricted port over p2p peer lists

# rpc settings
rpc-restricted-bind-ip=127.0.0.1
rpc-restricted-bind-port=18089

rpc-bind-ip=127.0.0.1
rpc-bind-port=18081

# i2p settings
tx-proxy=i2p,127.0.0.1:8060

# node settings
prune-blockchain=true
db-sync-mode=safe # Slow but reliable db writes
enforce-dns-checkpointing=true
enable-dns-blocklist=true # Block known-malicious nodes
no-igd=true # Disable UPnP port mapping
no-zmq=true # ZMQ configuration

# bandwidth settings
out-peers=32 # This will enable much faster sync and tx awareness; the default 8 is suboptimal nowadays
in-peers=32 # The default is unlimited; we prefer to put a cap on this
limit-rate-up=1048576 # 1048576 kB/s == 1GB/s; a raise from default 2048 kB/s; contribute more to p2p network
limit-rate-down=1048576 # 1048576 kB/s == 1GB/s; a raise from default 8192 kB/s; allow for faster initial sync

_EOF


    cat << _EOF > ${CONF_DIR}/monero-wallet-rpc.conf
daemon-address=127.0.0.1:18081

rpc-bind-ip=127.0.0.1
rpc-bind-port=18082
rpc-login=user:pass

log-file=${CONF_DIR_REAL}/monero_wallet_rpc.log
log-level=1 

wallet-file=${CONF_DIR_REAL}/local_wallet/freemining

_EOF

    mkdir -p touch ${CONF_DIR}/local_wallet
    echo secret > ${CONF_DIR}/local_wallet/freemining.secret

    NODE_DIR_REAL=$(realpath ${fullnodesDir}/${chain})

    cat << _EOF > start.sh
#!/bin/bash

${NODE_DIR_REAL}/monerod --config-file ${CONF_DIR_REAL}/monerod.conf --pidfile ${CONF_DIR_REAL}/monerod.pid --detach

sleep 1

${NODE_DIR_REAL}/create_wallet.sh

${NODE_DIR_REAL}/monero-wallet-rpc --daemon-address 127.0.0.1:18081 --disable-rpc-login --config-file ${CONF_DIR_REAL}/monero-wallet-rpc.conf --password-file ${CONF_DIR_REAL}/local_wallet/freemining.secret --detach

_EOF


    cat << _EOF > create_wallet.sh
#!/bin/bash

set -e

if test -f ${CONF_DIR_REAL}/local_wallet/freemining; then
    exit
fi

${NODE_DIR_REAL}/monero-wallet-cli --daemon-address 127.0.0.1:18081 --create-address-file --mnemonic-language English --generate-new-wallet ${CONF_DIR_REAL}/local_wallet/freemining --password-file ${CONF_DIR_REAL}/local_wallet/freemining.secret

echo "Wallet created in ${CONF_DIR_REAL}/local_wallet"

_EOF

    cat << _EOF > stop.sh
#!/bin/bash

pkill -f monero-wallet-rpc
pkill -f monerod

_EOF

    cat << _EOF > status.sh
#!/bin/bash

pgrep -f -a monerod
pgrep -f -a monero-wallet-rpc

_EOF

    chmod +x *.sh

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mkdir -p ${fullnodesDir}/${chain}
    cp -a *.sh ${UNZIP_DIR}/monero* ${fullnodesDir}/${chain}/

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}


function install_neoxa {
    cd ${TMP_DIR}

    chain="neoxa"
    VERSION="1.0.3"
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    DL_URL="https://github.com/NeoxaChain/Neoxa/releases/download/v${VERSION}/neoxad-linux64.zip"
    DL_FILE=$(basename $DL_URL)

    DL_URL_QT="https://github.com/NeoxaChain/Neoxa/releases/download/v${VERSION}/neoxa-qt-linux64.zip"
    DL_FILE_QT=$(basename $DL_URL_QT)

    UNZIP_DIR="${chain}-unzipped"

    echo "Installing ${chain} ${VERSION}..."

    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Unzipping"
    unzip -q ${DL_FILE} -d $UNZIP_DIR

    if [ "1" = "0" ]; then
        echo " - Downloading Qt fullnode"
        wget -q $DL_URL_QT

        echo " - Unzipping Qt fullnode"
        unzip -q ${DL_FILE_QT} -d $UNZIP_DIR
    fi

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mv $UNZIP_DIR ${fullnodesDir}/${chain}

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}


function install_radiant {
    cd ${TMP_DIR}

    chain="radiant"
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    echo "Installing ${chain} sources..."

    echo " - Installing dependencies packages: build tools"
    rootRequired
    sudo apt-get install -qq -y build-essential cmake git libboost-chrono-dev libboost-filesystem-dev libboost-test-dev libboost-thread-dev libevent-dev libminiupnpc-dev libssl-dev libzmq3-dev help2man ninja-build python3
    sudo apt-get install -qq -y libdb-dev libdb++-dev
    sudo apt-get install -qq -y libqrencode-dev libprotobuf-dev protobuf-compiler qttools5-dev

    echo " - Downloading sources"
    git clone https://github.com/RadiantBlockchain/radiant-node >>${INSTALL_LOG} 2>>${INSTALL_LOG}

    echo " - Compiling ${chain} (1/2)"
    mkdir radiant-node/build && cd radiant-node/build
    cmake -GNinja .. -DBUILD_RADIANT_QT=OFF >>${INSTALL_LOG}
    # OR cmake -GNinja ..

    echo " - Compiling ${chain} (2/2)"
    ninja >>${INSTALL_LOG}

    echo " - Install tmp"
    rm -rf dist
    DESTDIR="dist" ninja install

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    mkdir -p ${fullnodesDir}/${chain}
    cp -a ./dist/usr/local/* ${fullnodesDir}/${chain}/

    cd ${fullnodesDir}/${chain}
    ln -s bin/radiantd
    ln -s bin/radiant-cli
    ln -s bin/radiant-wallet
    ln -s bin/radiant-tx

    cd ..
    rm -rf build

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}


function install_raptoreum {
    cd ${TMP_DIR}

    chain="raptoreum"
    VERSION=""
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    if grep -q "Debian GNU/Linux 11" /etc/os-release; then
        VERSION="1.13.17.02"
        VERSION_LONG="ubuntu20-1.3.17.02-candidate"

    elif grep -q "Ubuntu 22.04" /etc/os-release; then
        VERSION="1.13.17.02"
        VERSION_LONG="ubuntu22-1.3.17.02-candidate"
    fi

    if [ "$VERSION" != "" ]; then
        DL_URL="https://github.com/Raptor3um/raptoreum/releases/download/${VERSION}/raptoreum-${VERSION_LONG}.tar.gz"
        DL_FILE=$(basename $DL_URL)
        UNZIP_DIR="${chain}-unzipped"

        echo "Installing ${chain} ${VERSION} ${VERSION_LONG}..."

        echo " - Downloading ${chain}"
        wget -q $DL_URL

        echo " - Unzipping"
        mkdir $UNZIP_DIR
        tar zxf $DL_FILE -C $UNZIP_DIR

        echo " - Install into ${fullnodesDir}/${chain}"
        rm -rf ${fullnodesDir}/${chain}
        mv $UNZIP_DIR ${fullnodesDir}/${chain}

    else
        # install from sources
        echo "Installing ${chain} sources..."

        echo " - Installing dependencies packages: build tools"
        rootRequired
        sudo apt-get install -qq -y curl build-essential libtool autotools-dev automake pkg-config python3 bsdmainutils

        git clone https://github.com/Raptor3um/raptoreum/ >>${INSTALL_LOG} 2>>${INSTALL_LOG}
        cd raptoreum/depends

        make -j$(nproc) >>${INSTALL_LOG}
        cd ..

        ./autogen.sh >>${INSTALL_LOG}
        ./configure --prefix=`pwd`/depends/x86_64-pc-linux-gnu >>${INSTALL_LOG}

        make >>${INSTALL_LOG}
        #make install # optional

        cd src
        # EDIT ME
    fi

    rm -rf ${UNZIP_DIR}

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}


function install_ravencoin {
    cd ${TMP_DIR}

    chain="ravencoin"
    VERSION="4.3.2.1"
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    DL_URL="https://github.com/RavenProject/Ravencoin/releases/download/v${VERSION}/raven-${VERSION}-x86_64-linux-gnu.zip"
    DL_FILE=$(basename $DL_URL)
    UNZIP_DIR="${chain}-unzipped"

    echo "Installing ${chain} ${VERSION}..."

    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Unzipping"
    unzip -q $DL_FILE -d ${UNZIP_DIR}

    mv ${UNZIP_DIR}/linux/raven-${VERSION}-x86_64-linux-gnu.tar.gz .
    echo " - Unzipping second archive"
    tar zxf raven-${VERSION}-x86_64-linux-gnu.tar.gz

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    cp -a ./raven-${VERSION}/bin ${fullnodesDir}/${chain}

    rm -rf ${UNZIP_DIR}

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}



function install_zcash {
    cd ${TMP_DIR}

    chain="zcash"
    VERSION="5.3.2"
    INSTALL_LOG="${nodeLogDir}/fullnodes/${chain}_install.log"
    >${INSTALL_LOG}

    DL_URL="https://z.cash/downloads/zcash-${VERSION}-linux64-debian-buster.tar.gz"
    DL_FILE=$(basename $DL_URL)
    #UNZIP_DIR="${chain}-unzipped"

    echo "Installing ${chain} ${VERSION}..."

    echo " - Downloading ${chain}"
    wget -q $DL_URL

    echo " - Unzipping"
    tar zxf $DL_FILE

    echo " - Install into ${fullnodesDir}/${chain}"
    rm -rf ${fullnodesDir}/${chain}
    cp -a ./zcash-${VERSION}/bin ${fullnodesDir}/${chain}

    echo
    echo "Fullnode successfully installed into ${fullnodesDir}/${chain}"
}




function clean_tmp_dir {
    rm -rf $TMP_DIR
}




##################################################################



function showFullnodesList {
    _INSTALLABLE_FULLNODES=$INSTALLABLE_FULLNODES
    if [ "$_INSTALLABLE_FULLNODES" = "" ]; then
        _INSTALLABLE_FULLNODES="no fullnode installed"
    fi
    echo "    * installable fullnodes: $_INSTALLABLE_FULLNODES"

    echo

    _INSTALLED_FULLNODES=$INSTALLED_FULLNODES
    if [ "$_INSTALLED_FULLNODES" = "" ]; then
        _INSTALLED_FULLNODES="no fullnode installed"
    fi
    echo "    * installed   fullnodes: $_INSTALLED_FULLNODES"

}

INSTALLABLE_FULLNODES="callisto ergo ethereum ethereum_classic firo flux kaspa komodo meowcoin monero neoxa radiant raptoreum ravencoin zcash"


fullnode=$1


if [ "$fullnode" = "" ]; then
    CMD=$(basename $BASH_SOURCE)

    echo "=============="
    echo "| FreeMining | ==> [${FRM_MODULE^^}] ==> [${FRM_PACKAGE^^}]"
    echo "=============="
    echo

    echo "Usage:"
    echo
    echo "  $CMD <fullnode>"
    echo
    echo

    showFullnodesList

    echo

    exit
fi




if ! test -d ${fullnodesDir}; then
    echo "Creating nodes folder: ${fullnodesDir}"

    PARENT_DIR=$(dirname $fullnodesDir)

    if test -w ${PARENT_DIR}; then
        mkdir -p ${fullnodesDir}
        chown $USER: ${fullnodesDir}

    else
        echo "Folder $PARENT_DIR is not writable"
        rootRequired
        sudo mkdir -p ${fullnodesDir}
        sudo chown $USER: ${fullnodesDir}
    fi
fi





if [ "$fullnode" = "callisto" ]; then
    install_callisto
fi

if [ "$fullnode" = "ergo" ]; then
    install_ergo
fi

if [ "$fullnode" = "ethereum" ]; then
    install_ethereum
fi

if [ "$fullnode" = "ethereum_classic" ]; then
    install_ethereum_classic
fi

if [ "$fullnode" = "firo" ]; then
    install_firo
fi

if [ "$fullnode" = "flux" ]; then
    install_flux
fi

if [ "$fullnode" = "kaspa" ]; then
    install_kaspa
fi

if [ "$fullnode" = "komodo" ]; then
    install_komodo
fi

if [ "$fullnode" = "meowcoin" ]; then
    install_meowcoin
fi

if [ "$fullnode" = "monero" ]; then
    install_monero
fi

if [ "$fullnode" = "neoxa" ]; then
    install_neoxa
fi

if [ "$fullnode" = "radiant" ]; then
    install_radiant
fi

if [ "$fullnode" = "raptoreum" ]; then
    install_raptoreum
fi

if [ "$fullnode" = "ravencoin" ]; then
    install_ravencoin
fi

if [ "$fullnode" = "zcash" ]; then
    install_zcash
fi


clean_tmp_dir
