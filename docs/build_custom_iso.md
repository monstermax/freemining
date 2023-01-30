
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
- https://live-team.pages.debian.net/live-manual/html/live-manual/examples.fr.html
- https://live-team.pages.debian.net/live-manual/html/live-manual/customizing-package-installation.fr.html
- https://burogu.makotoworkshop.org/index.php?post/2016/08/09/livebuild
- https://debian-facile.org/utilisateurs:abdelqahar:config:live-build
- https://dquinton.github.io/debian-install/netinstall/live-build.html
- https://kyodev.frama.io/kyopages/live-build/config/
- https://manpages.ubuntu.com/manpages/bionic/fr/man1/lb_config.1.html
- https://papy-tux.legtux.org/doc1327/index.html

Doc Live Build Preseed :
- https://www.debian.org/releases/stable/amd64/apbs04.fr.html
- https://github.com/prateepb/kali-live-build/blob/master/kali-config/common/includes.installer/preseed.cfg
- https://www.debian.org/releases/bullseye/example-preseed.txt

Doc Persistence :
- https://debian-facile.org/doc:install:deblive-usb-persistant
- https://papy-tux.legtux.org/doc1157/index.html


Apt-Proxy :
- https://dquinton.github.io/debian-install/config/apt-proxy.html



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

# Options Proxy APT
lb config noauto --apt-http-proxy http://192.168.1.113:3142/ \
                --mirror-bootstrap http://192.168.1.113:3142/debian/ \
                --mirror-chroot-security http://192.168.1.113:3142/debian-security/

# Options principales
lb config noauto --architectures amd64                        # choix de l'architecture (amd64 ou i386)
lb config noauto --image-name freemining-os                   # Nom de l'image ISO
lb config noauto --linux-packages "linux-image linux-headers" # Pour faire fonctionner le paquet dmks, il faut également installer le paquet linux-headers
lb config noauto --ignore-system-defaults                     # ignore default config from /etc/live/build.conf and /etc/live/build/*
lb config noauto --security true                              # Permets d'inclure les dépôts security  durant la construction de l'iso
lb config noauto --updates true                               # Permets d'inclure les dépôts updates   durant la construction de l'iso
lb config noauto --backports true                             # Permets d'inclure les dépôts backports durant la construction de l'iso
lb config noauto --archive-areas "main contrib non-free"      # Inclure les parties main, contrib et non-free des dépôts

# Options du mode Install
lb config noauto --debian-installer live                      # activer le mode Install
lb config noauto --debian-installer-gui "false"               # install without GUI

# Options du mode Live
lb config noauto --bootappend-live "boot=live components autologin username=freeminer lang=fr_FR.UTF-8 locales=fr_FR.UTF-8 keyboard-layouts=fr keyboard-model=pc105 timezone=Europe/Paris utc=yes hostname=freeminer01"

# Disabled options
#lb config noauto --apt-source-archives false                 # N'inclue pas les dépôts source durant le bootstrap ou le chroot
#lb config noauto --apt-recommends false                      # Permets de ne pas installer les paquets recommandés
#lb config noauto --apt-indices false
#lb config noauto --memtest none
#lb config noauto --debootstrap-options "--variant=minbase"
#lb config noauto --bootloaders "grub-efi"
#lb config noauto --binary-images "iso-hybrid"
#lb config noauto --mode "debian"
#lb config noauto --system "live"
#lb config noauto --architectures "amd64"
#lb config noauto --distribution "stretch"
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
mkdir -p config/packages-list/
cat << _EOF >> config/packages-list/basic-tools.list.chroot_install
linux-image-amd64
user-setup
sudo
ssh
curl
vim
wget
git
bc
jq
p7zip-full
net-tools
screen
micro
iftop
nmap
tcpdump
hping3
_EOF

#echo "jq" >> config/packages-list/basic-tools.list.chroot
#echo "vim" >> config/packages-list/basic-tools.list.chroot_live

cat << _EOF >> config/packages-list/dev-tools.list.chroot_install
nodejs
npm
php-cli
default-jdk
_EOF

#rm -f config/packages-list/live.list.chroot # DEBUG


#echo "user-setup sudo" > config/package-lists/recommends.list.chroot
#echo "ifupdown isc-dhcp-client" >> config/package-lists/recommends.list.chroot


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


cat << _EOF > config/hooks/normal/0602-change-grub-background.chroot
#!/bin/sh

set -e

# Customize grub background (Install. part 2)
#echo "GRUB_BACKGROUND=/usr/share/grub/splash.png" >> /etc/default/grub
#update-grub
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
cat << _EOF > config/includes.installer/preseed.cfg

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
d-i mirror/http/proxy http://192.168.1.113:3142/
#d-i base-installer/install-recommends boolean false
d-i apt-setup/cdrom/set-first boolean false               # Disable scan additional installation media
d-i apt-setup/non-free boolean true
d-i apt-setup/contrib boolean true
d-i apt-setup/disable-cdrom-entries boolean true          # Disable CDROM entries after install
d-i apt-setup/enable-source-repositories boolean false    # Disable source repositories
d-i apt-setup/use_mirror boolean true
d-i apt-setup/services-select multiselect security, updates
d-i apt-setup/security_host string security.debian.org
#d-i pkgsel/upgrade select full-upgrade                    # Upgrade installed packages

# Root user config
#d-i passwd/root-login boolean false
d-i passwd/root-password password root
d-i passwd/root-password-again password root

# Default user config
#d-i passwd/make-user boolean false                       # Do not create a normal user account
d-i passwd/user-fullname string Freeminer
d-i passwd/username string freeminer
d-i passwd/username seen false
d-i passwd/user-password password freeminer
d-i passwd/user-password-again password freeminer
d-i passwd/user-password seen false
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
d-i netcfg/get_domain string 

d-i finish-install/keep-consoles boolean true
#d-i finish-install/reboot_in_progress note
#popularity-contest popularity-contest/participate boolean false
_EOF

#rm -f config/includes.installer/preseed.cfg # DEBUG


# Customize grub background (Live)
mkdir -p config/bootloaders
cp -a /usr/share/live/build/bootloaders/isolinux config/bootloaders/
if [ ! -f /tmp/splash.png ]; then
    wget "https://images.ctfassets.net/q5ulk4bp65r7/77UG0yFqYxqIlehK6snIEO/ae54bbb1ad0dcf55934959bc9ade74ab/Copy_of_Learn_Illustration_What_is_Mining.jpg?w=640&fm=png" -O /tmp/splash.png
fi
cp -a /tmp/splash.png config/bootloaders/isolinux/splash.png

# Customize grub background (Install. part 1)
mkdir -p config/includes.chroot/usr/share/grub
cp -a /tmp/splash.png config/includes.chroot/usr/share/grub/
#mkdir -p config/includes.chroot/etc/default
#cat << _EOF >> config/includes.chroot/etc/default/grub
#GRUB_BACKGROUND=/usr/share/grub/splash.png
#_EOF


# Build ISO
sudo lb build

```





### APT-Proxy-ng
```bash
sudo install apt-cacher-ng
sudo nano /etc/apt-cacher-ng/acng.conf
```




# Persistence image from ISO (version simple)

- https://prog.world/how-to-create-a-linux-disk-image-with-multiple-partitions-without-having-a-physical-sample/
- https://unix.stackexchange.com/questions/411670/how-to-create-a-disk-image-of-a-linux-machine-with-several-partitions
- https://superuser.com/questions/610819/how-to-resize-img-file-created-with-dd
- https://superuser.com/questions/610819/how-to-resize-img-file-created-with-dd


```bash
SOURCE_ISO_FILE=/tmp/live/test7/freemining-os-amd64.hybrid.iso
TARGET_IMG_FILE=/tmp/lb/image-iso.img
sudo cp -a $SOURCE_ISO_FILE $TARGET_IMG_FILE
sudo chown $USER: $TARGET_IMG_FILE
qemu-img resize -f file $TARGET_IMG_FILE 4G


sudo apt-get install -y kpartx

#SOURCE_ISO_FILE=/tmp/live/test7/freemining-os-amd64.hybrid.iso
#TARGET_IMG_FILE=/tmp/lb/image-iso.img

PERSIST_PART_MOUNT=/tmp/lb/persist.part
LOOP_DEV=$(sudo losetup -f |cut -d/ -f3)

#sudo dd if=${SOURCE_ISO_FILE} of=${TARGET_IMG_FILE} bs=4M

sudo losetup /dev/${LOOP_DEV} ${TARGET_IMG_FILE}
sudo cfdisk /dev/${LOOP_DEV}
# create partition 2G
# create partition 1G
sudo losetup -d /dev/${LOOP_DEV}

sudo losetup /dev/${LOOP_DEV} ${TARGET_IMG_FILE}
sudo kpartx -v -a /dev/${LOOP_DEV}
#sudo mkfs.ext4 /dev/mapper/${LOOP_DEV}p1
sudo mkfs.ext4 -L live-rw /dev/mapper/${LOOP_DEV}p3
sudo mkfs.ext4 -L persistence /dev/mapper/${LOOP_DEV}p4


N=4
mkdir -p ${PERSIST_PART_MOUNT}
sudo mount /dev/mapper/${LOOP_DEV}p${N} ${PERSIST_PART_MOUNT}
sudo chown $USER: ${PERSIST_PART_MOUNT}
echo "/ union" > ${PERSIST_PART_MOUNT}/persistence.conf
sudo umount ${PERSIST_PART_MOUNT}

#sudo dd if=${SOURCE_ISO_FILE} of=/dev/mapper/${LOOP_DEV}p1 bs=4M
#sudo sync
#sudo dd if=u-boot.img of=/dev/${LOOP_DEV} bs=1k seek=1 conv=fsync


sudo kpartx -v -d /dev/${LOOP_DEV}
sudo losetup -d /dev/${LOOP_DEV}

# Write to device
#sudo dd if=${TARGET_IMG_FILE} of=${BLKDEV}

```

