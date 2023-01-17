#!/bin/bash

cd `dirname $0`

source ./rig_manager.sh


# install basic tools
installBasicTools

# install nodejs + npm + typescript
installNodejs
installNodejsPackages


# install farm agent
./rig_agent/install_agent.sh
