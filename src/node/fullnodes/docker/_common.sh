#!/bin/bash

set -e


function check_non_root {
    if [ "$USER" = "root" ]; then
        echo "Warning: run me as non-root"
        exit
    fi
}


function install_docker {
    local is_docker_installed=$(command -v docker | wc -l)

    if [ "$is_docker_installed" = "1" ]; then
        return 0
    fi

    local VERSION=$1
    if [ "$VERSION" = "" ]; then
        VERSION="focal"
    fi

    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu ${VERSION} stable"

    sudo apt-get update
    sudo apt install -y docker-ce
}


function install_nodejs {
    local is_nodejs_installed=$(command -v node | wc -l)

    if [ "$is_nodejs_installed" = "1" ]; then
        return 0
    fi

    local VERSION=$1
    if [ "$VERSION" = "" ]; then
        VERSION="16.x"
    fi

    curl -fsSL https://deb.nodesource.com/setup_${VERSION} | sudo -E bash -
    sudo apt-get install -y nodejs
}


function install_mongodb {
    local is_mongodb_installed=$(command -v mongod | wc -l)

    if [ "$is_mongodb_installed" = "1" ]; then
        return 0
    fi

    local VERSION=$1
    if [ "$VERSION" = "" ]; then
        VERSION="5.0"
    fi

    wget -qO - https://www.mongodb.org/static/pgp/server-${VERSION}.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/${VERSION} multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-${VERSION}.list

    sudo apt-get update
    sudo apt-get install -y mongodb-org
}


function install_jq {
    local is_jq_installed=$(command -v jq | wc -l)

    if [ "$is_jq_installed" = "1" ]; then
        return 0
    fi

    sudo apt-get install -y jq
}


function install_git {
    local is_git_installed=$(command -v git | wc -l)

    if [ "$is_git_installed" = "1" ]; then
        return 0
    fi

    sudo apt-get install -y git
}


function install_sudo {
    local is_sudo_installed=$(command -v sudo | wc -l)

    if [ "$is_sudo_installed" = "1" ]; then
        return 0
    fi

    sudo apt-get install -y sudo
}


function docker_image_download {
    local is_docker_image_downloaded=$(docker images -f reference=${DOCKER_IMAGE} -q | wc -l)

    # Download docker image (ubuntu:20.04)
    if [ "$is_docker_image_downloaded" = "0" ]; then
        docker pull ${DOCKER_IMAGE} >/dev/null
    fi
}


function docker_container_create {
    local is_docker_container_exist=$(docker container ls -a -f name="^/${WALLET_NAME}$" -q |wc -l)

    # Run docker container
    if [ "$is_docker_container_exist" = "0" ]; then
        # container not exist => run it
        echo "Docker RUN ${WALLET_NAME}"

        mkdir -p $WALLET_DIR_REAL

        docker run -d -i -t --name ${WALLET_NAME} --hostname docker-${WALLET_NAME} -v ${WALLET_DIR_REAL}:${WALLET_DIR_CONTAINER} ${DOCKER_IMAGE}
    fi
}


function docker_container_install_base {
    local is_installed=$(docker exec ${WALLET_NAME} bash -c "ls /root/docker_container_install_base.ok >/dev/null 2>&1 && echo 1 || echo 0")

    if [ "$is_installed" = "1" ]; then
        return 0
    fi

    docker exec ${WALLET_NAME} apt-get update
    docker exec ${WALLET_NAME} apt-get install -qq -y git vim screen unzip wget curl sudo

    #mkdir -p ${WALLET_DIR_REAL}/bin
    #docker exec ${WALLET_NAME} bash -c "echo PATH=\"\$PATH:${WALLET_DIR_CONTAINER}/bin\" >> /root/.bashrc"

    docker exec ${WALLET_NAME} bash -c "touch /root/docker_container_install_base.ok"
}


function docker_container_create_user {
    local is_exist=$(docker exec ${WALLET_NAME} bash -c "grep ^$USER: /etc/passwd" |wc -l)

    if [ "$is_exist" = "1" ]; then
        return 0
    fi

    docker exec ${WALLET_NAME} adduser $USER --uid $(id -u) --disabled-password --system

    mkdir -p ${WALLET_DIR_REAL}/bin
    #docker exec ${WALLET_NAME} bash -c "echo PATH=\"\$PATH:${WALLET_DIR_CONTAINER}/bin\" >> ${HOME}/.bashrc"
}


function docker_container_start {
    local is_docker_container_running=$(docker container ls -f name="^/${WALLET_NAME}$" -q |wc -l)

    if [ "$is_docker_container_running" = "0" ]; then
        # container not running
        echo "Docker START ${WALLET_NAME}"

        docker start ${WALLET_NAME} >/dev/null
    fi
}


function docker_container_exec {
    echo "Docker EXEC ${WALLET_NAME}"

    local CMD=$@

    if [ "$CMD" = "" ]; then
        CMD="bash"
    fi

    docker exec -i -t ${WALLET_NAME} "$CMD"
}


function docker_container_stop {
    echo "Docker STOP ${WALLET_NAME}"

    docker stop ${WALLET_NAME} >/dev/null
}


function docker_container_rm {
    echo "Docker rm ${WALLET_NAME}"

    docker rm ${WALLET_NAME} >/dev/null
}


function docker_install_nodejs {
    local is_nodejs_installed=$(docker exec ${WALLET_NAME} bash -c "command -v node" | wc -l)

    if [ "$is_nodejs_installed" = "1" ]; then
        return 0
    fi

    local VERSION=$1
    if [ "$VERSION" = "" ]; then
        VERSION="16.x"
    fi

    mkdir -p ${WALLET_DIR_REAL}/download
    wget -O${WALLET_DIR_REAL}/download/nodejs_setup_${VERSION} https://deb.nodesource.com/setup_${VERSION}

    docker exec ${WALLET_NAME} bash ${WALLET_DIR_CONTAINER}/download/nodejs_setup_${VERSION}
    docker exec ${WALLET_NAME} apt-get install -y nodejs
}


function docker_install_mongodb {
    local is_nodejs_installed=$(docker exec ${WALLET_NAME} bash -c "command -v mongod" | wc -l)

    if [ "$is_nodejs_installed" = "1" ]; then
        return 0
    fi

    local VERSION=$1
    if [ "$VERSION" = "" ]; then
        VERSION="5.0"
    fi

    mkdir -p ${WALLET_DIR_REAL}/download
    wget -O${WALLET_DIR_REAL}/download/server-${VERSION}.asc https://www.mongodb.org/static/pgp/server-${VERSION}.asc

    docker exec ${WALLET_NAME} apt-key add ${WALLET_DIR_CONTAINER}/download/server-${VERSION}.asc
    docker exec ${WALLET_NAME} bash -c "echo \"deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/${VERSION} multiverse\" > /etc/apt/sources.list.d/mongodb-org-${VERSION}.list"
    docker exec ${WALLET_NAME} apt-get update
    docker exec ${WALLET_NAME} apt-get install -y mongodb-org
}

