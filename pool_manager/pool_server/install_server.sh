#!/bin/bash

cd `dirname $0`

source ../pool_manager.sh
set -e


# install basic tools
installBasicTools

# install nodejs + npm + typescript
installNodejsPackages


# install pool server
npm install


# compile typescript
${TSC}
