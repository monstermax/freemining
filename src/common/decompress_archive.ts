
import fs from 'fs';
//import os from 'os';
import path from 'path';

import tar from 'tar';
import admZip from 'adm-zip';
import sevenBin from '7zip-bin';
import { extractFull } from 'node-7z';
import decompress from 'decompress';
const decompressTarxz = require('decompress-tarxz');


export async function decompressFile(filePath: string, targetDir: string): Promise<void> {
    const ext = path.extname(filePath);

    if (ext === '.xz') {
        return decompressTarXz(filePath, targetDir);

    } else if (ext === '.7z') {
        return decompress7z(filePath, targetDir);

    } else if (ext === '.gz' || ext === '.tgz') {
        return decompressTarGz(filePath, targetDir);

    } else if (ext === '.zip') {
        return decompressZip(filePath, targetDir);
    }

    throw { message: `cannot decompress file ${filePath}` };
}


export async function decompressTarGz(filePath: string, targetDir: string) {
    await tar.extract(
        {
            file: filePath,
            cwd: targetDir,
        }
    ).catch((err: any) => {
        throw { message: err.message };
    });
}


export async function decompressTarXz(filePath: string, targetDir: string) {
    await decompress(filePath, targetDir, {
        plugins: [
            decompressTarxz()
        ]
    });
}


export async function decompressZip(filePath: string, targetDir: string) {
    const zipFile = new admZip(filePath);

    await new Promise((resolve, reject) => {
        zipFile.extractAllToAsync(targetDir, true, true, (err: any) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(null);
        });
    }).catch((err:any) => {
        throw { message: err.message };
    });
}


export async function decompress7z(filePath: string, targetDir: string) {
    const pathTo7zip = sevenBin.path7za; // `${__dirname}/../../node_modules/7zip-bin/linux/x64/7za`
    const binStats = fs.statSync(pathTo7zip);
    const isExecutable = Boolean(binStats.mode & 1 || (binStats.mode & 8) && process.getgid && binStats.gid === process.getgid());

    if (! isExecutable) {
        fs.chmodSync(pathTo7zip, 0o755);
    }

    const seven = extractFull(filePath, targetDir, {
        $bin: pathTo7zip
    });

    await new Promise((resolve, reject) => {
        seven.on('end', function () {
            resolve(true);
        })
    });
}


