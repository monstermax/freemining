"use strict";
// source: https://github.com/Shaped/gpumgr/blob/main/src/gpumgr.js
// source: https://github.com/Shaped/amdpwrman/blob/master/amdpwrman
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const fsp = fs_1.default.promises;
const util_1 = tslib_1.__importDefault(require("util"));
const child_process_1 = require("child_process");
const execp = util_1.default.promisify(child_process_1.exec);
const xml2json_1 = tslib_1.__importDefault(require("xml2json"));
const path_1 = tslib_1.__importDefault(require("path"));
const $me = path_1.default.basename(process.argv[1]);
const nvidiaSmiPath = 'nvidia-smi';
/* #################################################### */
class gpuManager {
    constructor() {
        this.GPUs = [];
    }
    handleArguments() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const action = process.argv[2] || 'help';
            switch (action) {
                case 'show':
                case 'fan':
                case 'power':
                case 'list':
                    yield this.enumerateGPUs();
                    break;
            }
            const args = process.argv.slice(2);
            switch (action) {
                case '--help':
                case '-h':
                case 'help':
                case 'usage':
                case 'wtf':
                    this.showUsage();
                    break;
                case 'show':
                    this.handleShowStatus(args[0]);
                    break;
                case 'fan':
                    this.handleFans(args[0], args[1]);
                    break;
                case 'power':
                    this.handlePower(args[0], args[1]);
                    break;
                case 'list':
                    this.handleListGPUs(args[0]);
                    break;
                default:
                    console.log(`Command line argument not understood: '${action}'`);
                    this.showUsage();
                    break;
            }
        });
    }
    handleFans(fanStr, gpuName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            switch (fanStr) {
                case 'manual':
                case 'enable':
                    switch (gpuName) {
                        case 'all':
                            for (const gpu of this.GPUs) {
                                this.setGPUFanMode(gpu.gpuId, 'manual');
                            }
                            break;
                        case 'nvidia':
                        case 'amd':
                        case 'intel':
                            for (const gpu of this.GPUs) {
                                if (gpu.vendorName === gpuName) {
                                    this.setGPUFanMode(gpu.gpuId, 'manual');
                                }
                            }
                            break;
                        default:
                            const gpuId = Number(gpuName) || 0;
                            this.setGPUFanMode(gpuId, 'manual');
                            break;
                    }
                    break;
                case 'auto':
                case 'automatic':
                case 'disable':
                    switch (gpuName) {
                        case 'all':
                            for (const gpu of this.GPUs) {
                                this.setGPUFanMode(gpu.gpuId, 'automatic');
                            }
                            break;
                        case 'nvidia':
                        case 'amd':
                        case 'intel':
                            for (const gpu of this.GPUs) {
                                if (gpu.vendorName === gpuName) {
                                    this.setGPUFanMode(gpu.gpuId, 'automatic');
                                }
                            }
                            break;
                        default:
                            const gpuId = Number(gpuName) || 0;
                            this.setGPUFanMode(gpuId, 'automatic');
                            break;
                    }
                    break;
                case 'curve':
                    console.log(`fan curve mode not yet impemented`);
                    break;
                default:
                    const speedStr = (fanStr.endsWith('%')) ? fanStr.slice(0, -1) : fanStr;
                    const speed = Number(speedStr);
                    switch (gpuName) {
                        case 'all':
                            for (const gpu of this.GPUs) {
                                yield this.setGPUFanSpeed(gpu.gpuId, speed);
                            }
                            break;
                        case 'nvidia':
                        case 'amd':
                        case 'intel':
                            for (const gpu of this.GPUs) {
                                if (gpu.vendorName === gpuName) {
                                    yield this.setGPUFanSpeed(gpu.gpuId, speed);
                                }
                            }
                            break;
                        default:
                            const gpuId = Number(gpuName) || 0;
                            yield this.setGPUFanSpeed(gpuId, speed);
                            break;
                    }
            }
        });
    }
    handlePower(powerStr, gpuName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            //we could potentially allow percentages if we calculate stuff
            //ie 100% is max_power, 0% is min_power?
            //if (power.substr(-1,1)=="%") power=power.slice(0,power.length-1);
            if (powerStr === "reset") {
                switch (gpuName) {
                    case 'all':
                        for (const gpu of this.GPUs) {
                            yield this.resetGPUPower(gpu.gpuId);
                        }
                        break;
                    case 'nvidia':
                    case 'amd':
                    case 'intel':
                        for (const gpu of this.GPUs) {
                            if (gpu.vendorName === gpuName) {
                                yield this.resetGPUPower(gpu.gpuId);
                            }
                        }
                        break;
                    default:
                        const gpuId = Number(gpuName) || 0;
                        yield this.resetGPUPower(gpuId);
                        break;
                }
            }
            else {
                if (!Number.isInteger(parseInt(powerStr))) {
                    console.log(`Invalid power value: ${powerStr}`);
                    process.exit(1);
                }
                const power = Number(powerStr);
                switch (gpuName) {
                    case 'all':
                        for (const gpu of this.GPUs) {
                            yield this.setGPUPower(gpu.gpuId, power);
                        }
                        break;
                    case 'nvidia':
                    case 'amd':
                    case 'intel':
                        for (const gpu of this.GPUs) {
                            if (gpu.vendorName === gpuName) {
                                yield this.setGPUPower(gpu.gpuId, power);
                            }
                        }
                        break;
                    default:
                        const gpuId = Number(gpuName) || 0;
                        yield this.setGPUPower(gpuId, power);
                        break;
                }
            }
        });
    }
    handleListGPUs(gpuName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            switch (gpuName) {
                case 'all':
                    for (const gpu of this.GPUs) {
                        this.displayGpusList(gpu.gpuId);
                    }
                    break;
                case 'nvidia':
                case 'amd':
                case 'intel':
                    for (const gpu of this.GPUs) {
                        if (gpu.vendorName === gpuName) {
                            this.displayGpusList(gpu.gpuId);
                        }
                    }
                    break;
                default:
                    if (Number.isInteger(parseInt(gpuName))) {
                        const gpuId = Number(gpuName) || 0;
                        this.displayGpusList(gpuId);
                    }
                    else {
                        for (const gpu of this.GPUs) {
                            this.displayGpusList(gpu.gpuId);
                        }
                    }
                    break;
            }
        });
    }
    handleShowStatus(gpuName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            switch (gpuName) {
                case 'all':
                    for (const gpu of this.GPUs) {
                        yield this.displayGpuStatus(gpu.gpuId);
                    }
                    break;
                case 'nvidia':
                case 'amd':
                case 'intel':
                    for (const gpu of this.GPUs) {
                        if (gpu.vendorName === gpuName) {
                            yield this.displayGpuStatus(gpu.gpuId);
                        }
                    }
                    break;
                default:
                    let gpuId = Number(gpuName) || 0;
                    if (typeof this.GPUs[gpuId] === 'undefined') {
                        if (typeof this.GPUs[0] === 'undefined') {
                            console.log(`GPU${gpuId} not found - no GPU0 to fallback to.`);
                            process.exit(1);
                        }
                        else {
                            console.log(`GPU${gpuId} not found - defaulting to GPU0.`);
                            gpuId = 0;
                        }
                    }
                    yield this.displayGpuStatus(gpuId);
                    break;
            }
        });
    }
    enumerateGPUs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log(`Enumerating GPUs..`);
            let entries = fs_1.default.readdirSync(`/sys/class/drm`);
            entries = entries.filter((entry) => (entry.slice(0, 4) == 'card' && entry.length == 5) ? true : false);
            for (let card of entries) {
                let gpuId = Number(card.substr(4, 1));
                let fullpcidevice = this.getFullPCIDevice(gpuId); // '../../../0000:07:00.0'
                let almostfullpcidevice = fullpcidevice.substr(9, fullpcidevice.length - 11); // '0000:07:00'
                fullpcidevice = fullpcidevice.substr(9, fullpcidevice.length - 9); // '0000:07:00.0'
                let pcidevice = fullpcidevice.substr(-7, 7); // '07:00.0'
                let vendorid = this.getPCIVendorID(gpuId); // '10de'
                let deviceid = this.getPCIDeviceID(gpuId); // '1c82'
                let subvendorid = this.getPCISubVendorID(gpuId); // 1458
                let subdeviceid = this.getPCISubDeviceID(gpuId); // 3764
                let vendorName = null;
                let hwmon = null;
                let nv = null;
                switch (vendorid) {
                    case `1002`:
                        hwmon = this.getHWMon(gpuId);
                        vendorName = 'amd';
                        // https://github.com/GPUOpen-Tools/radeon_gpu_profiler/releases ?
                        break;
                    case `10de`:
                        vendorName = 'nvidia';
                        let nvidiaQuery = yield execp(`${nvidiaSmiPath} -x -q --id=${fullpcidevice}`);
                        nv = JSON.parse(xml2json_1.default.toJson(nvidiaQuery.stdout));
                        // C:\Windows\System32\DriverStore\FileRepository\nvdm*\nvidia-smi.exe
                        // C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe [OLD]
                        // C:\Windows\System32\nvidia-smi.exe ?
                        break;
                    case `8086`:
                        vendorName = 'intel';
                        break;
                }
                console.log(`Found GPU${gpuId} from ${vendorName} (${vendorid}:${deviceid})`);
                let GPU = {
                    gpuId,
                    card,
                    fullpcidevice,
                    almostfullpcidevice,
                    pcidevice,
                    vendorid,
                    vendorName,
                    subvendorid,
                    subdeviceid,
                    deviceid,
                };
                GPU.hwmon = hwmon;
                GPU.nv = nv;
                this.GPUs.push(GPU);
            }
            ;
        });
    }
    updateNV(gpuId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let fullpcidevice = this.GPUs[gpuId].fullpcidevice;
            let nvidiaQuery = yield execp(`${nvidiaSmiPath} -x -q --id=${fullpcidevice}`);
            this.GPUs[gpuId].nv = JSON.parse(xml2json_1.default.toJson(nvidiaQuery.stdout));
        });
    }
    getHWMon(gpuId) {
        return (fs_1.default.readdirSync(`/sys/class/drm/card${gpuId}/device/hwmon`))[0];
    }
    getIRQNumber(gpuId) {
        return (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/irq`, `utf8`)).trim();
    }
    getFullPCIDevice(gpuId) {
        return (fs_1.default.readlinkSync(`/sys/class/drm/card${gpuId}/device`));
    }
    getPCIVendorID(gpuId) {
        return (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/vendor`, `utf8`)).trim().substr(2, 4);
    }
    getPCIDeviceID(gpuId) {
        return (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/device`, `utf8`)).trim().substr(2, 4);
    }
    getPCISubVendorID(gpuId) {
        return (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/subsystem_vendor`, `utf8`)).trim().substr(2, 4);
    }
    getPCISubDeviceID(gpuId) {
        return (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/subsystem_device`, `utf8`)).trim().substr(2, 4);
    }
    getPCILinkSpeed(gpuId) {
        return (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/current_link_speed`, `utf8`)).trim();
    }
    getPCILinkWidth(gpuId) {
        return (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/current_link_width`, `utf8`)).trim();
    }
    getPCIMaxLinkSpeed(gpuId) {
        return (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/max_link_speed`, `utf8`)).trim();
    }
    getPCIMaxLinkWidth(gpuId) {
        return (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/max_link_width`, `utf8`)).trim();
    }
    getGPUBusy(gpuId) {
        var _a;
        let gpu_busy = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                gpu_busy = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/gpu_busy_percent`, `utf8`)).trim();
                break;
            case 'nvidia':
                gpu_busy = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.utilization.gpu_util) || '';
                gpu_busy = gpu_busy.slice(0, gpu_busy.length - 2);
                break;
        }
        return Number(gpu_busy);
    }
    getMemBusy(gpuId) {
        var _a;
        let mem_busy = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                mem_busy = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/mem_busy_percent`, `utf8`)).trim();
                break;
            case 'nvidia':
                mem_busy = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.utilization.memory_util) || '';
                mem_busy = mem_busy.slice(0, mem_busy.length - 2);
                break;
        }
        return Number(mem_busy);
    }
    getMemUsed(gpuId) {
        var _a;
        let memUsedStr = null;
        let memUsed = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                memUsedStr = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/mem_info_vram_used`, `utf8`)).trim();
                memUsed = Number(memUsedStr);
                break;
            case 'nvidia':
                memUsedStr = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.fb_memory_usage.used) || '';
                memUsedStr = memUsedStr.slice(0, memUsedStr.length - 4);
                memUsed = Number(memUsedStr) * 1000 * 1000;
                break;
        }
        return memUsed;
    }
    getMemTotal(gpuId) {
        var _a;
        let memTotalStr = null;
        let memTotal = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                memTotalStr = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/mem_info_vram_total`, `utf8`)).trim();
                memTotal = Number(memTotalStr);
                break;
            case 'nvidia':
                memTotalStr = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.fb_memory_usage.total) || '';
                memTotalStr = memTotalStr.slice(0, memTotalStr.length - 4);
                memTotal = Number(memTotalStr) * 1000 * 1000;
                break;
        }
        return memTotal;
    }
    getGPUCoreTemperature(gpuId) {
        var _a;
        let temperatureStr = null;
        let temperature = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                temperatureStr = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/temp1_input`, `utf8`)).trim();
                temperature = (Number(temperatureStr) / 1000);
                break;
            case 'nvidia':
                temperatureStr = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.temperature.gpu_temp) || '';
                temperatureStr = temperatureStr.slice(0, temperatureStr.length - 2);
                temperature = Number(temperatureStr);
                break;
        }
        return temperature;
    }
    getGPUClocks(gpuId) {
        let clocksArray = [];
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                clocksArray = [];
                let clocksStr = fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/pp_dpm_sclk`, 'utf8');
                let clocks = clocksStr.split(`\n`);
                clocks = clocks.filter((entry) => (entry == '') ? false : true);
                for (let clock of clocks) {
                    let [id, mhz] = clock.split(`: `);
                    let active = (mhz.slice(-1) === `*`);
                    mhz = active
                        ? mhz.substring(0, mhz.length - 2)
                        : mhz.substring(0, mhz.length - 1);
                    clocksArray.push({
                        id,
                        mhz: Number(mhz),
                        active
                    });
                }
                break;
        }
        return clocksArray;
    }
    getMemoryClocks(gpuId) {
        let clocksArray = [];
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                clocksArray = [];
                let clocksStr = fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/pp_dpm_mclk`, 'utf8');
                let clocks = clocksStr.split(`\n`);
                clocks = clocks.filter((entry) => (entry == '') ? false : true);
                for (let clock of clocks) {
                    let [id, mhz] = clock.split(`: `);
                    let active = (mhz.slice(-1) === `*`);
                    mhz = active
                        ? mhz.substring(0, mhz.length - 2)
                        : mhz.substring(0, mhz.length - 1);
                    clocksArray.push({
                        id,
                        mhz: Number(mhz),
                        active,
                    });
                    mhz = mhz.substring(0, mhz.length - 2);
                }
                break;
        }
        return clocksArray;
    }
    getCurrentGPUClockProfile(gpuId) {
        let current_mhz = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                let clocksStr = fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/pp_dpm_sclk`, 'utf8');
                let clocks = clocksStr.split(`\n`);
                clocks = clocks.filter((entry) => (entry == '') ? false : true);
                for (let clock of clocks) {
                    let [id, mhz] = clock.split(`: `);
                    if (mhz.slice(-1) === `*`) {
                        current_mhz = mhz.substring(0, mhz.length - 2);
                    }
                }
                break;
        }
        return Number(current_mhz);
    }
    getCurrentMemoryClockProfile(gpuId) {
        let current_mhz = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                let clocksStr = fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/pp_dpm_mclk`, 'utf8');
                let clocks = clocksStr.split(`\n`);
                clocks = clocks.filter((entry) => (entry == '') ? false : true);
                for (let clock of clocks) {
                    let [id, mhz] = clock.split(`: `);
                    if (mhz.slice(-1) === `*`) {
                        current_mhz = mhz.substring(0, mhz.length - 2);
                    }
                }
                break;
        }
        return Number(current_mhz);
    }
    getCurrentGPUClock(gpuId) {
        var _a;
        let mhzStr = null;
        let mhz = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                mhzStr = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/freq1_input`, `utf8`)).trim();
                mhz = (Number(mhzStr) / 1000 / 1000);
                break;
            case 'nvidia':
                mhzStr = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.clocks.graphics_clock) || '';
                mhzStr = mhzStr.slice(0, mhzStr.length - 4);
                mhz = Number(mhzStr);
                break;
        }
        return mhz;
    }
    getCurrentMemoryClock(gpuId) {
        var _a;
        let mhzStr = null;
        let mhz = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                mhzStr = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/freq2_input`, `utf8`)).trim();
                mhz = (Number(mhzStr) / 1000 / 1000);
                break;
            case 'nvidia':
                mhzStr = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.clocks.mem_clock) || '';
                mhzStr = mhzStr.slice(0, mhzStr.length - 4);
                mhz = Number(mhzStr);
                break;
        }
        return mhz;
    }
    getPowerLimitWatts(gpuId) {
        var _a;
        let wattsStr = null;
        let watts = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                wattsStr = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/power1_cap`, `utf8`)).trim();
                watts = (Number(wattsStr) / 1000 / 1000);
                break;
            case 'nvidia':
                wattsStr = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.power_readings.power_limit) || '';
                wattsStr = wattsStr.slice(0, wattsStr.length - 2);
                watts = Number(wattsStr);
                break;
        }
        return Number(watts);
    }
    getPowerLimitMinWatts(gpuId) {
        var _a;
        let wattsStr = null;
        let watts = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                wattsStr = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/power1_cap_min`, `utf8`)).trim();
                watts = (Number(wattsStr) / 1000 / 1000);
                break;
            case 'nvidia':
                wattsStr = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.power_readings.min_power_limit) || '';
                wattsStr = wattsStr.slice(0, wattsStr.length - 2);
                watts = Number(wattsStr);
                break;
        }
        return Number(watts);
    }
    getPowerLimitMaxWatts(gpuId) {
        var _a;
        let wattsStr = null;
        let watts = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                wattsStr = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/power1_cap_max`, `utf8`)).trim();
                watts = Number(wattsStr) / 1000 / 1000;
                break;
            case 'nvidia':
                wattsStr = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.power_readings.max_power_limit) || '';
                wattsStr = wattsStr.slice(0, wattsStr.length - 2);
                watts = Number(wattsStr);
                break;
        }
        return watts;
    }
    getPowerUsage(gpuId) {
        var _a;
        let usageStr = null;
        let usage = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                usageStr = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/power1_average`, `utf8`)).trim();
                usage = Number(usageStr) / 1000;
                break;
            case 'nvidia':
                usageStr = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.power_readings.power_draw) || '';
                usageStr = usageStr.slice(0, usageStr.length - 2);
                usage = Number(usageStr) * 1000;
                break;
        }
        return usage;
    }
    getVddGfx(gpuId) {
        let vdd = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                vdd = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/in0_input`, `utf8`)).trim();
                break;
        }
        return Number(vdd);
    }
    getFanMode(gpuId) {
        let mode = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                mode = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/pwm1_enable`, `utf8`)).trim();
                switch (mode) {
                    case '1':
                        mode = "manual";
                        break;
                    case '2':
                        mode = "automatic";
                        break;
                }
                break;
        }
        return mode;
    }
    getFanSpeedPWM(gpuId) {
        let pwm = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                pwm = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/pwm1`, `utf8`)).trim();
                break;
        }
        return Number(pwm);
    }
    getFanSpeedPct(gpuId) {
        var _a;
        let pctStr = null;
        let pct = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                pctStr = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/pwm1`, `utf8`)).trim();
                pct = ((Number(pctStr) / 255) * 100);
                break;
            case 'nvidia':
                pctStr = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.fan_speed) || '';
                pctStr = pctStr.slice(0, pctStr.length - 2);
                pct = Number(pctStr);
                break;
        }
        return pct;
    }
    getFanSpeedRPM(gpuId) {
        let rpm = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                rpm = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/fan1_input`, `utf8`)).trim();
                break;
        }
        return Number(rpm);
    }
    getFanSpeedMinRPM(gpuId) {
        let rpm = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                rpm = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/fan1_min`, `utf8`)).trim();
                break;
        }
        return Number(rpm);
    }
    getFanSpeedMaxRPM(gpuId) {
        let rpm = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                rpm = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/fan1_max`, `utf8`)).trim();
                break;
        }
        return Number(rpm);
    }
    getFanSpeedTarget(gpuId) {
        let rpm = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                rpm = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/fan1_target`, `utf8`)).trim();
                break;
        }
        return Number(rpm);
    }
    getFanInfo(gpuId) {
        let fanInfo = {
            percent: null,
            rpm: null,
            rpm_max: null,
            rpm_min: null,
            mode: null,
            target: null,
        };
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                fanInfo.mode = this.getFanMode(gpuId);
                fanInfo.percent = this.getFanSpeedPct(gpuId);
                fanInfo.rpm = this.getFanSpeedRPM(gpuId);
                fanInfo.rpm_min = this.getFanSpeedMinRPM(gpuId);
                fanInfo.rpm_max = this.getFanSpeedMaxRPM(gpuId);
                fanInfo.target = this.getFanSpeedTarget(gpuId);
                break;
            case 'nvidia':
                fanInfo.percent = this.getFanSpeedPct(gpuId);
                break;
        }
        ;
        return fanInfo;
    }
    setGPUFanSpeed(gpuId, speed = 100) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            switch (this.GPUs[gpuId].vendorName) {
                case 'amd':
                    let mode = this.getFanMode(gpuId);
                    if (mode == 'automatic')
                        yield this.setGPUFanMode(gpuId, 'manual');
                    let file = `/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/pwm1`;
                    let pwm = Number((speed / 100) * 255);
                    try {
                        console.log(`[amd] Setting fan speed for GPU${gpuId} ${speed}% (${pwm}/255)`);
                        fs_1.default.writeFileSync(file, pwm.toString());
                    }
                    catch (e) {
                        console.log(`[amd] Error setting fan speed for GPU${gpuId} ${speed}% (${pwm}/255): ${e}`);
                        switch (e.code) {
                            case "EACCES":
                                console.log(`--> Access was denied! root is required for most changing settings`);
                                break;
                            case "ENOENT":
                                console.log(`--> For some reason the sysfs item doesn't exist! [${file}]`);
                                break;
                            default:
                                console.log(`--> Some other error occured trying to write to [${file}]`);
                        }
                    }
                    console.log(`[amd] Fan speed set for GPU${gpuId} ${speed}% (${pwm}/255)`);
                    break;
                case 'nvidia':
                    console.log(`[nvidia] NVIDIA fan control not yet implemented, unable to set GPU${gpuId} to ${speed}%`);
                    break;
                case 'intel':
                    console.log(`[intel] Intel fan control not yet implemented, unable to set GPU${gpuId} to ${speed}%`);
                    break;
            }
        });
    }
    setGPUFanMode(gpuId, mode = "automatic") {
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                let file = `/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/pwm1_enable`;
                switch (mode) {
                    case 'manual':
                        try {
                            fs_1.default.writeFileSync(file, `1`);
                        }
                        catch (e) {
                            console.log(`[amd] Error setting fan mode for GPU${gpuId}: ${e}`);
                            switch (e.code) {
                                case "EACCES":
                                    console.log(`--> Access was denied! root is required for most changing settings`);
                                    break;
                                case "ENOENT":
                                    console.log(`--> For some reason the sysfs item doesn't exist! [${file}]`);
                                    break;
                                default:
                                    console.log(`--> Some other error occured trying to write to [${file}]`);
                                    break;
                            }
                        }
                        console.log(`[amd] Fan mode for GPU${gpuId} changed to: manual`);
                        break;
                    case 'automatic':
                    default:
                        try {
                            fs_1.default.writeFileSync(file, `2`);
                        }
                        catch (e) {
                            console.log(`[amd] Error setting fan mode for GPU${gpuId}: ${e}`);
                            switch (e.code) {
                                case "EACCES":
                                    console.log(`--> Access was denied! root is required for most changing settings`);
                                    break;
                                case "ENOENT":
                                    console.log(`--> For some reason the sysfs item doesn't exist! [${file}]`);
                                    break;
                                default:
                                    console.log(`--> Some other error occured trying to write to [${file}]`);
                                    break;
                            }
                        }
                        console.log(`[amd] Fan mode for GPU${gpuId} changed to: automatic`);
                        break;
                }
                break;
            case 'nvidia':
                console.log(`[nvidia] NVIDIA fan control not yet implemented, unable to set GPU${gpuId} to ${mode}`);
                break;
            case 'intel':
                console.log(`[intel] Intel fan control not yet implemented, unable to set GPU${gpuId} to ${mode}`);
                break;
        }
    }
    resetGPUPower(gpuId) {
        var _a, _b, _c;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            switch (this.GPUs[gpuId].vendorName) {
                case 'amd':
                    {
                        let file = `/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/power1_cap`;
                        const power = this.getPowerLimitWatts(gpuId);
                        try {
                            console.log(`[amd] Resetting power limit for GPU${gpuId} to default`);
                            fs_1.default.writeFileSync(file, '0');
                        }
                        catch (e) {
                            console.log(`[amd] Error setting power limit of ${power} watts for GPU${gpuId}: ${e}`);
                            switch (e.code) {
                                case "EACCES":
                                    console.log(`--> Access was denied! root is required for most changing settings`);
                                    break;
                                case "ENOENT":
                                    console.log(`--> For some reason the sysfs item doesn't exist! [${file}]`);
                                    break;
                                default:
                                    console.log(`--> Some other error occured trying to write to [${file}]`);
                            }
                        }
                        console.log(`[amd] Power limit set to default (${power} watts) for GPU${gpuId}`);
                    }
                    break;
                case 'nvidia':
                    {
                        let fullpcidevice = this.GPUs[gpuId].fullpcidevice;
                        let powerStr = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.power_readings.default_power_limit) || '';
                        powerStr = powerStr.slice(0, powerStr.length - 2);
                        const power = Number(powerStr);
                        if (((_b = this.GPUs[gpuId].nv) === null || _b === void 0 ? void 0 : _b.nvidia_smi_log.gpu.persistence_mode) != "Enabled") {
                            console.log(`[nvidia] persistence_mode will be enabled for setting power on NVIDIA GPUs`);
                            yield execp(`${nvidiaSmiPath} -pm 1 --id=${fullpcidevice}`);
                            yield this.updateNV(gpuId);
                        }
                        yield execp(`${nvidiaSmiPath} -pl ${power} --id=${fullpcidevice}`);
                        console.log(`[nvidia] Power limit set to default (${power} watts) for GPU${gpuId}`);
                        yield this.updateNV(gpuId);
                        if (((_c = this.GPUs[gpuId].nv) === null || _c === void 0 ? void 0 : _c.nvidia_smi_log.gpu.persistence_mode) == "Enabled") {
                            console.log(`[nvidia] persistence_mode will be disabled after setting default power on NVIDIA GPUs`);
                            yield execp(`${nvidiaSmiPath} -pm 0 --id=${fullpcidevice}`);
                        }
                    }
                    break;
                case 'intel':
                    console.log(`[intel] Intel power control not yet implemented, unable to reset GPU${gpuId} power limit`);
                    break;
            }
        });
    }
    setGPUPower(gpuId, power) {
        var _a;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let max = this.getPowerLimitMaxWatts(gpuId);
            let min = this.getPowerLimitMinWatts(gpuId);
            if (process.getuid && process.getuid() != 0) {
                console.log(`root is required to set values`);
                process.exit(1);
            }
            if (max && min && (power > max || power < min)) {
                console.log(`Power limit ${power} is out of possible ranges for GPU${gpuId}: ${min}-${max}`);
                process.exit(1);
            }
            switch (this.GPUs[gpuId].vendorName) {
                case 'amd':
                    if (power == 0) {
                        power = 1;
                    }
                    let file = `/sys/class/drm/card${gpuId}/device/hwmon/${this.GPUs[gpuId].hwmon}/power1_cap`;
                    try {
                        console.log(`[amd] Setting power limit for GPU${gpuId} to ${power} watts`);
                        fs_1.default.writeFileSync(file, (power * 1000 * 1000).toString());
                    }
                    catch (e) {
                        console.log(`[amd] Error setting power limit of ${power} watts for GPU${gpuId}: ${e}`);
                        switch (e.code) {
                            case "EACCES":
                                console.log(`--> Access was denied! root is required for most changing settings`);
                                break;
                            case "ENOENT":
                                console.log(`--> For some reason the sysfs item doesn't exist! [${file}]`);
                                break;
                            default:
                                console.log(`--> Some other error occured trying to write to [${file}]`);
                                break;
                        }
                    }
                    console.log(`[amd] Power limit set to ${power} watts for GPU${gpuId}`);
                    break;
                case 'nvidia':
                    let fullpcidevice = this.GPUs[gpuId].fullpcidevice;
                    if (((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.persistence_mode) != "Enabled") {
                        console.log(`[nvidia] persistence_mode will be enabled for setting power on NVIDIA GPUs`);
                        yield execp(`${nvidiaSmiPath} -pm 1 --id=${fullpcidevice}`);
                    }
                    yield execp(`${nvidiaSmiPath} -pl ${power} --id=${fullpcidevice}`);
                    console.log(`[nvidia] Power limit set to ${power} watts for GPU${gpuId}`);
                    break;
                case 'intel':
                    console.log(`[intel] Intel power control not yet implemented, unable to set GPU${gpuId} to ${power} watts`);
                    break;
            }
        });
    }
    getDriverVersion(gpuId) {
        var _a;
        let ver = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                ver = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/driver/module/version`, `utf8`)).trim();
                // this is returning a not 'well-known' version number, ie: 5.2.0.19.50
                // the 'well-known' version is 19.50; I'm not sure how this will react on
                // other drivers or if we should do it like this or just leave the full 
                // version but I'd rather display the 'well-known' version that people
                // will understand and know and correlate to the actual driver they 
                // installed.
                let [a, b, c, d, e] = ver.split('.');
                ver = `${d}.${e}`;
                break;
            case 'nvidia':
                ver = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.driver_version) || '';
                break;
        }
        return ver;
    }
    getBIOSVersion(gpuId) {
        var _a;
        let ver = null;
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                ver = (fs_1.default.readFileSync(`/sys/class/drm/card${gpuId}/device/vbios_version`, `utf8`)).trim();
                break;
            case 'nvidia':
                ver = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.vbios_version) || '';
                break;
        }
        return ver;
    }
    getGPUStatus(gpuId) {
        //if (! this.GPUs[gpuId]) return;
        var _a;
        this.GPUs[gpuId].IRQ = this.getIRQNumber(gpuId);
        this.GPUs[gpuId].pcilinkspeed = this.getPCILinkSpeed(gpuId);
        this.GPUs[gpuId].pcilinkwidth = this.getPCILinkWidth(gpuId);
        this.GPUs[gpuId].maxpcilinkspeed = this.getPCIMaxLinkSpeed(gpuId);
        this.GPUs[gpuId].maxpcilinkwidth = this.getPCIMaxLinkWidth(gpuId);
        this.GPUs[gpuId].gpu_busy = this.getGPUBusy(gpuId);
        this.GPUs[gpuId].mem_busy = this.getMemBusy(gpuId);
        this.GPUs[gpuId].memUsed = this.getMemUsed(gpuId);
        this.GPUs[gpuId].memTotal = this.getMemTotal(gpuId);
        this.GPUs[gpuId].memFree = (this.GPUs[gpuId].memUsed !== null && this.GPUs[gpuId].memTotal !== null) ?
            (Number(this.GPUs[gpuId].memTotal) - Number(this.GPUs[gpuId].memUsed))
            : null;
        this.GPUs[gpuId].memUsedMB = (this.GPUs[gpuId].memUsed !== null && this.GPUs[gpuId].memTotal !== null) ?
            ((Number(this.GPUs[gpuId].memUsed) / 1000 / 1000).toFixed(1))
            : null;
        this.GPUs[gpuId].memFreeMB = (this.GPUs[gpuId].memUsed !== null && this.GPUs[gpuId].memTotal !== null) ?
            ((Number(this.GPUs[gpuId].memFree) / 1000 / 1000).toFixed(1))
            : null;
        this.GPUs[gpuId].memTotalMB = (this.GPUs[gpuId].memTotal !== null) ?
            ((Number(this.GPUs[gpuId].memTotal) / 1000 / 1000).toFixed(1))
            : null;
        this.GPUs[gpuId].memUsedPercent = (this.GPUs[gpuId].memUsed !== null && this.GPUs[gpuId].memTotal !== null) ?
            (((Number(this.GPUs[gpuId].memUsed) / Number(this.GPUs[gpuId].memTotal)) * 100).toFixed(2))
            : null;
        this.GPUs[gpuId].memFreePercent = (this.GPUs[gpuId].memUsed !== null && this.GPUs[gpuId].memTotal !== null) ?
            ((100 - ((Number(this.GPUs[gpuId].memUsed) / Number(this.GPUs[gpuId].memTotal)) * 100)).toFixed(2))
            : null;
        this.GPUs[gpuId].gpu_temperatureC = this.getGPUCoreTemperature(gpuId);
        this.GPUs[gpuId].gpu_temperatureF = (((9 / 5) * Number(this.GPUs[gpuId].gpu_temperatureC)) + 32);
        this.GPUs[gpuId].gpuClocks = this.getGPUClocks(gpuId);
        this.GPUs[gpuId].memoryClocks = this.getMemoryClocks(gpuId);
        this.GPUs[gpuId].gpu_mhz = this.getCurrentGPUClock(gpuId);
        this.GPUs[gpuId].mem_mhz = this.getCurrentMemoryClock(gpuId);
        this.GPUs[gpuId].gpuProfileMhz = this.getCurrentGPUClockProfile(gpuId);
        this.GPUs[gpuId].memoryProfileMhz = this.getCurrentMemoryClockProfile(gpuId);
        this.GPUs[gpuId].powerLimitWatts = this.getPowerLimitWatts(gpuId);
        this.GPUs[gpuId].powerLimitMinWatts = this.getPowerLimitMinWatts(gpuId);
        this.GPUs[gpuId].powerLimitMaxWatts = this.getPowerLimitMaxWatts(gpuId);
        this.GPUs[gpuId].powerUsage = this.getPowerUsage(gpuId);
        this.GPUs[gpuId].powerUsageWatts = Number(this.GPUs[gpuId].powerUsage) / 1000;
        this.GPUs[gpuId].vddgfx = this.getVddGfx(gpuId);
        this.GPUs[gpuId].fan = this.getFanInfo(gpuId);
        this.GPUs[gpuId].driver_version = this.getDriverVersion(gpuId);
        this.GPUs[gpuId].vbios_version = this.getBIOSVersion(gpuId);
        switch (this.GPUs[gpuId].vendorName) {
            case 'amd':
                this.GPUs[gpuId].gpuClocksPrintable = '';
                for (let [id, clk] of this.GPUs[gpuId].gpuClocks.entries()) {
                    let mhz = clk.mhz;
                    if (clk.active)
                        this.GPUs[gpuId].gpuClocksPrintable += `[`;
                    this.GPUs[gpuId].gpuClocksPrintable += mhz;
                    if (clk.active) {
                        this.GPUs[gpuId].gpuClocksPrintable += `]`;
                        this.GPUs[gpuId].gpuClockProfile = clk.id;
                    }
                    if (id < this.GPUs[gpuId].gpuClocks.length - 1)
                        this.GPUs[gpuId].gpuClocksPrintable += ", ";
                }
                this.GPUs[gpuId].memoryClocksPrintable = '';
                for (let [id, clk] of this.GPUs[gpuId].memoryClocks.entries()) {
                    let mhz = clk.mhz;
                    if (clk.active)
                        this.GPUs[gpuId].memoryClocksPrintable += `[`;
                    this.GPUs[gpuId].memoryClocksPrintable += mhz;
                    if (clk.active) {
                        this.GPUs[gpuId].memoryClocksPrintable += `]`;
                        this.GPUs[gpuId].memoryClockProfile = clk.id;
                    }
                    if (id < this.GPUs[gpuId].memoryClocks.length - 1)
                        this.GPUs[gpuId].memoryClocksPrintable += ", ";
                }
                break;
            case 'nvidia':
                this.GPUs[gpuId].deviceName = ((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.product_name) || '';
                break;
        }
    }
    showUsage() {
        const usageTemplate = 
        ///////////////////////////////////////////////////////////////////////////////
        // Usage CLI Template                                                        //
        ///////////////////////////////////////////////////////////////////////////////
        `
${$me} shows statistics and manipulates power limit settings for GPUs on
Linux through various interfaces provided by manufacturer's drivers, for
example, using the sysfs interface to interact with the amdgpu driver.

The original script (amdpwrman) was designed to be simple, easy to use and have
no dependencies, however, BASH scripting is kind of a pain so I decided to
rewrite this as a NodeJS app with an included (optional to use) web interface.

There will be an easy to use binary distribution of this, or you can just clone
the repo and run or build the script yourself.
Most commands will execute the command and exit. For example, using
'./gpumgr fan 50% 0' to set fan speed to 50% for GPU 0, gpumgr will simply set
it once and exit.

Usage:
  ${$me} [command] <gpu> <options>

  If <gpu> is omitted from any command, GPU0 is assumed.
    <gpu> can be a comma separated list of GPU numbers.
    <gpu> can be set to 'all' to affect ALL GPUs
    <gpu> can be set to 'amd' to affect all AMD GPUs
    <gpu> can be set to 'nvidia' to affect all Nvidia GPUs
    <gpu> can be set to 'intel' to affect all Intel GPUs

  Commands with no options or only GPU specified:
	help | --help | -h       	Display this help message.
	list <gpu>               	List available GPUs and their GPU#.
	show <gpu>               	Show detailed statistics for <gpu>.
	status <gpu>             	Same as above.

	power <percent> <gpu>    	Set <gpu>'s power target to <percent>.
	power reset <gpu>        	Reset default power limit for <gpu>.
	recover <gpu>            	Attempt driver recovery mechanism for <gpu>.
	fan enable <gpu>         	Enable manual fan control for <gpu>.
	fan disable <gpu>        	Disable manual fan control for <gpu>.
	fan [percent] <gpu>      	Set <gpu>'s fan speed to <percent>.

	Options for Commands with Options:

Examples:
  ${$me} show nvidia               	Show status of all Nvidia GPUs
  ${$me} list Intel              	List all Intel GPU#s
  sudo ${$me} fan enable 0       	Enable manual fan control for GPU0
  sudo ${$me} fan disable all    	Enable auto fan control for all GPUs
  sudo ${$me} fan 100% 0         	Set GPU0 fan speed to 100%
`;
        ///////////////////////////////////////////////////////////////////////////////
        console.log(usageTemplate);
    }
    displayGpusList(gpuId) {
        var _a;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let productName = null;
            let vendorColored = '';
            let teamColor = '';
            let teamColorName = '';
            this.getGPUStatus(gpuId);
            switch (this.GPUs[gpuId].vendorName) {
                case 'amd':
                    vendorColored = `AMD`;
                    teamColor = ``;
                    teamColorName = 'Red';
                    break;
                case 'nvidia':
                    vendorColored = `NVIDIA`;
                    teamColor = ``;
                    teamColorName = 'Green';
                    productName = `${(_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.product_name}` || '';
                    break;
                case 'intel':
                    vendorColored = `Intel`;
                    teamColor = ``;
                    teamColorName = 'Blue?';
                    break;
                default:
            }
            const listTemplate = 
            ///////////////////////////////////////////////////////////////////////////////
            // List GPUs CLI Template                                                    //
            ///////////////////////////////////////////////////////////////////////////////		 
            `GPU${gpuId}: Vendor: ${vendorColored} ${teamColor}${productName} (${this.GPUs[gpuId].vendorid}:${this.GPUs[gpuId].deviceid} @ ${this.GPUs[gpuId].pcidevice})`;
            ///////////////////////////////////////////////////////////////////////////////	
            console.log(listTemplate);
        });
    }
    displayGpuStatus(gpuId) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let pre = '', post = ``, vendorColored = '', teamColor = '', teamColorName = '', tempColor = '';
            console.log(`Showing status for GPU${gpuId}`);
            this.getGPUStatus(gpuId);
            switch (this.GPUs[gpuId].vendorName) {
                case 'amd':
                    vendorColored = `AMD`;
                    teamColor = ``;
                    teamColorName = 'Red';
                    pre = `GPU${gpuId}: amdgpu-${this.GPUs[gpuId].driver_version}`;
                    break;
                case 'nvidia':
                    vendorColored = `NVIDIA`;
                    teamColor = ``;
                    teamColorName = 'Green';
                    pre = `GPU${gpuId}: ${((_a = this.GPUs[gpuId].nv) === null || _a === void 0 ? void 0 : _a.nvidia_smi_log.gpu.product_name) || ''}`;
                    post = `GPU${gpuId}: WARNING: not all values are supported for ${vendorColored} yet!\n`;
                    break;
                case 'intel':
                    vendorColored = `Intel`;
                    teamColor = ``;
                    teamColorName = 'Blue?';
                    pre = `GPU${gpuId}: WARNING: No ${vendorColored} Support Yet!`;
                    post = `${pre}\n`;
                    break;
                default:
                    pre = `GPU${gpuId}: WARNING: Unknown GPU Type!!`;
                    post = `${pre}\n`;
            }
            const statusTemplate = 
            ///////////////////////////////////////////////////////////////////////////////
            // Status CLI Template                                                       //
            ///////////////////////////////////////////////////////////////////////////////
            `
${pre}
GPU${gpuId}: ${teamColor}(Team ${teamColorName}) ${vendorColored}${teamColor} Driver Version: ${this.GPUs[gpuId].driver_version}
GPU${gpuId}: VBIOS Version: ${this.GPUs[gpuId].vbios_version}
GPU${gpuId}: PCIe Device Bus Address: ${this.GPUs[gpuId].pcidevice} @ IRQ ${this.GPUs[gpuId].IRQ}
GPU${gpuId}: Link Speed is ${this.GPUs[gpuId].pcilinkwidth}x [${this.GPUs[gpuId].pcilinkspeed}] (Maximum is ${this.GPUs[gpuId].maxpcilinkwidth}x [${this.GPUs[gpuId].maxpcilinkspeed}])
GPU${gpuId}: Vendor ID: ${teamColor}0x${this.GPUs[gpuId].vendorid} / ${vendorColored} 
GPU${gpuId}: Device ID: ${teamColor}0x${this.GPUs[gpuId].deviceid} / ${this.GPUs[gpuId].deviceName}
GPU${gpuId}: Sub-Vendor ID: ${teamColor}0x${this.GPUs[gpuId].subvendorid} / ${this.GPUs[gpuId].subvendorname}
GPU${gpuId}: Sub-Device ID: ${teamColor}0x${this.GPUs[gpuId].subdeviceid} / ${this.GPUs[gpuId].subdevicename}
GPU${gpuId}: Current GPU Usage is ${this.GPUs[gpuId].gpu_busy}%
GPU${gpuId}: Current VRAM Activity is ${this.GPUs[gpuId].mem_busy}%
GPU${gpuId}: VRAM Total: ${this.GPUs[gpuId].memTotalMB} MiB (${this.GPUs[gpuId].memTotal} bytes)
GPU${gpuId}: VRAM Used: ${this.GPUs[gpuId].memUsedPercent}% / ${this.GPUs[gpuId].memUsedMB} MiB (${this.GPUs[gpuId].memUsed} bytes)
GPU${gpuId}: VRAM Free: ${this.GPUs[gpuId].memFreePercent}% / ${this.GPUs[gpuId].memFreeMB} MiB (${this.GPUs[gpuId].memFree} bytes)
GPU${gpuId}: Temperature is ${tempColor}${this.GPUs[gpuId].gpu_temperatureC}°C (${this.GPUs[gpuId].gpu_temperatureF}°F)
GPU${gpuId}: Current GPU core speed is ${this.GPUs[gpuId].gpu_mhz} mHz
GPU${gpuId}: Current memory speed is ${this.GPUs[gpuId].mem_mhz} mHz
GPU${gpuId}: Available GPU clocks ${this.GPUs[gpuId].gpuClocksPrintable}
GPU${gpuId}: Available Memory clocks ${this.GPUs[gpuId].memoryClocksPrintable}
GPU${gpuId}: Current GPU Profile: ${this.GPUs[gpuId].gpuClockProfile} @ ${this.GPUs[gpuId].gpuProfileMhz} mHz (${this.GPUs[gpuId].gpu_mhz} mHz actual)
GPU${gpuId}: Current Memory Profile: ${this.GPUs[gpuId].memoryClockProfile} @ ${this.GPUs[gpuId].memoryProfileMhz} mHz (${this.GPUs[gpuId].mem_mhz} mHz actual)
GPU${gpuId}: Power limit is ${this.GPUs[gpuId].powerLimitWatts} watts (Min: ${this.GPUs[gpuId].powerLimitMinWatts} watts - Max: ${this.GPUs[gpuId].powerLimitMaxWatts} watts)
GPU${gpuId}: Power usage is ${this.GPUs[gpuId].powerUsageWatts} watts (${this.GPUs[gpuId].powerUsage} mW)
GPU${gpuId}: Voltage is currently ${this.GPUs[gpuId].vddgfx} mV (${Number(this.GPUs[gpuId].vddgfx) / 1000} V)
GPU${gpuId}: Fan speed for is ${(_b = this.GPUs[gpuId].fan) === null || _b === void 0 ? void 0 : _b.percent}% (${(_c = this.GPUs[gpuId].fan) === null || _c === void 0 ? void 0 : _c.rpm} RPM, Min: ${(_d = this.GPUs[gpuId].fan) === null || _d === void 0 ? void 0 : _d.rpm_min} RPM - Max: ${(_e = this.GPUs[gpuId].fan) === null || _e === void 0 ? void 0 : _e.rpm_max} RPM)
GPU${gpuId}: Fan control is set to ${(_f = this.GPUs[gpuId].fan) === null || _f === void 0 ? void 0 : _f.mode} ${(((_g = this.GPUs[gpuId].fan) === null || _g === void 0 ? void 0 : _g.mode) == 'automatic') ? "(target: " + ((_h = this.GPUs[gpuId].fan) === null || _h === void 0 ? void 0 : _h.target) + " RPM)" : ''}
${post}`;
            ///////////////////////////////////////////////////////////////////////////////
            console.log(statusTemplate);
            console.log(this.GPUs[gpuId]);
        });
    }
}
let gpumgr = new gpuManager();
gpumgr.handleArguments();
