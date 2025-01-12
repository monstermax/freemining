
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';

import { now, getOpt, downloadFile } from '../common/utils';


const dataDir = __dirname + '/../../data/hiveos';

// API specs: https://app.swaggerhub.com/apis/HiveOS/public/2.1-beta#/

const algos = 'https://the.hiveos.farm/api/v2/hive/algos';
const coins = 'https://the.hiveos.farm/api/v2/hive/coins';
const pools = 'https://the.hiveos.farm/api/v2/pools';
const miners = 'https://the.hiveos.farm/api/v2/hive/miners';

const myFarms = 'https://the.hiveos.farm/api/v2/hive/farms';
const myFarm  = 'https://the.hiveos.farm/api/v2/farms/3024253';
const myFlighSheets = 'https://the.hiveos.farm/api/v2/farms/3024253/fs';
const myFlighSheet  = 'https://the.hiveos.farm/api/v2/farms/3024253/fs/15535992';
const myWallets = 'https://the.hiveos.farm/api/v2/farms/3024253/wallets';
const myWallet  = 'https://the.hiveos.farm/api/v2/farms/3024253/wallets/8180608';
const myWorkers = 'https://the.hiveos.farm/api/v2/farms/3024253/workers';
const myWorker  = 'https://the.hiveos.farm/api/v2/farms/3024253/workers/7875031';
const myOcs = 'https://the.hiveos.farm/api/v2/farms/3024253/oc/';
const myOc = 'https://the.hiveos.farm/api/v2/farms/3024253/oc/xxxxxx';
const myTags = 'https://the.hiveos.farm/api/v2/farms/3024253/tags/';
const myAcl = 'https://the.hiveos.farm/api/v2/farms/3024253/acl/';
const myKeys = 'https://the.hiveos.farm/api/v2/farms/3024253/keys/';
const myRoms = 'https://the.hiveos.farm/api/v2/farms/3024253/roms/';
const mySchedules = 'https://the.hiveos.farm/api/v2/farms/3024253/schedules/';
const myBenchmarks = 'https://the.hiveos.farm/api/v2/farms/3024253/benchmarks/';
const myContainers = 'https://the.hiveos.farm/api/v2/farms/3024253/containers/';

const myNotifications = 'https://the.hiveos.farm/api/v2/notifications/';

const hiveosVersions = 'https://the.hiveos.farm/api/v2/hive/versions';
const hiveosVersionDetails = 'https://the.hiveos.farm/api/v2/hive/versions/linux/0.6-220@230215';

const hiveosRepoUrls = 'https://the.hiveos.farm/api/v2/hive/repo_urls';
const hiveosPricing = 'https://the.hiveos.farm/api/v2/hive/pricing';
const hiveosStats = 'https://the.hiveos.farm/api/v2/hive/stats';
const hiveosCurrencies = 'https://the.hiveos.farm/api/v2/hive/currencies';

const hiveosOverclocks = 'https://the.hiveos.farm/api/v2/hive/overclocks';
const hiveosOverclocksNv1050 = 'https://the.hiveos.farm/api/v2/hive/overclocks?gpu_brand=nvidia&gpu_model=GeForce%20GTX%201050%20Ti';
const hiveosOverclocksNv1650 = 'https://the.hiveos.farm/api/v2/hive/overclocks?gpu_brand=nvidia&gpu_model=GeForce%20GTX%201650';
const hiveosOverclocksNv1660 = 'https://the.hiveos.farm/api/v2/hive/overclocks?gpu_brand=nvidia&gpu_model=GeForce%20GTX%201660';
const hiveosOverclocksNv1660Super = 'https://the.hiveos.farm/api/v2/hive/overclocks?gpu_brand=nvidia&gpu_model=GeForce%20GTX%201660%20SUPER';
const hiveosOverclocksNv1660Ti = 'https://the.hiveos.farm/api/v2/hive/overclocks?gpu_brand=nvidia&gpu_model=GeForce%20GTX%201660%20Ti';
const hiveosOverclocksNv1070 = 'https://the.hiveos.farm/api/v2/hive/overclocks?gpu_brand=nvidia&gpu_model=GeForce%20GTX%201070';
const hiveosOverclocksNv1080 = 'https://the.hiveos.farm/api/v2/hive/overclocks?gpu_brand=nvidia&gpu_model=GeForce%20GTX%201080';


//const poolCoins = 'https://the.hiveos.farm/api/v2/pools/by_name/rplant';
//const coinsPools = 'https://the.hiveos.farm/api/v2/pools/by_coin/BTC';




async function crawlMainJson() {
    const data: {[name:string]: string} = {
        algos,
        coins,
        pools,
        miners,
    };

    let name: string;
    for (name in data) {
        await downloadFile(data[name], `${dataDir}/${name}.json`);
    }

}


async function downloadCoinsIcons() {
    const coinsFile = `${dataDir}/coins.json`;
    const coinsContent = fs.readFileSync(coinsFile).toString();
    const coinsData = JSON.parse(coinsContent);

    const coins: string[] = coinsData.data.map((coin:any) => coin.coin);
    const coinsCount = coins.length;
    let i = 0;

    for (const coin of coins) {
        i++;
        if (! coin) continue;

        const missingCoins = [
            'xdag',
            'chn',
            'log',
            'lcc',
            'flr',
            'ethone',
            'vdl',
            'adot',
            'black',
            'aves',
            'kcn',
            'grin-c32',
            'lax',
            'k1pool-autolykos',
            'circ',
            'xch',
            'ycn',
            'pye',
            'tim',
            'blas',
            'roi',
            'mnt',
        ];
        if (missingCoins.includes(coin.toLowerCase())) {
            console.log(`[${i}/${coinsCount}] Warning ${coin}`);
            continue;
        }


        const iconUrl = `https://the.hiveos.farm/icons/${coin.toLowerCase()}.png`;
        const targetFile = `${dataDir}/coins_icons/${coin}.png`;

        const isExist = fs.existsSync(targetFile);
        if (isExist) {
            const stats = fs.statSync(targetFile);
            if (stats.size > 0) {
                console.log(`[${i}/${coinsCount}] Skipping ${coin} : ${iconUrl}`);
                continue;
            }
        }

        console.log(`[${i}/${coinsCount}] Downloading ${coin} : ${iconUrl}`);

        try {
            await downloadFile(iconUrl, targetFile);

        } catch (err: any) {
            console.warn(`Error while downloading ${iconUrl}`);
        }
    };
}


downloadCoinsIcons();

