#!/bin/bash

cd `dirname $0`

source ../node_manager.sh
set -e


# install basic tools
installBasicTools

# install nodejs + npm + typescript
#installNodejs
#installNodejsPackages



# install node server
../node_webserver/install_webserver.sh

