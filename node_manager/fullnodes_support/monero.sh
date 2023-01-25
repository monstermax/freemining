#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="latest"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$VERSION" $TMP_DIR

    local DL_URL="https://downloads.getmonero.org/cli/linux64"
    #local DL_FILE=$(basename $DL_URL)
    #local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    echo " - Downloading ${chain}"
    wget -q --content-disposition $DL_URL
    local DL_FILE=$(basename monero-linux-x64-v*.tar.bz2)

    echo " - Unzipping"
    tar xf $DL_FILE
    local UNZIP_DIR=$(basename monero-x86_64-linux-gnu-v*)

    echo " - Preparing"
    local CONF_DIR=${nodeConfDir}/fullnodes/${chain}
    mkdir -p $CONF_DIR

    local CONF_DIR_REAL=$(realpath $CONF_DIR)

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

    local NODE_DIR_REAL=$(realpath ${fullnodesDir}/${chain})

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

    fullnode_after_install "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=${fullnodesDir}/${FULLNODE}/monerod
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        --data-dir ${nodeConfDir}/fullnodes/${FULLNODE}
        --daemon-address 127.0.0.1:18081
        --disable-rpc-login
        --config-file ${nodeConfDir}/fullnodes/${FULLNODE}/monerod-wallet-rpc.conf
        --password-file ${nodeConfDir}/fullnodes/${FULLNODE}/monero_wallet/yomining.secret
        --non-interactive
        "
    echo $CMD_ARGS
}



function fullnode_status_txt {
    local FULLNODE=$1
    # not available
}


function fullnode_status_json {
    local FULLNODE=$1
    # not available
}





############################################


if [ "$0" = "$BASH_SOURCE" ]; then
    FILENAME=$(basename $0)
    FULLNODE=$(echo ${FILENAME%.*})

    if test "$1" = "--install-fullnode"; then
        fullnode_alias=$FULLNODE

        if hasOpt --alias; then
            fullnode_alias=$(getOpt --alias)
        fi

        fullnode_install $fullnode_alias $@

    else
        fullnode_run $FULLNODE $@
    fi
fi


