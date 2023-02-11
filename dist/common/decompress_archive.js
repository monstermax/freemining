"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decompress7z = exports.decompressZip = exports.decompressTarXz = exports.decompressTarGz = exports.decompressFile = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
//import os from 'os';
const path_1 = tslib_1.__importDefault(require("path"));
const tar_1 = tslib_1.__importDefault(require("tar"));
const adm_zip_1 = tslib_1.__importDefault(require("adm-zip"));
const _7zip_bin_1 = tslib_1.__importDefault(require("7zip-bin"));
const node_7z_1 = require("node-7z");
const decompress_1 = tslib_1.__importDefault(require("decompress"));
const decompressTarxz = require('decompress-tarxz');
function decompressFile(filePath, targetDir) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const ext = path_1.default.extname(filePath);
        if (ext === '.xz') {
            return decompressTarXz(filePath, targetDir);
        }
        else if (ext === '.7z') {
            return decompress7z(filePath, targetDir);
        }
        else if (ext === '.gz' || ext === '.tgz') {
            return decompressTarGz(filePath, targetDir);
        }
        else if (ext === '.zip') {
            return decompressZip(filePath, targetDir);
        }
        throw { message: `cannot decompress file ${filePath}` };
    });
}
exports.decompressFile = decompressFile;
function decompressTarGz(filePath, targetDir) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield tar_1.default.extract({
            file: filePath,
            cwd: targetDir,
        }).catch((err) => {
            throw { message: err.message };
        });
    });
}
exports.decompressTarGz = decompressTarGz;
function decompressTarXz(filePath, targetDir) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield (0, decompress_1.default)(filePath, targetDir, {
            plugins: [
                decompressTarxz()
            ]
        });
    });
}
exports.decompressTarXz = decompressTarXz;
function decompressZip(filePath, targetDir) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const zipFile = new adm_zip_1.default(filePath);
        yield new Promise((resolve, reject) => {
            zipFile.extractAllToAsync(targetDir, true, true, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(null);
            });
        }).catch((err) => {
            throw { message: err.message };
        });
    });
}
exports.decompressZip = decompressZip;
function decompress7z(filePath, targetDir) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const pathTo7zip = _7zip_bin_1.default.path7za; // `${__dirname}/../../node_modules/7zip-bin/linux/x64/7za`
        const binStats = fs_1.default.statSync(pathTo7zip);
        const isExecutable = Boolean(binStats.mode & 1 || (binStats.mode & 8) && process.getgid && binStats.gid === process.getgid());
        if (!isExecutable) {
            fs_1.default.chmodSync(pathTo7zip, 0o755);
        }
        const seven = (0, node_7z_1.extractFull)(filePath, targetDir, {
            $bin: pathTo7zip
        });
        yield new Promise((resolve, reject) => {
            seven.on('end', function () {
                resolve(true);
            });
        });
    });
}
exports.decompress7z = decompress7z;
