#!/bin/bash

cd `dirname $0`

source ../pool_manager.sh


# install basic tools
installBasicTools

# install nodejs + npm + typescript
installNodejsPackages


# install pool server
npm install


# compile typescript
${TSC}
