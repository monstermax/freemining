#!/bin/bash

cd `dirname $0`

source ../pool_manager.sh
set -e


# install basic tools
installBasicTools

# install nodejs + npm + typescript
installNodejs
installNodejsPackages



# install pool server
../pool_server/install_server.sh

# install pools manager
../pools_manager/install_pools_manager.sh
