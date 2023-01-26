#!/bin/bash

cd `dirname $0`

source ../../rig_manager.sh

MINER="teamredminer"


API_HOST=localhost
API_PORT=$(getMinerApiPort $MINER)


SUMMARY_JSON=$(echo -n summary | nc 127.0.0.1 ${API_PORT} 2>/dev/null |sed 's/,/\n/g')

if [ "$SUMMARY_JSON" = "" ]; then
    exit 1
fi



PID_FILE="${rigPidDir}/miners/freemining.rig.miner.${MINER}.pid"
PID=""
if test -f $PID_FILE; then
    PID=$(cat $PID_FILE)
fi



function getGpus {
    GPU_COUNT=$(echo -n gpucount | nc 127.0.0.1 ${API_PORT} |sed 's/|/\n/g' |tail +2 |cut -d= -f2)

    GPU_DETAILS=$(echo -n devdetails | nc 127.0.0.1 ${API_PORT} |sed 's/,/\n/g')

    for i in `seq 1 $DEVICES_COUNT`; do
        let WORKER_ID=$((i-1))

        if [ "$WORKER_ID" -gt 0 ]; then
            true
        fi

        GPU_INFOS=$(echo -n "gpu|${WORKER_ID}" | nc 127.0.0.1 ${API_PORT} |sed 's/|/\n/g' |tail +2  |sed 's/,/\n/g')

        GPU_ID=$(grep "^GPU=" <<< $GPU_INFOS |cut -d= -f2)
        GPU_NAME=$(grep "^ID=0" -A99 <<< $GPU_DETAILS |grep "^Model=" |head -n1 |cut -d= -f2)
        GPU_TEMPERATURE=$(grep "^Temperature=" <<< $GPU_INFOS |cut -d= -f2)
        GPU_FAN_SPEED=$(grep "^Fan Percent=" <<< $GPU_INFOS |cut -d= -f2)
        GPU_HASHRATE_ROUND=$(grep "^MHS 30s=" <<< $GPU_INFOS |cut -d= -f2)

        GPU_HASHRATE=$(echo "$GPU_HASHRATE_ROUND * 1024 * 1024" |bc |cut -d"." -f1)
        WORKER_HASHRATE=$(echo "$WORKER_HASHRATE + $GPU_HASHRATE" |bc)

        if [ "$GPUS" != "" ]; then
            GPUS="${GPUS},"
        fi

        GPU=$(
            cat <<_EOF
{
            "id": "${GPU_ID}",
            "name": "${GPU_NAME}",
            "temperature": ${GPU_TEMPERATURE},
            "fanSpeed": ${GPU_FAN_SPEED},
            "hashRate": ${GPU_HASHRATE}
        }
_EOF
        )

        GPUS="${GPUS}${GPU}"

    done

}


function getPool {
    RESULT=$(echo -n "pools" | nc 127.0.0.1 ${API_PORT})
    POOL=$(echo $RESULT |sed 's/|/\n/g' |tail +2 |sed 's/,/\n/g')

    POOL_URL=$(grep "^URL=" <<< $POOL |cut -d= -f2 |sed 's/stratum+tcp:\/\///')
    POOL_USER=$(grep "^User=" <<< $POOL |cut -d= -f2)
    USER_ADDR=$(echo $POOL_USER | cut -d"." -f1)
    WORKER_NAME=$(echo $POOL_USER | cut -d"." -f2)

    ALGO=$(grep "^Algorithm=" <<< $POOL |cut -d= -f2)

    HASHRATE_ROUND=$(grep "^MHS 30s=" <<< $SUMMARY_JSON |cut -d= -f2)

    DATE=$(date "+%F %T")

    UPTIME=$(grep "^Elapsed=" <<< $SUMMARY_JSON |cut -d= -f2)
}



CPUS=""
GPUS=""
WORKER_HASHRATE=0


getPool

getGpus





cat <<_EOF
{
    "worker": {
        "name": "${WORKER_NAME}",
        "miner": "${MINER}",
        "pid": ${PID},
        "algo": "${ALGO}",
        "hashRate": ${WORKER_HASHRATE},
        "uptime": ${UPTIME},
        "date": "${DATE}"
    },
    "pool": {
        "url": "${POOL_URL}",
        "account": "${USER_ADDR}"
    },
    "cpu": [
        ${CPUS}
    ],
    "gpu": [
        ${GPUS}
    ]
}
_EOF








exit


# ok
echo -n "version" | nc 127.0.0.1 42004
echo -n "config" | nc 127.0.0.1 42004
echo -n "summary" | nc 127.0.0.1 42004
echo -n "devs" | nc 127.0.0.1 42004
echo -n "gpucount" | nc 127.0.0.1 42004
echo -n "gpu|N" | nc 127.0.0.1 42004
echo -n "devdetails" | nc 127.0.0.1 42004


# fail
echo -n "gpufan|0,70" | nc 127.0.0.1 42004




exit




echo -n "version" 
 nc 127.0.0.1 42004
STATUS=S,When=1673222314,Code=22,Msg=TeamRedMiner versions,Description=TeamRedMiner 0.10.7
VERSION,Miner=TeamRedMiner 0.10.7,SGMiner=5.4,API=4.0
echo -n "version" | nc 1^C

echo -n "gpu" | nc 127.0.0.1 42004
STATUS=S,When=1673222343,Code=17,Msg=GPU0,Description=TeamRedMiner 0.10.7
GPU=0,Enabled=Y,Status=Alive,Temperature=63.00,Fan Speed=0,Fan Percent=60,GPU Clock=2380,Memory Clock=875,GPU Voltage=0.931,GPU Activity=0,Powertune=0,MHS av=13.39,MHS 30s=13.52,KHS av=1.339e+04,KHS 30s=1.352e+04,Accepted=4,Rejected=0,Hardware Errors=0,Utility=0.1073,Intensity=20,XIntensity=0,RawIntensity=0,Last Share Pool=0,Last Share Time=0,Total MH=29939760224.0000,Diff1 Work=4.063492,Difficulty Accepted=4.00000000,Difficulty Rejected=0.00000000,Last Share Difficulty=0.00000000,Last Valid Work=0,Device Hardware%=0.0000,Device Rejected%=0.0000,Device Elapsed=2236,TemperatureJnct=73.00,TemperatureMem=74.00,GPU Power=100.000000

echo -n "gpu|0" | nc 127.0.0.1 42004
STATUS=S,When=1673222348,Code=17,Msg=GPU0,Description=TeamRedMiner 0.10.7
GPU=0,Enabled=Y,Status=Alive,Temperature=63.00,Fan Speed=0,Fan Percent=60,GPU Clock=2385,Memory Clock=875,GPU Voltage=0.931,GPU Activity=0,Powertune=0,MHS av=13.39,MHS 30s=13.52,KHS av=1.339e+04,KHS 30s=1.352e+04,Accepted=4,Rejected=0,Hardware Errors=0,Utility=0.1071,Intensity=20,XIntensity=0,RawIntensity=0,Last Share Pool=0,Last Share Time=0,Total MH=30008803584.0000,Diff1 Work=4.063492,Difficulty Accepted=4.00000000,Difficulty Rejected=0.00000000,Last Share Difficulty=0.00000000,Last Valid Work=0,Device Hardware%=0.0000,Device Rejected%=0.0000,Device Elapsed=2241,TemperatureJnct=71.00,TemperatureMem=72.00,GPU Power=99.000000

echo -n "gpu|1" | nc 127.0.0.1 42004
STATUS=E,When=1673222352,Code=1,Msg=Invalid GPU id 1 - range is 0 - 0,Description=TeamRedMiner 0.10.7

echo -n "config" | nc 127.0.0.1 42004
STATUS=S,When=1673222384,Code=33,Msg=TeamRedMiner config,Description=TeamRedMiner 0.10.7
CONFIG,GPU Count=1,PGA Count=0,Pool Count=1,ADL=N,ADL in use=N,Strategy=Priority,Rotate Period=0,Log Interval=30,Device Code=GPU ,OS=Linux,Failover-Only=false,Failover Switch Delay=60,ScanTime=1,Queue=1,Expiry=60,Algo Count=1

echo -n "summary" | nc 127.0.0.1 42004
STATUS=S,When=1673222402,Code=11,Msg=Summary,Description=TeamRedMiner 0.10.7
SUMMARY,Elapsed=2296,MHS av=13.39,MHS 30s=13.52,KHS av=1.339e+04,KHS 30s=1.352e+04,Found Blocks=0,Getworks=20,Accepted=5,Rejected=0,Hardware Errors=0,Utility=0.1307,Discarded=0,Stale=0,Get Failures=0,Local Work=0,Remote Failures=0,Network Blocks=20,Total MH=30722143840.0000,Work Utility=0.1307,Difficulty Accepted=5.00000000,Difficulty Rejected=0.00000000,Difficulty Stale=0.00000000,Best Share=0.000000,Device Hardware%=0.0000,Device Rejected%=0.0000,Pool Rejected%=0.0000,Pool Stale%=0.0000,Last getwork=1673222401

echo -n "devs" | nc 127.0.0.1 42004
STATUS=S,When=1673222481,Code=9,Msg=1 GPU(s),Description=TeamRedMiner 0.10.7
GPU=0,Enabled=Y,Status=Alive,Temperature=63.00,Fan Speed=0,Fan Percent=60,GPU Clock=2400,Memory Clock=875,GPU Voltage=0.937,GPU Activity=0,Powertune=0,MHS av=13.39,MHS 30s=13.52,KHS av=1.339e+04,KHS 30s=1.352e+04,Accepted=5,Rejected=0,Hardware Errors=0,Utility=0.1263,Intensity=20,XIntensity=0,RawIntensity=0,Last Share Pool=0,Last Share Time=0,Total MH=31794310240.0000,Diff1 Work=5.079365,Difficulty Accepted=5.00000000,Difficulty Rejected=0.00000000,Last Share Difficulty=0.00000000,Last Valid Work=0,Device Hardware%=0.0000,Device Rejected%=0.0000,Device Elapsed=2375,TemperatureJnct=71.00,TemperatureMem=76.00,GPU Power=99.000000

echo -n "devdetails" | nc 127.0.0.1 42004
STATUS=S,When=1673222717,Code=69,Msg=Device Details,Description=TeamRedMiner 0.10.7
DEVDETAILS=0,Name=GPU,ID=0,Driver=opencl,Kernel=firopow,Model=AMD Radeon RX 6600,Device Path=03:00:0

echo -n "stats" | nc 127.0.0.1 42004
STATUS=S,When=1673222787,Code=70,Msg=TeamRedMiner stats,Description=TeamRedMiner 0.10.7
STATS=0,ID=GPU0,Elapsed=2680,Calls=1584,Wait=4.773805,Max=4.773805,Min=0.000000
STATS=1,ID=POOL0,Elapsed=2680,Calls=1450,Wait=4.773805,Max=4.773805,Min=0.000000,Pool Calls=0,Pool Attempts=0,Pool Wait=4.773805,Pool Max=4.773805,Pool Min=0.000000,Pool Av=0.000000,Work Had Roll Time=false,Work Can Roll=false,Work Had Expire=false,Work Roll Time=0,Work Diff=1.00000000,Min Diff=1.00000000,Max Diff=1.00000000,Min Diff Count=24,Max Diff Count=24,Pool Calls=0,Times Sent=9,Bytes Sent=1976,Times Recv=33,Bytes Recv=7030,Net Bytes Sent=1976,Net Bytes Recv=7030

echo -n "coin" | nc 127.0.0.1 42004
STATUS=S,When=1673222824,Code=78,Msg=TeamRedMiner coin,Description=TeamRedMiner 0.10.7
COIN,Hash Method=firopow,Current Block Time=1673222745.243830,Current Block Hash=6161616161616161616161616161616161616161616161616161616161616161,LP=true,Network Difficulty=0.00000000

echo -n "notify" | nc 127.0.0.1 42004
STATUS=S,When=1673223742,Code=60,Msg=Notify,Description=TeamRedMiner 0.10.7
NOTIFY=0,Name=GPU,ID=0,Last Well=1673223742,Last Not Well=0,Reason Not Well=None,*Thread Fail Init=0,*Thread Zero Hash=0,*Thread Fail Queue=0,*Dev Sick Idle 60s=0,*Dev Dead Idle 600s=0,*Dev Nostart=0,*Dev Over Heat=0,*Dev Thermal Cutoff=0,*Dev Comms Error=0,*Dev Throttle=0

echo -n "pools" | nc 127.0.0.1 42004
STATUS=S,When=1673223829,Code=7,Msg=1 Pool(s),Description=TeamRedMiner 0.10.7
POOL=0,Name=firo.2miners.com,URL=stratum+tcp://firo.2miners.com:8181,Profile=,Algorithm=firopow,Description=,Status=Alive,Priority=1,Quota=1,Long Poll=N,Getworks=31,Accepted=9,Rejected=0,Works=0,Discarded=0,Stale=0,Get Failures=0,Remote Failures=0,User=a35tt2uCFQUkU5gsnERjUpbGgdCqGsLYS2.zalman,Last Share Time=1673223542,Diff1 Shares=9.000000,Proxy Type=,Proxy=,Difficulty Accepted=9.00000000,Difficulty Rejected=0.00000000,Difficulty Stale=0.00000000,Last Share Difficulty=1.00000000,Has Stratum=true,Stratum Active=true,Stratum URL=firo.2miners.com,Has GBT=false,Best Share=0.000000,Pool Rejected%=0.0000,Pool Stale%=0.0000

