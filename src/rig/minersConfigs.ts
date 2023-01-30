
import * as minersConfigs from './miners';

import type * as t from '../common/types';



/* ########## FUNCTIONS ######### */

export const minersInstalls: t.MapString<t.minerInstallInfos> = Object.fromEntries(
    Object.entries(minersConfigs).map(entry => {
        const [minerName, minerConfig] = entry;
        return [minerName, minerConfig.minerInstall];
    })
);

export const minersCommands: t.MapString<t.minerCommandInfos> = Object.fromEntries(
    Object.entries(minersConfigs).map(entry => {
        const [minerName, minerConfig] = entry;
        return [minerName, minerConfig.minerCommands];
    })
);


