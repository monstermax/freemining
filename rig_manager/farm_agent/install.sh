#!/bin/bash


# install basic tools
sudo apt-get install -y net-tools curl wget jq php-cli bc vim


type node 2> /dev/null
rc=$?

if [ "$rc" != "0" ]; then
    # install nodejs
    sudo apt-get install -y nodejs npm
    #sudo npm install -g @types/node
fi

# install typescript
sudo npm install -g typescript ts-node tslib
#sudo npm install -g @types/node


npm install
