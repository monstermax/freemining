#!/bin/bash

cd `dirname $0`

source ../farm_manager.sh


# install basic tools
installBasicTools

# install nodejs + npm + typescript
installNodejs
installNodejsPackages


# install farm server
npm install


# compile typescript
${TSC}


