#!/bin/bash

cd `dirname $0`

source ../rig_manager.sh


# install basic tools
installBasicTools

# install nodejs + npm + typescript
installNodejsPackages


# install farm agent
npm install

