#!/bin/bash

cd `dirname $0`

source ./pool_manager.sh


# install basic tools
installBasicTools

# install nodejs + npm + typescript
installNodejs
installNodejsPackages



# install pools manager
./pools_manager/install_pools_manager.sh
