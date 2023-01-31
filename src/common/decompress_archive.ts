
import fs from 'fs';
import path from 'path';
import os from 'os';

import tar from 'tar';
import admZip from 'adm-zip';
import sevenBin from '7zip-bin';
import { extractFull } from 'node-7z';
import decompress from 'decompress';
const decompressTarxz = require('decompress-tarxz');


export async function decompressFile(filePath: string, targetDir: string) {

    if (path.extname(filePath) === '.xz') {
        return decompressTarXz(filePath, targetDir);

    } else if (path.extname(filePath) === '.7z') {
        return decompress7z(filePath, targetDir);

    } else if (path.extname(filePath) === '.gz') {
        return decompressTarGz(filePath, targetDir);

    } else if (path.extname(filePath) === '.zip') {
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
    const pathTo7zip = sevenBin.path7za
    const seven = extractFull(filePath, targetDir, {
        $bin: pathTo7zip
    });
}


