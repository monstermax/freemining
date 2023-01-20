#!/bin/bash

cd `dirname $0`

source ../../pool_manager.sh
set -e


package="miningcore"

MININGCORE_CONFIG_FILE=${poolConfDir}/engines/${package}/config.json

SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
FROM_EMAIL="no-reply@freemining.fr"
FROM_NAME="Freemining"

ADMIN_EMAIL="webmaster@freemining.fr"

API_HOST="0.0.0.0"
API_PORT="4000"


echo "Generating miningcore config..."


mkdir -p ${poolConfDir}/engines/${package}
mkdir -p ${poolLogDir}/engines/${package}
touch $MININGCORE_CONFIG_FILE


POOLS_JSON=""


POOLS_LIST=$(jq -r '.pools | keys | join(" ")' $POOL_CONFIG_FILE)
#echo POOLS_LIST=$POOLS_LIST

if [ "$POOLS_LIST" != "" ]; then

    POOL_IDX=0
    # for each POOL...
    for POOL_SLUG in $POOLS_LIST; do
        if [ "$POOLS_JSON" != "" ]; then
            POOLS_JSON="${POOLS_JSON},

"
        fi

        POOL_ITEM=$(jq ".pools.${POOL_SLUG}" $POOL_CONFIG_FILE)
        #echo "POOL_ITEM[$POOL_SLUG]=$POOL_ITEM"

        POOL_ID=$POOL_SLUG
        POOL_COIN=$(echo $POOL_ITEM | jq -r '.coin')
        WALLET_ADDRESS=$(echo $POOL_ITEM | jq -r '.walletAddress')
        WALLET_ZADDRESS=$(echo $POOL_ITEM | jq -r '.walletZAddress')

        POOL_ACTIVE=$(echo $POOL_ITEM | jq -r '.active')
        POOL_ENABLED="true"
        if [ "$POOL_ACTIVE" = "false" ]; then
            POOL_ENABLED="false"
        fi

        PORTS_LIST=$(echo $POOL_ITEM | jq -r '.stratumPorts | keys | join(" ")')

        DAEMONS=$(echo $POOL_ITEM | jq -r '.daemonsRpc')
        DAEMONS_LIST=$(echo $POOL_ITEM | jq -r '.daemonsRpc[].port')


        PORTS_JSON=""

        # for each PORT...
        PORT_IDX=0
        for PORT_NUMBER in $PORTS_LIST; do
            PORT_NAME=$(echo $POOL_ITEM | jq -r ".stratumPorts[\"${PORT_NUMBER}\"].name")

            PORT_DIFF_MIN=$(echo $POOL_ITEM | jq -r ".stratumPorts[\"${PORT_NUMBER}\"].difficultyMin")
            PORT_DIFF_MAX=$(echo $POOL_ITEM | jq -r ".stratumPorts[\"${PORT_NUMBER}\"].difficultyMax")

            if [ "$PORT_DIFF_MIN" = "" -o "$PORT_DIFF_MIN" = "null" ]; then
                PORT_DIFF_MIN="0.1"
            fi

            if [ "$PORT_DIFF_MAX" = "" ]; then
                PORT_DIFF_MAX="null"
            fi

            PORTS_JSON=$(
                cat <<_EOF
"${PORT_NUMBER}": {
                    "name": "${PORT_NAME}",
                    "listenAddress": "*",
                    "difficulty": ${PORT_DIFF_MIN},
                    "varDiff": {
                        "minDiff": ${PORT_DIFF_MIN},
                        "maxDiff": ${PORT_DIFF_MAX},
                        "targetTime": 15,
                        "retargetTime": 90,
                        "variancePercent": 30
                    }
                }
_EOF
            )

            let "PORT_IDX++" || true
        done

        DAEMONS_JSON=""

        # for each DAEMON...
        DAEMON_IDX=0
        for PORT_NUMBER in $DAEMONS_LIST; do
            DAEMON_HOST=$(echo $DAEMONS | jq -r ".[${DAEMON_IDX}].host")
            #DAEMON_PORT=$(echo $DAEMONS | jq -r ".[${DAEMON_IDX}].port")
            DAEMON_PORT=$PORT_NUMBER
            DAEMON_USER=$(echo $DAEMONS | jq -r ".[${DAEMON_IDX}].user")
            DAEMON_PASS=$(echo $DAEMONS | jq -r ".[${DAEMON_IDX}].pass")
            DAEMON_APIKEY=$(echo $DAEMONS | jq -r ".[${DAEMON_IDX}].apiKey")

            DAEMONS_JSON=$(
                cat <<_EOF
                {
                    "host": "${DAEMON_HOST}",
                    "port": ${DAEMON_PORT},
                    "user": "${DAEMON_USER}",
                    "pass": "${DAEMON_PASS}",
                    "apiKey": "${DAEMON_APIKEY}"
                }
_EOF
            )

            let "DAEMON_IDX++" || true
        done


        POOL_JSON=$(
            cat <<_EOF
        {
            "id": "${POOL_ID}",
            "enabled": ${POOL_ENABLED},
            "coin": "${POOL_COIN}",
            "randomXRealm": "${POOL_ID}",
            "address": "${WALLET_ADDRESS}",
            "z-address": "${WALLET_ZADDRESS}",
            "rewardRecipients": [
                {
                    "address": "${WALLET_ADDRESS}",
                    "percentage": 1
                }
            ],
            "blockRefreshInterval": 200,
            "jobRebroadcastTimeout": 10,
            "clientConnectionTimeout": 600,
            "banning": {
                "enabled": true,
                "time": 600,
                "invalidPercent": 50,
                "checkThreshold": 50
            },
            "ports": {
                ${PORTS_JSON}
            },
            "daemons": [
                ${DAEMONS_JSON}
            ],
            "paymentProcessing": {
                "enabled": true,
                "minimumPayment": 0.1,
                "minimumPaymentToPaymentId": 1.0,
                "payoutScheme": "PPLNS",
                "payoutSchemeConfig": {
                    "factor": 2.0
                }
            }
        }
_EOF
        )

        POOLS_JSON="${POOLS_JSON}
${POOL_JSON}"

        let "POOL_IDX++" || true
    done
fi


cat << _EOF > ${poolConfDir}/engines/${package}/config.json
{
    "logging": {
        "level": "info",
        "enableConsoleLog": true,
        "enableConsoleColors": true,
        "logFile": "core.log",
        "apiLogFile": "api.log",
        "logBaseDirectory": "${poolLogDir}/engines/${package}",
        "perPoolLogFile": false
    },
    "banning": {
        "manager": "Integrated",
        "banOnJunkReceive": true,
        "banOnInvalidShares": false
    },
    "notifications": {
        "enabled": false,
        "email": {
            "host": "${SMTP_HOST}",
            "port": ${SMTP_PORT},
            "user": "${SMTP_USER}",
            "password": "${SMTP_PASS}",
            "fromAddress": "${FROM_EMAIL}",
            "fromName": "${FROM_NAME}"
        },
        "admin": {
            "enabled": false,
            "emailAddress": "${ADMIN_EMAIL}",
            "notifyBlockFound": true
        }
    },
    "persistence": {
        "postgres": {
            "host": "127.0.0.1",
            "port": 5432,
            "user": "miningcore",
            "password": "miningcore",
            "database": "miningcore"
        }
    },
    "paymentProcessing": {
        "enabled": true,
        "interval": 600,
        "shareRecoveryFile": "recovered-shares.txt"
    },
    "api": {
        "enabled": true,
        "listenAddress": "${API_HOST}",
        "port": ${API_PORT},
        "metricsIpWhitelist": [],
        "rateLimiting": {
            "disabled": false,
            "rules": [
                {
                    "Endpoint": "*",
                    "Period": "1s",
                    "Limit": 5
                }
            ],
            "ipWhitelist": []
        }
    },
    "pools": [
        $POOLS_JSON
    ]
}
_EOF


echo "Config written to ${poolConfDir}/engines/${package}/config.json"
