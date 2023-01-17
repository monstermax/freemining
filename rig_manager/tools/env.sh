
OLD_PWD=$PWD
cd `dirname $BASH_SOURCE`

##### START

CONFIG_FILE=$(realpath ../rig_manager.json)

LOGS_DIR=$(eval echo `jq -r ".logsDir" ${CONFIG_FILE} 2>/dev/null`)

PIDS_DIR=$(eval echo `jq -r ".pidsDir" ${CONFIG_FILE} 2>/dev/null`)

MINERS_DIR=$(eval echo `jq -r ".minersDir" ${CONFIG_FILE} 2>/dev/null`)


function getMinerApiPort {
    miner=$1

    API_PORT=$(eval echo `jq -r ".miners.${miner}.api.port" ${CONFIG_FILE} 2>/dev/null`)

    if [ "$API_PORT" = "null" ]; then
        API_PORT=""
    fi

    echo $API_PORT
}




##### END

cd $OLD_PWD
