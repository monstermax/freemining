#!/bin/bash

cd `dirname $BASH_SOURCE`

source ./fullnodes_support.sh
set -e



function fullnode_install {
    local FULLNODE=$1
    local VERSION="5.0.5"
    local TMP_DIR=$(mktemp -d)
    fullnode_before_install "$FULLNODE" "$VERSION" $TMP_DIR

    local DL_URL="https://github.com/ergoplatform/ergo/releases/download/v${VERSION}/ergo-${VERSION}.jar"
    local DL_FILE=$(basename $DL_URL)
    local UNZIP_DIR="${FULLNODE}-unzipped"
    local INSTALL_LOG="${nodeLogDir}/fullnodes/${FULLNODE}_install.log"
    >${INSTALL_LOG}

    if [ "`getCmdPath java`" = "" ]; then
        echo " - Installing dependencies packages: Java-JDK"
        rootRequired
        sudo apt-get install -qq default-jdk -y
    fi

    echo " - Downloading ${FULLNODE}"
    wget -q $DL_URL

    echo " - Preparing"
    CONF_DIR=${nodeConfDir}/fullnodes/${FULLNODE}
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

java -jar -Xmx4G ${fullnodesDir}/${FULLNODE}/${DL_FILE} --mainnet -c ${CONF_DIR_REAL}/ergo.conf

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

    echo " - Install into ${fullnodesDir}/${FULLNODE}"
    rm -rf ${fullnodesDir}/${FULLNODE}
    mkdir -p ${fullnodesDir}/${FULLNODE}
    cp -a *.jar *.sh ${fullnodesDir}/${FULLNODE}/
    cd ${fullnodesDir}/${FULLNODE}
    ln -s ${DL_FILE} ergo.jar

    fullnode_after_install "$FULLNODE" "$VERSION" $TMP_DIR
}



function fullnode_get_run_cmd {
    local FULLNODE=$1
    shift || true

    local CMD_EXEC=/usr/bin/java
    echo $CMD_EXEC
}


function fullnode_get_run_args {
    local FULLNODE=$1

    local CMD_ARGS="
        -Xmx4G
        -jar ${fullnodesDir}/${FULLNODE}/ergo.jar
        --mainnet
        -c ${nodeConfDir}/fullnodes/${FULLNODE}/${FULLNODE}.conf"
    echo $CMD_ARGS
}



function TODO_fullnode_status_txt {
    local FULLNODE=$1
    # not available
}


function TODO_fullnode_status_json {
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


