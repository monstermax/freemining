
# ==> LIVE => manque clavier FR + persistence



mkdir -p /tmp/live
cd /tmp/live

mkdir -p frm_1
cd $_
mkdir -p auto
cp /usr/share/doc/live-build/examples/auto/* auto/

export http_proxy=http://192.168.1.113:3142/



COPY_FREEMINING="1"
CREATE_FREEMINING_BIN_WRAPPER="0"
CUSTOM_GRUB_BACKGROUND_INSTALL="1"
CUSTOM_GRUB_BACKGROUND_LIVE="1"

INSTALL_BASIC_TOOLS="1"
INSTALL_EXTENDED_TOOLS="1"
INSTALL_NET_TOOLS="1"
INSTALL_NODEJS="1"
INSTALL_NODEJS_LAST="1"
INSTALL_JAVA="0"
INSTALL_PHP="0"
INSTALL_BUILD_TOOLS="1"
INSTALL_TYPESCRIPT="1"
INSTALL_FREEMINING="1"

FREEMINNING_SRC_DIR="/home/karma/dev/perso/freemining-js"


# Live-build Config
cat << _EOF > auto/config
#!/bin/sh

set -e

# Options principales
lb config noauto --architectures amd64                        # choix de l'architecture (amd64 ou i386)
lb config noauto --image-name freemining-os                   # Nom de l'image ISO
lb config noauto --linux-packages "linux-image linux-headers" # Pour faire fonctionner le paquet dmks, il faut également installer le paquet linux-headers
lb config noauto --ignore-system-defaults                     # ignore default config from /etc/live/build.conf and /etc/live/build/*

# Options APT
lb config noauto --security true                              # Permets d'inclure les dépôts security  durant la construction de l'iso
lb config noauto --updates true                               # Permets d'inclure les dépôts updates   durant la construction de l'iso
lb config noauto --backports true                             # Permets d'inclure les dépôts backports durant la construction de l'iso
lb config noauto --archive-areas "main contrib non-free"      # Inclure les parties main, contrib et non-free des dépôts
lb config noauto --apt-source-archives false                  # N'inclue pas les dépôts source durant le bootstrap ou le chroot
#lb config noauto --apt-recommends false                       # Permets de ne pas installer les paquets recommandés
lb config noauto --apt-indices false

# Options APT Proxy
lb config noauto --apt-http-proxy ${http_proxy} \
                --mirror-bootstrap ${http_proxy}debian/ \
                --mirror-chroot ${http_proxy}debian/ \
                --mirror-chroot-security ${http_proxy}debian-security/ \
                --mirror-binary ${http_proxy}debian/ \
                --mirror-binary-security ${http_proxy}debian-security/ \
                --mirror-debian-installer ${http_proxy}debian/ \
                --parent-mirror-bootstrap ${http_proxy}debian/ \
                --parent-mirror-chroot ${http_proxy}debian/ \
                --parent-mirror-chroot-security ${http_proxy}debian-security/ \
                --parent-mirror-binary ${http_proxy}debian/ \
                --parent-mirror-binary-security ${http_proxy}debian-security/ \
                --parent-mirror-debian-installer ${http_proxy}debian/

# Options du mode Install
#lb config noauto --debian-installer true                     # activer le mode Install Debian (choix des paquets à installer pendant l'install)
lb config noauto --debian-installer live                     # activer le mode Install preseed
#lb config noauto --debian-installer-gui "false"              # install without GUI

# Options du mode Live
lb config noauto --bootappend-live "boot=live components persistence autologin username=freeminer lang=fr_FR.UTF-8 locales=fr_FR.UTF-8 keyboard-layouts=fr keyboard-variants=latin9 keyboard-model=pc105 timezone=Europe/Paris utc=yes hostname=freeminer01"

# Options diverses
lb config noauto --iso-application "freemining"
lb config noauto --iso-publisher "freemining; freemining.fr"
lb config noauto --memtest none

# Option en test

# Disabled options
#lb config noauto --binary-image hdd                        # (créer une image .img et non .iso)
#lb config noauto --debootstrap-options "--variant=minbase"
#lb config noauto --bootloaders "grub-efi"
#lb config noauto --binary-images "iso-hybrid"
#lb config noauto --mode "debian"
#lb config noauto --system "live"
#lb config noauto --distribution "bullseye"
#lb config noauto --apt "aptitude

# Options for --bootappend-live :
# - boot=live
# - toram
# - swap=true
# - components
# - persistence
# - sudo
# - autologin
# - username=freeminer
# - lang=fr_FR.UTF-8
# - locales=fr_FR.UTF-8
# - keyboard-layouts=fr
# - keyboard-model=pc105
# - timezone=Europe/Paris
# - utc=yes
# - hostname=freeminer01
# - quiet

ARGS=$@

if [ "$ARGS" = "" ]; then
	true
else
    lb config noauto "$@"
fi
_EOF


# Deb packages selection
mkdir -p config/package-lists/
rm -f config/package-lists/*


if [ "$INSTALL_BASIC_TOOLS" = "1" ]; then
    cat << _EOF >> config/package-lists/basic-tools.list.chroot_install
sudo ssh vim
curl wget git
_EOF
# linux-image-amd64 user-setup
fi


if [ "$INSTALL_EXTENDED_TOOLS" = "1" ]; then
    cat << _EOF >> config/package-lists/extended-tools.list.chroot_install
bc jq
p7zip-full unrar-free
screen micro
gparted bash-completion
_EOF
fi


if [ "$INSTALL_NET_TOOLS" = "1" ]; then
    cat << _EOF >> config/package-lists/net-tools.list.chroot_install
net-tools whois
iftop nmap tcpdump hping3
_EOF
fi


#echo "" >> config/package-lists/basic-tools.list.chroot


# Packages specific au live
#echo "debian-installer-launcher live-boot live-config live-config-systemd" >> config/package-lists/basic-tools.list.chroot_live
echo "console-setup-linux kbd" >> config/package-lists/basic-tools.list.chroot_live


if [ "$INSTALL_NODEJS" = "1" -a "$INSTALL_NODEJS_LAST" != "1" ]; then
    cat << _EOF >> config/package-lists/dev-tools.list.chroot_install
nodejs
npm
_EOF
fi


if [ "$INSTALL_PHP" = "1" ]; then
    cat << _EOF >> config/package-lists/dev-tools.list.chroot_install
php-cli
_EOF
fi


if [ "$INSTALL_JAVA" = "1" ]; then
    cat << _EOF >> config/package-lists/dev-tools.list.chroot_install
default-jdk
_EOF
fi


if [ "$INSTALL_BUILD_TOOLS" = "1" ]; then
    cat << _EOF >> config/package-lists/build-tools.list.chroot_install
build-essential
cmake
_EOF
fi


#echo "user-setup sudo" > config/package-lists/recommends.list.chroot
#echo "ifupdown isc-dhcp-client" >> config/package-lists/recommends.list.chroot


# Filesystem skeleton
mkdir -p config/includes.chroot


if [ "$COPY_FREEMINING" = "1" ]; then
    # pre-install freemining sources (without node_modules, miners, fullnodes)
    mkdir -p config/includes.chroot/home/freeminer/
    rm -rf config/includes.chroot/home/freeminer/freemining
    cd config/includes.chroot/home/freeminer/
    cp -a $FREEMINNING_SRC_DIR freemining
    rm -rf ./freemining/.git*/
    cd ../../../..
fi


if [ "$CREATE_FREEMINING_BIN_WRAPPER" = "1" -a "$COPY_FREEMINING" = "1" ]; then
    # put freemining wrapper in /usr/local/bin
    mkdir -p config/includes.chroot/usr/local/bin
    cat << _EOF > config/includes.chroot/usr/local/bin/freemining
#!/bin/bash

cd /home/freeminer/freemining
./freemining.sh \$@
_EOF
    chmod +x config/includes.chroot/usr/local/bin/freemining
fi


if [ "$INSTALL_NODEJS" = "1" -a "$INSTALL_NODEJS_LAST" = "1" ]; then
    # Install NodeJS
    mkdir -p config/hooks/normal
    cat << _EOF > config/hooks/normal/0600-install-nodejs.chroot
#!/bin/sh

set -e

curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
apt-get install -y nodejs

_EOF
fi


if [ "$INSTALL_TYPESCRIPT" = "1" -a "$INSTALL_NODEJS" = "1" ]; then
    # Install typescript
    mkdir -p config/hooks/normal
    cat << _EOF > config/hooks/normal/0601-npm-install-typescript.chroot
#!/bin/sh

set -e

cd /tmp
npm install -g typescript ts-node tslib @types/node
_EOF
fi


if [ "$INSTALL_FREEMINING" = "1" -a "$COPY_FREEMINING" = "1" -a "$INSTALL_NODEJS" = "1" ]; then
    # Install freemining
    cat << _EOF > config/hooks/normal/0602-install-freemining.chroot
#!/bin/sh
set -e
#/home/freeminer/freemining/freemining.sh modules-install
#/home/freeminer/freemining/freemining.sh bin-install

cd /home/freeminer/freemining
rm -rf node_modules
npm install
chown 1000:1000 /home/freeminer -R || true

./frmd --create-config
chown 1000:1000 /home/freeminer/.freemining-beta -R || true
_EOF
fi

if [ "$INSTALL_FREEMINING" = "1" -a "$COPY_FREEMINING" = "1" -a "$INSTALL_NODEJS" = "1" -a "$RUN_FREEMINING" = "1" ]; then
    # run freemining
    cat << _EOF > config/hooks/normal/0603-install-freemining.chroot
#!/bin/sh
set -e

cd /home/freeminer
cp -a /etc/skel/.bashrc .
chown 1000:1000 .bashrc || true
echo "" >> .bashrc
echo "alias l=\"ls -l --color\"" >> .bashrc
echo "alias la=\"ls -la --color\"" >> .bashrc
echo "" >> .bashrc
echo "if [ ! -f /tmp/freemining_started ]; then" >> .bashrc
echo "    touch /tmp/freemining_started" >> .bashrc
echo "    /home/freeminer/freemining/frmd -r -a 1>/tmp/freemining.autorun.log 2>/tmp/freemining.autorun.err &" >> .bashrc
echo "fi" >> .bashrc

cd /home/freeminer/freemining

#su freeminer -c "screen -dmS freemining ./frmd -a -r"
_EOF
fi


if [ "$CUSTOM_GRUB_BACKGROUND_INSTALL" = "1" ]; then
    # 1) copy image to grub dir
    mkdir -p config/includes.chroot/usr/share/grub
    if [ ! -f /tmp/splash.png ]; then
        wget "https://images.ctfassets.net/q5ulk4bp65r7/77UG0yFqYxqIlehK6snIEO/ae54bbb1ad0dcf55934959bc9ade74ab/Copy_of_Learn_Illustration_What_is_Mining.jpg?w=640&fm=png" -O /tmp/splash.png
    fi
    cp -a /tmp/splash.png config/includes.chroot/usr/share/grub/

    # 2) dedclare image in grub conf
    cat << _EOF > config/hooks/normal/0604-change-grub-background.chroot
#!/bin/sh
set -e
mkdir -p /etc/default/grub.d
echo "GRUB_BACKGROUND=/usr/share/grub/splash.png" >> /etc/default/grub.d/bg.cfg
_EOF
fi


# User skel
mkdir -p config/includes.chroot/etc/skel

#cat << _EOF > config/includes.chroot/etc/skel/.bashrc
#alias l="ls -l --color"
#alias ll="ls -la --color"
##source /home/freeminer/freemining/common/bash/frm_autocompletion.sh
#_EOF


# Preseed
mkdir -p config/includes.installer
cat << _EOF > config/includes.installer/preseed.cfg
# Locale
d-i keyboard-configuration/xkb-keymap select fr(latin9)
d-i debian-installer/language string fr
d-i debian-installer/country string FR
d-i debian-installer/locale string fr_FR.UTF-8
d-i time/zone string Europe/Paris
d-i clock-setup/ntp boolean false

# APT
d-i mirror/country string manual
#d-i mirror/http/hostname string $(echo $http_proxy |cut -d/ -f3)
d-i mirror/http/hostname string deb.debian.org
d-i mirror/http/directory string /debian
d-i mirror/http/proxy ${http_proxy}
d-i base-installer/install-recommends boolean false
d-i apt-setup/cdrom/set-first boolean false               # Disable scan additional installation media
d-i apt-setup/non-free boolean true
d-i apt-setup/contrib boolean true
d-i apt-setup/disable-cdrom-entries boolean true          # Disable CDROM entries after install
d-i apt-setup/enable-source-repositories boolean false    # Disable source repositories
d-i apt-setup/use_mirror boolean true
d-i apt-setup/services-select multiselect security, updates
d-i apt-setup/security_host string security.debian.org
#d-i pkgsel/upgrade select full-upgrade                    # Upgrade installed packages

# Packages to install
#d-i pkgsel/include string openssh-server build-essential

# Root user config
#d-i passwd/root-login boolean false
d-i passwd/root-password password root
d-i passwd/root-password-again password root

# Default user config
#d-i passwd/make-user boolean false                       # Do not create a normal user account
d-i passwd/user-fullname string Freeminer
d-i passwd/username string freeminer
#d-i passwd/username seen false
d-i passwd/user-password password freeminer
d-i passwd/user-password-again password freeminer
#d-i passwd/user-password seen false
d-i passwd/user-default-groups string sudo

# Disk Partitioning
d-i partman-auto/method string regular
#d-i partman-auto/disk string /dev/vda
d-i partman-auto/choose_recipe select atomic
#d-i partman-partitioning/confirm_write_new_label boolean true
#d-i partman/choose_partition select finish
#d-i partman/confirm boolean true
d-i partman/confirm_nooverwrite boolean true

# Grub
d-i grub-installer/only_debian boolean true
d-i grub-installer/bootdev  string default

# Change default hostname
d-i netcfg/get_hostname string freeminer01
d-i netcfg/get_hostname seen false
d-i netcfg/get_domain string 

d-i finish-install/keep-consoles boolean true
#d-i finish-install/reboot_in_progress note
popularity-contest popularity-contest/participate boolean false
_EOF

#rm -f config/includes.installer/preseed.cfg # DEBUG


if [ "$CUSTOM_GRUB_BACKGROUND_LIVE" = "1" ]; then
    # Customize grub background (Live)
    mkdir -p config/bootloaders
    cp -a /usr/share/live/build/bootloaders/isolinux config/bootloaders/
    if [ ! -f /tmp/splash.png ]; then
        wget "https://images.ctfassets.net/q5ulk4bp65r7/77UG0yFqYxqIlehK6snIEO/ae54bbb1ad0dcf55934959bc9ade74ab/Copy_of_Learn_Illustration_What_is_Mining.jpg?w=640&fm=png" -O /tmp/splash.png
    fi
    cp -a /tmp/splash.png config/bootloaders/isolinux/splash.png
fi



# Build ISO
sudo lb clean
sudo lb build

