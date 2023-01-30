
import * as fullnodesConfigs from './fullnodes';

import type * as t from '../common/types';



/* ########## FUNCTIONS ######### */

export const fullnodesInstalls: t.MapString<t.fullnodeInstallInfos> = Object.fromEntries(
    Object.entries(fullnodesConfigs).map(entry => {
        const [fullnodeName, fullnodeConfig] = entry;
        return [fullnodeName, fullnodeConfig.fullnodeInstall];
    })
);

export const fullnodesCommands: t.MapString<t.fullnodeCommandInfos> = Object.fromEntries(
    Object.entries(fullnodesConfigs).map(entry => {
        const [fullnodeName, fullnodeConfig] = entry;
        return [fullnodeName, fullnodeConfig.fullnodeCommands];
    })
);


