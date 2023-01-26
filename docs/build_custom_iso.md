
# Building a custom Linux ISO image


## Building custom Debian ISO image


### Building custom ISO image
- https://dev.to/otomato_io/how-to-create-custom-debian-based-iso-4g37



### Custom Debian image avec live-build


Doc Live Build:
- https://debian-facile.org/utilisateurs:abdelqahar:tutos:live-build
- https://debian-facile.org/doc:install:live-build
- https://debian-facile.org/doc:install:deblive-usb-persistant
- https://live-team.pages.debian.net/live-manual/html/live-manual/index.fr.html
- https://live-team.pages.debian.net/live-manual/html/live-manual/the-basics.fr.html

Doc Live Build Preseed :
- https://www.debian.org/releases/stable/amd64/apbs04.fr.html
- https://github.com/prateepb/kali-live-build/blob/master/kali-config/common/includes.installer/preseed.cfg
- https://www.debian.org/releases/bullseye/example-preseed.txt



```bash
apt-get update
apt-get install live-manual live-build
```



```bash
mkdir -p /tmp/live
cd /tmp/live

mkdir test1
cd $_
mkdir auto
cp /usr/share/doc/live-build/examples/auto/* auto/


# Config
cat << _EOF > auto/config
#!/bin/sh

set -e

lb config noauto --architectures amd64
lb config noauto --linux-packages "linux-image"
lb config noauto --ignore-system-defaults
#lb config noauto --debian-installer live
lb config noauto --security true
lb config noauto --updates true
lb config noauto --backports true
lb config noauto --archive-areas main contrib non-free
lb config noauto --apt-source-archives false
lb config noauto --apt-recommends false
lb config noauto --image-name freemining-os
lb config noauto --bootappend-live "boot=live toram swap=true components autologin username=freeminer lang=fr_FR.UTF-8 locales=fr_FR.UTF-8 keyboard-layouts=fr keyboard-model=pc105 timezone=Europe/Paris utc=yes hostname=freeminer01"

# Options for --bootappend-live :
# - boot=live
# - toram
# - swap=true
# - components
# - autologin
# - username=freeminer
# - lang=fr_FR.UTF-8
# - locales=fr_FR.UTF-8
# - keyboard-layouts=fr
# - keyboard-model=pc105
# - timezone=Europe/Paris
# - utc=yes
# - hostname=freeminer01

if [ "\$@" != "" ]; then
    lb config noauto "\$@"
fi

_EOF


# Deb packages selection
mkdir -p config/packages-list/
cat << _EOF > config/packages-list/live.list.chroot
linux-image-amd64
ssh
sudo
curl
vim
wget
git
bc
jq
screen
micro
p7zip-full
net-tools
iftop
nmap
tcpdump
hping3
nodejs
npm
php-cli
default-jdk
_EOF

rm -f config/packages-list/live.list.chroot # DEBUG


# Filesystem skeleton
mkdir -p config/includes.chroot


# pre-install freemining sources (without node_modules, miners, fullnodes)
mkdir -p config/includes.chroot/opt/
cd config/includes.chroot/opt/
git clone gogs@gogs.karmas.fr:monstermax/freemining.git
cd ../../..

mkdir -p config/includes.chroot/usr/local/bin
cat << _EOF > config/includes.chroot/usr/local/bin/freemining
#!/bin/bash

cd /opt/freemining
./freemining.sh \$@
_EOF
chmod +x config/includes.chroot/usr/local/bin/freemining

mkdir -p config/hooks/normal
cat << _EOF > config/hooks/normal/0600-npm-install-typescript.chroot
#!/bin/sh

set -e

#npm install -g typescript ts-node tslib @types/node
_EOF

cat << _EOF > config/hooks/normal/0601-install-freemining.chroot
#!/bin/sh

set -e

#/opt/freemining/freemining.sh modules-install
#/opt/freemining/freemining.sh bin-install
_EOF


# User skel
mkdir -p config/includes.chroot/etc/skel

cat << _EOF >> config/includes.chroot/etc/skel/.bashrc

alias l="ls -l --color"
alias ll="ls -la --color"

#source /opt/freemining/common/bash/frm_autocompletion.sh

_EOF


# Preseed
mkdir -p config/includes.installer
cat << _EOF >> config/includes.installer/preseed.cfg

# Locale
d-i keyboard-configuration/xkb-keymap select fr(latin9)
d-i debian-installer/language string fr
d-i debian-installer/country string FR
d-i debian-installer/locale string fr_FR.UTF-8
d-i time/zone string Europe/Paris
d-i clock-setup/ntp boolean true

# APT
d-i mirror/country string manual
d-i mirror/http/hostname string deb.debian.org
d-i mirror/http/directory string /debian
d-i mirror/http/proxy string
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

# Root config
#d-i passwd/root-login boolean false
d-i passwd/root-password password root
d-i passwd/root-password-again password root

# User config
#d-i passwd/make-user boolean false                       # Do not create a normal user account
d-i passwd/user-fullname string Freeminer
d-i passwd/username string freeminer
d-i passwd/user-password password freeminer
d-i passwd/user-password-again password freeminer
d-i passwd/user-default-groups string sudo

# Disk Partitioning
d-i partman-auto/choose_recipe select atomic
#d-i partman/confirm boolean true

# Grub
d-i grub-installer/only_debian boolean true
d-i grub-installer/bootdev  string default

# Change default hostname
d-i netcfg/get_hostname string freeminer01
d-i netcfg/get_hostname seen false
# DOMAIN ???
# CONSOLE ??? UTF-8 (encoding for console-setup)

#d-i finish-install/reboot_in_progress note
#popularity-contest popularity-contest/participate boolean false
_EOF

#rm -f config/includes.installer/preseed.cfg # DEBUG


# Customize grub background
mkdir -p config/bootloaders
cp -a /usr/share/live/build/bootloaders/isolinux config/bootloaders/
wget "https://images.ctfassets.net/q5ulk4bp65r7/77UG0yFqYxqIlehK6snIEO/ae54bbb1ad0dcf55934959bc9ade74ab/Copy_of_Learn_Illustration_What_is_Mining.jpg?w=640&fm=png" -O /tmp/splash.png
cp -a /tmp/splash.png config/bootloaders/isolinux/splash.png


# Build ISO
sudo lb build

```

