
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';

import type *  as t from '../../common/types';


/* ########## MAIN ######### */

const SEP = path.sep;


/* ########## FUNCTIONS ######### */


export const fullnodeInstall: t.fullnodeInstallInfos = {
    version: '',
    github: '',

    async install(config, params) {
        // EXTENDS ME
    },

    async getLastVersion(): Promise<string> {
        if (! this.github) return '';

        const url = `https://api.github.com/repos/${this.github}/releases/latest`;
        const response = await fetch(url);
        const releaseInfos: any = await response.json();

        let version = releaseInfos.tag_name;
        if (version.startsWith('v')) {
            version = version.slice(1);
        }

        return version;
    },

    async getAllVersions(): Promise<string[]> {
        if (! this.github) return [];

        const url = `https://api.github.com/repos/${this.github}/releases`;
        const response = await fetch(url);
        const releaseVersions: any = await response.json();

        return releaseVersions.map((release: any) => {
            let version = release.tag_name as string;
            if (version.startsWith('v')) {
                version = version.slice(1);
            }

            return version;
        });
    }
};


export const fullnodeCommands: t.fullnodeCommandInfos = {
    p2pPort: -1,
    rpcPort: -1,
    command: '', // the filename of the executable (without .exe extension)


    getCommandFile(config, params) {
        return this.command + (os.platform() === 'linux' ? '' : '.exe');
    },


    getCommandArgs(config, params) {
        // EXTENDS ME
        return [];
    },


    async getInfos(config, params) {
        // EXTENDS ME

        const fullnodeName = 'edit-me';
        const coin = 'edit-me';
        const blocks = -1; // edit-me
        const blockHeaders = -1; // edit-me

        let infos: t.FullnodeInfos = {
            fullnode: {
                name: fullnodeName,
                coin,
            },
            blockchain: {
                blocks,
                headers: blockHeaders,
            },
        };

        return infos;
    }
};


