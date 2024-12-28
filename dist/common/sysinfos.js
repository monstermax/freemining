"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentLoad = exports.getSystemInfos = exports.getProcessesInfos = void 0;
const tslib_1 = require("tslib");
const systeminformation_1 = tslib_1.__importDefault(require("systeminformation"));
// https://systeminformation.io/
function getProcessesInfos() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const processesInfos = {};
        yield systeminformation_1.default.processes().then(data => {
            processesInfos.processes = data;
        }).catch((err) => {
            console.warn(`[getSystemInfos] Error: ${err.message}`);
        });
        return processesInfos;
    });
}
exports.getProcessesInfos = getProcessesInfos;
function getSystemInfos() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const sysInfos = {};
        // CPU
        try {
            const data = yield systeminformation_1.default.cpu();
            sysInfos.cpu = {
                manufacturer: data.manufacturer,
                vendor: data.vendor,
                brand: data.brand,
                speed: data.speed,
                processors: data.processors,
                cores: data.cores,
                physicalCores: data.physicalCores,
            };
        }
        catch (err) {
            console.warn(`[getSystemInfos] Error: ${err.message}`);
        }
        // GRAPHICS
        try {
            const data = yield systeminformation_1.default.graphics();
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
                pciBus: gpu.pciBus,
                busAddress: gpu.busAddress,
                subDeviceId: gpu.subDeviceId,
            }));
            //const screens = data.displays; // vendor, model, connection, sizeX, sizeY, resolutionX, resolutionY, currentResX, currentResY, currentRefreshRate
            //console.log(data);
        }
        catch (err) {
            console.warn(`[getSystemInfos] Error: ${err.message}`);
        }
        yield systeminformation_1.default.system().then(data => {
            sysInfos.system = data;
        }).catch((err) => {
            console.warn(`[getSystemInfos] Error: ${err.message}`);
        }); // manufacturer, model, version, virtual
        yield systeminformation_1.default.baseboard().then(data => {
            sysInfos.board = data;
        }).catch((err) => {
            console.warn(`[getSystemInfos] Error: ${err.message}`);
        }); // manufacturer, model, version
        //await si.uuid().then(data => console.log(data));
        //await si.bios().then(data => console.log(data)); // vendor, version, releaseDate
        //await si.chassis().then(data => console.log(data)); // manufacturer, model, type
        yield systeminformation_1.default.networkInterfaces('default').then(data => {
            sysInfos.netIface = data;
        }).catch((err) => {
            console.warn(`[getSystemInfos] Error: ${err.message}`);
        });
        //await si.networkInterfaceDefault().then(data => console.log(data));
        yield systeminformation_1.default.networkGatewayDefault().then(data => {
            sysInfos.netGateway = data;
        }).catch((err) => {
            console.warn(`[getSystemInfos] Error: ${err.message}`);
        });
        //await si.networkStats().then(data => console.log(data));
        //await si.networkConnections().then(data => console.log(data));
        yield systeminformation_1.default.diskLayout().then(data => {
            sysInfos.disks = data;
        }).catch((err) => {
            console.warn(`[getSystemInfos] Error: ${err.message}`);
        }); // [{ device, type, name, vendor, size, interfaceType, temperature }]
        //await si.blockDevices().then(data => console.log(data));
        yield systeminformation_1.default.fsSize().then(data => {
            sysInfos.fs = data;
        }).catch((err) => {
            console.warn(`[getSystemInfos] Error: ${err.message}`);
        });
        yield systeminformation_1.default.osInfo().then(data => {
            sysInfos.os = data;
        }).catch((err) => {
            console.warn(`[getSystemInfos] Error: ${err.message}`);
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
    });
}
exports.getSystemInfos = getSystemInfos;
function getCurrentLoad() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let currentLoad = {};
        yield systeminformation_1.default.currentLoad().then((data) => {
            currentLoad = data;
        }).catch((err) => {
            console.warn(`[getSystemInfos] getCurrentLoad Error: ${err.message}`);
        });
        return currentLoad;
    });
}
exports.getCurrentLoad = getCurrentLoad;
