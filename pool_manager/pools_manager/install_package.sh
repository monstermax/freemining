#!/bin/bash

cd `dirname $0`

source ../pool_manager.sh

TMP_DIR=$(mktemp -d)
chmod o+x $TMP_DIR



function install_miningcore {
    cd ${TMP_DIR}

    package="miningcore"
    VERSION="sources"
    INSTALL_LOG="${USER_CONF_DIR}/pools_engine/${package}/install.log"

    mkdir -p ${USER_CONF_DIR}/pools_engine/${package}
    >${INSTALL_LOG}

    DB_NAME="miningcore"
    DB_USER="miningcore"
    DB_PASS="miningcore"

    DL_URL="https://github.com/oliverw/miningcore"
    #DL_FILE=$(basename $DL_URL)
    #UNZIP_DIR="${package}-unzipped"

    echo "Installing ${package} ${VERSION}..."

    mkdir -p ${USER_CONF_DIR}/pools_engine/${package}

    echo " - Downloading ${package}"
    git clone $DL_URL >>${INSTALL_LOG} 2>>${INSTALL_LOG}

    cd miningcore

    echo " - Compiling ${package}"
    rootRequired

    if grep -q "Debian GNU/Linux 11" /etc/os-release; then
        ./build-debian-11.sh >>${INSTALL_LOG}

    elif grep -q "Ubuntu 21.04" /etc/os-release; then
        ./build-ubuntu-20.04.sh >>${INSTALL_LOG}

    elif grep -q "Ubuntu 20.04" /etc/os-release; then
        ./build-ubuntu-21.04.sh >>${INSTALL_LOG}
    else
        echo "Error: the install script for the package '${package}' is not compatible with your OS"
        exit 1
    fi

    if ! test -d build; then
        echo "Error: buid faild"
        exit 1
    fi

    if [ "`getCmdPath psql`" = "" ]; then
        echo " - Installing dependencies packages: postgresql"
        rootRequired
        sudo apt-get install -qq -y postgresql
    fi

    echo " - Preparing postgresql"
    rootRequired

    if ! sudo -u postgres psql postgres -tXAc  "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
        # create role
        #sudo -u postgres psql -c "CREATE ROLE ${DB_USER} WITH LOGIN ENCRYPTED PASSWORD '${DB_PASS}'"
        sudo -u postgres psql -c "CREATE ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}'"

        #ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';
    fi

    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ${DB_NAME}; then
        # create db
        sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}"
    #fi

    #if ! sudo -u postgres psql -d ${DB_NAME} -c "" 2>/dev/null; then
        echo " - Importing postgresql dump"
        # import db
        sudo -u postgres psql -d ${DB_NAME} -f ./src/Miningcore/Persistence/Postgres/Scripts/createdb.sql
    fi

    #sudo -u postgres psql -d ${DB_NAME} -f ./src/Miningcore/Persistence/Postgres/Scripts/createdb_postgresql_11_appendix.sql
    #for each active pool...
    #  sudo -u postgres psql -c "CREATE TABLE shares_xxx1 PARTITION OF shares FOR VALUES IN ('xxx1')"


    # apply custom patch
    mv build/coins.json build/coins.dist.json
    cp -a ${POOL_APP_DIR}/pools_manager/patchs/miningcore_coins.json build/coins.json


    echo " - Install into ${POOLS_ENGINE_DIR}/${package}"
    mkdir -p ${POOLS_ENGINE_DIR}
    rm -rf ${POOLS_ENGINE_DIR}/${package}
    mv build ${POOLS_ENGINE_DIR}/${package}
}


function install_miningcoreUi {
    cd ${TMP_DIR}

    package="miningcoreUi"
    VERSION="sources"
    INSTALL_LOG="${USER_CONF_DIR}/pools_ui/${package}/install.log"

    mkdir -p ${USER_CONF_DIR}/pools_ui/${package}
    >${INSTALL_LOG}

    DL_URL="https://gitlab.com/calvintam236/miningcore-ui"
    #DL_FILE=$(basename $DL_URL)
    #UNZIP_DIR="${package}-unzipped"

    echo "Installing ${package} ${VERSION}..."

    mkdir -p ${USER_CONF_DIR}/pools_ui/${package}

    echo " - Downloading ${package}"
    git clone $DL_URL >>${INSTALL_LOG} 2>>${INSTALL_LOG}

    echo " - Install into ${POOLS_UI_DIR}/${package}"
    mkdir -p ${POOLS_UI_DIR}
    rm -rf ${POOLS_UI_DIR}/${package}
    mv miningcore-ui ${POOLS_UI_DIR}/${package}
}


function install_miningcoreWebUI {
    cd ${TMP_DIR}

    package="miningcoreWebUI"
    VERSION="sources"
    INSTALL_LOG="${USER_CONF_DIR}/pools_ui/${package}/install.log"

    mkdir -p ${USER_CONF_DIR}/pools_ui/${package}
    >${INSTALL_LOG}

    DL_URL="https://github.com/minernl/Miningcore.WebUI"
    #DL_FILE=$(basename $DL_URL)
    #UNZIP_DIR="${package}-unzipped"

    echo "Installing ${package} ${VERSION}..."

    mkdir -p ${USER_CONF_DIR}/pools_ui/${package}

    echo " - Downloading ${package}"
    git clone $DL_URL >>${INSTALL_LOG} 2>>${INSTALL_LOG}

    # apply custom patchs
    cd Miningcore.WebUI
    git apply ${POOL_APP_DIR}/pools_manager/patchs/miningcoreWebUI_api_patch.patch
    git apply ${POOL_APP_DIR}/pools_manager/patchs/miningcoreWebUI_index_patch.patch
    #${POOL_APP_DIR}/pools_manager/patchs/miningcoreWebUI_api_config.sh -q
    cp -a ${POOL_APP_DIR}/pools_manager/patchs/coins_icons/*.png ./img/coin/icon
    touch ./css/font-awesome-icons.css
    touch ./css/bootstrap-notify.css
    cd ..

    echo " - Install into ${POOLS_UI_DIR}/${package}"
    mkdir -p ${POOLS_UI_DIR}
    rm -rf ${POOLS_UI_DIR}/${package}
    mv Miningcore.WebUI ${POOLS_UI_DIR}/${package}
}


function clean_tmp_dir {
    rm -rf $TMP_DIR
}



#install_miningcore

#install_miningcoreUi

#install_miningcoreWebUI



##################################################################





package=$1


if [ "$package" = "" ]; then
    echo "Usage: $0 <package>"
    echo
    echo " packages list:"
    echo "  - miningcore"
    echo "  - miningcoreUi"
    echo "  - miningcoreWebUI"

    exit
fi



if ! test -d ${NODES_DIR}; then
    echo "Creating nodes folder: ${NODES_DIR}"

    PARENT_DIR=$(dirname $NODES_DIR)

    if test -w ${PARENT_DIR}; then
        mkdir -p ${NODES_DIR}
        chown $USER: ${NODES_DIR}

    else
        echo "Folder $PARENT_DIR is not writable"
        rootRequired
        sudo mkdir -p ${NODES_DIR}
        sudo chown $USER: ${NODES_DIR}
    fi
fi





if [ "$package" = "miningcore" ]; then
    mkdir -p ${USER_CONF_DIR}/pools_engine
    install_miningcore
fi

if [ "$package" = "miningcoreUi" ]; then
    mkdir -p ${USER_CONF_DIR}/pools_ui
    install_miningcoreUi
fi

if [ "$package" = "miningcoreWebUI" ]; then
    mkdir -p ${USER_CONF_DIR}/pools_ui
    install_miningcoreWebUI
fi


clean_tmp_dir

