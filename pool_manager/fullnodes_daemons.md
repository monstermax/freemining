
# Fullnodes management



## Ergo

## Start deamon
```bash
java -jar -Xmx4G ~/nodes/ergo/ergo-5.0.5.jar --mainnet -c ~/nodes/ergo/ergo.conf
```

## Check status
```bash
pgrep -f -a jar.*ergo-.*\.jar
```



## Flux

## Start deamon
```bash
fluxd -daemon
```

## Check status
```bash
pgrep -f -a fluxd
```



## Kaspa

## Start deamon
```bash
~/nodes/kaspa/kaspa/bin/kaspad --utxoindex --rpclisten=16110
```

## Check status
```bash
pgrep -f -a kaspad
```



## Komodo

## Start deamon
```bash
~/nodes/./komodo/src/komodod -rpcuser=user -rpcpassword=pass -rpcbind=0.0.0.0 -rpcport=8332 -rpcallowip=127.0.0.1 -rpcallowip=51.255.67.45 -port=7770 -exportdir=/tmp -daemon
```

## Check status
```bash
pgrep -f -a komodod
```



## Meowcoin

## Start deamon
```bash
~/nodes/meowcoin/meowcoind -rpcuser=user -rpcpassword=pass -rpcallowip=127.0.0.1 -rpcbind=127.0.0.1 -rpcport=9766 -daemon
```

## Check status
```bash
pgrep -f -a meowcoind
```



## Monero

## Start deamon
```bash
sudo systemctl start monerod

monero-wallet-rpc --daemon-address 127.0.0.1:18081 --disable-rpc-login --config-file /var/lib/monero/monerod-wallet-rpc.conf --password-file /home/monstermax/nodes/monero/monero_wallet/yomining.secret --detach
```

## Check status
```bash
pgrep -f -a monerod

sudo systemctl status monerod
```



## Neoxa

## Start deamon
```bash
xxxxx
```

## Check status
```bash
pgrep -f -a xxxxx
```




## Radiant

## Start deamon
```bash
xxxxx
```

## Check status
```bash
pgrep -f -a xxxxx
```




## Raptoreum

## Start deamon
```bash
xxxxx
```

## Check status
```bash
pgrep -f -a xxxxx
```




## Ravencoin

## Start deamon
```bash
xxxxx
```

## Check status
```bash
pgrep -f -a xxxxx
```




## zcash

## Start deamon
```bash
~/nodes/zcash/zcash-5.3.2/bin/zcashd -rpcuser=user -rpcpassword=pass -rpcallowip=127.0.0.1 -rpcbind=127.0.0.1 -rpcport=8232 -daemon
```

## Check status
```bash
pgrep -f -a zcashd

tail -f /proc/$(pgrep -f zcashd)/fd/1
```

## Kill
```bash
pkill -f zcashd
```



