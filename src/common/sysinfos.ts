
import si from 'systeminformation';

// https://systeminformation.io/


export async function getProcessesInfos() {
    const processesInfos: any = {};

    await si.processes().then(data => {
        processesInfos.processes = data;
    }).catch((err: any) => {
        console.warn(`[getSystemInfos] Error: ${err.message}`)
    });

    return processesInfos;
}


export async function getSystemInfos() {
    const sysInfos: any = {};

    // CPU
    try {
        const data = await si.cpu();
        sysInfos.cpu = {
            manufacturer: data.manufacturer,
            vendor: data.vendor,
            brand: data.brand,
            speed: data.speed,
            processors: data.processors,
            cores: data.cores,
            physicalCores: data.physicalCores,
        };

    } catch (err: any) {
        console.warn(`[getSystemInfos] Error: ${err.message}`)
    }

    // GRAPHICS
    try {
        const data = await si.graphics();
        const gpus = data.controllers;

        sysInfos.gpus = gpus.map((gpu, idx) => ({
            idx,
            name: gpu.name,
            vendor: gpu.vendor,
            model: gpu.model,
            fanSpeed: gpu.fanSpeed,
            memoryTotal: gpu.memoryTotal,
            memoryUsed: gpu.memoryUsed,
            memoryFree: gpu.memoryFree,
            utilizationGpu: gpu.utilizationGpu,
            utilizationMemory: gpu.utilizationMemory,
            temperatureGpu: gpu.temperatureGpu,
            powerDraw: gpu.powerDraw,
            powerLimit: gpu.powerLimit,
            clockCore: gpu.clockCore,
            clockMemory: gpu.clockMemory,
            driverVersion: gpu.driverVersion,
            bus: gpu.bus,
            busAddress: gpu.busAddress,
            pciBus: gpu.pciBus,
            deviceId: gpu.deviceId,
            subDeviceId: gpu.pciID,
        }));

        //const screens = data.displays; // vendor, model, connection, sizeX, sizeY, resolutionX, resolutionY, currentResX, currentResY, currentRefreshRate

        //console.log(data);
    } catch (err: any) {
        console.warn(`[getSystemInfos] Error: ${err.message}`)
    }

    await si.system().then(data => {
        sysInfos.system = data;
    }).catch((err: any) => {
        console.warn(`[getSystemInfos] Error: ${err.message}`)
    }); // manufacturer, model, version, virtual

    await si.baseboard().then(data => {
        sysInfos.board = data;
    }).catch((err: any) => {
        console.warn(`[getSystemInfos] Error: ${err.message}`)
    }); // manufacturer, model, version

    //await si.uuid().then(data => console.log(data));
    //await si.bios().then(data => console.log(data)); // vendor, version, releaseDate
    //await si.chassis().then(data => console.log(data)); // manufacturer, model, type

    await si.networkInterfaces('default').then(data => {
        sysInfos.netIface = data;
    }).catch((err: any) => {
        console.warn(`[getSystemInfos] Error: ${err.message}`)
    });

    //await si.networkInterfaceDefault().then(data => console.log(data));

    await si.networkGatewayDefault().then(data => {
        sysInfos.netGateway = data;
    }).catch((err: any) => {
        console.warn(`[getSystemInfos] Error: ${err.message}`)
    });

    //await si.networkStats().then(data => console.log(data));
    //await si.networkConnections().then(data => console.log(data));

    await si.diskLayout().then(data => {
        sysInfos.disks = data;
    }).catch((err: any) => {
        console.warn(`[getSystemInfos] Error: ${err.message}`)
    }); // [{ device, type, name, vendor, size, interfaceType, temperature }]

    //await si.blockDevices().then(data => console.log(data));

    await si.fsSize().then(data => {
        sysInfos.fs = data;
    }).catch((err: any) => {
        console.warn(`[getSystemInfos] Error: ${err.message}`)
    });

    await si.osInfo().then(data => {
        sysInfos.os = data;
    }).catch((err: any) => {
        console.warn(`[getSystemInfos] Error: ${err.message}`)
    });

    //await si.versions().then(data => console.log(data));
    //await si.versions('npm, java, python, python3').then(data => console.log(data));

    //await si.users().then(data => {
    //    sysInfos.users = data;
    //}).catch((err: any) => {
    //    console.warn(`[getSystemInfos] Error: ${err.message}`)
    //});

    //await si.processLoad('node, xmrig, nbminer, lolMiner, trex').then(data => {
    //    sysInfos.processLoad = data;
    //}).catch((err: any) => {
    //    console.warn(`[getSystemInfos] Error: ${err.message}`)
    //});

    //await si.currentLoad().then(data => {
    //    sysInfos.currentLoad = data;
    //}).catch((err: any) => {
    //    console.warn(`[getSystemInfos] Error: ${err.message}`)
    //});

    return sysInfos;
}


export async function getCurrentLoad(): Promise<any> {
    let currentLoad = {};

    await si.currentLoad().then((data: any) => {
        currentLoad = data;

    }).catch((err: any) => {
        console.warn(`[getSystemInfos] getCurrentLoad Error: ${err.message}`)
    });

    return currentLoad;
}

