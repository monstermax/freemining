
const isFarm = (window.location.pathname.startsWith('/farm/'));
const urlPrefix = isFarm ? window.location.pathname.split('/').slice(0, 4).join('/') : '/rig';


// MINER RUN START-MODAL
async function startMinerModal(minerName='', minerAlias='', onStart=null, onSuccess=null, onFail=null) {
    // /miners/miner-run-modal

    let startMinerModalObj;

    if (! window.startMinerModalObj) {
        const modalContent = await jQuery.get(urlPrefix + '/miners-run-modal?miner=' + minerName);
        const $modalContainer = jQuery('<div id="modalMinerRun"></div>')
        $modalContainer.append(modalContent);
        jQuery(document.body).append($modalContainer);

        if (minerName) {
            jQuery('#newMiner_miner').val(minerName);

            if (minerAlias) {
                jQuery('#newMiner_alias').val(minerAlias);
            }
        }

        const options = {};
        const modal = document.getElementById('startMinerModal');
        startMinerModalObj = new bootstrap.Modal(modal, options);
        window.startMinerModalObj = startMinerModalObj;
    }

    window.onStartMinerModalStart = onStart;
    window.onStartMinerModalSuccess = onSuccess;
    window.onStartMinerModalFail = onFail;

    window.startMinerModalObj.show();
}


function resetStartMinerModalForm() {
    //jQuery('#newMiner_preset').val('');
    jQuery('#newMiner_coin').val('');
    jQuery('#newMiner_miner').val('');
    jQuery('#newMiner_alias').val('');
    jQuery('#newMiner_algo').val('');
    jQuery('#newMiner_pool_url').val('');
    jQuery('#newMiner_pool_user').val('');
    jQuery('#newMiner_extraArgs').val('');
}


/*
function loadStartMinerConfig(selectedPreset) {
    const $presetsContainer = jQuery('#startMinerPresets');
    const presetsContent = $presetsContainer.html();
    const presets = JSON.parse(presetsContent);

    const parts = selectedPreset.split('.');
    if (parts.length != 2) {
        jQuery('#newMiner_coin').val('');
        jQuery('#newMiner_miner').val('');
        jQuery('#newMiner_alias').val('');
        jQuery('#newMiner_algo').val('');
        jQuery('#newMiner_pool_url').val('');
        jQuery('#newMiner_pool_user').val('');
        jQuery('#newMiner_extraArgs').val('');
        return;
    }
    const [part1, part2] = parts;

    const config = presets[part1][part2];

    jQuery('#newMiner_coin').val(config.miner || '');
    jQuery('#newMiner_miner').val(config.miner || '');
    jQuery('#newMiner_alias').val(config.alias || '');
    jQuery('#newMiner_algo').val(config.algo || '');
    jQuery('#newMiner_pool_url').val(config.poolUrl || '');
    jQuery('#newMiner_pool_user').val(config.poolUser || '');
    jQuery('#newMiner_extraArgs').val(config.extraArgs || '');
}
*/


function startMinerFromModal(modalOnStart=null, modalOnSuccess=null, modalOnFail=null) {
    const $form = jQuery('#startMinerForm');
    const $btn = jQuery('#startMinerBtnStart');

    $form.data('hasSubmited', true);
    if (! checkStartMinerForm()) return;

    // submit form
    //document.getElementById('action').value = 'start';
    //document.getElementById('startMinerForm').submit();

    const coin = jQuery('#newMiner_coin').val();
    const minerName = jQuery('#newMiner_miner').val();
    const minerAlias = jQuery('#newMiner_alias').val();
    const algo = jQuery('#newMiner_algo').val();
    const poolUrl = jQuery('#newMiner_pool_url').val();
    const poolUser = jQuery('#newMiner_pool_user').val();
    const extraArgs = jQuery('#newMiner_extraArgs').val();

    const onStart = (minerName, minerAlias) => {
        $btn.prop('disabled', true);
        $btn.addClass('disabled');
        $btn.html('Starting...');

        if (typeof modalOnStart === 'function') {
            modalOnStart(minerName, minerAlias);
        }
    };

    const onSuccess = (minerName, minerAlias, response) => {
        resetStartMinerModalForm();
        $form.data('hasSubmited', false);
        $btn.html('Start !');
        $btn.prop('disabled', false);
        $btn.removeClass('disabled');
        startMinerModalObj.hide();

        // delete startMinerModalObj to reload the running miners list
        jQuery('#startMinerModal').remove();

        if (typeof modalOnSuccess === 'function') {
            modalOnSuccess(minerName, minerAlias, response);
        }
    };
    const onFail = (minerName, minerAlias, err) => {
        const $btn = jQuery('#startMinerBtnStart');
        $btn.html('Start !');
        $btn.prop('disabled', false);
        $btn.removeClass('disabled');

        if (typeof modalOnFail === 'function') {
            modalOnFail(minerName, minerAlias, response);
        }
    };
    startMinerAjax(minerName, minerAlias, coin, algo, poolUrl, poolUser, extraArgs, onStart, onSuccess, onFail);
}


function checkStartMinerForm() {
    const $form = jQuery('#startMinerForm');

    // check form errors
    const allFields = Array.from(document.getElementsByClassName('required'));
    const requiredFields = Array.from(document.getElementsByClassName('required'));

    allFields.forEach(field => {
        if (! $form.data('hasSubmited')) return;
        field.style.borderColor = '';
    });

    const errorFields = requiredFields.filter(field => ! field.value);
    if (errorFields.length) {
        errorFields.forEach(field => {
            if (! $form.data('hasSubmited')) return;
            field.style.borderColor = '#f1aeb5';
        });
        return false;
    }
    return true;
}


// MINER RUN START
function startMinerAjax(minerName, minerAlias='', coin='', algo='', poolUrl='', poolUser='', extraArgs='', onStart=null, onSuccess=null, onFail=null) {
    if (! coin) {
        //console.warn(`Error: Missing {coin} parameter`);
        //return;
    }
    if (! minerName) {
        console.warn(`Error: Missing {miner} parameter`);
        return;
    }
    if (! algo) {
        console.warn(`Error: Missing {algo} parameter`);
        return;
    }
    if (! poolUrl) {
        console.warn(`Error: Missing {poolUrl} parameter`);
        return;
    }
    if (! poolUser) {
        console.warn(`Error: Missing {poolUser} parameter`);
        return;
    }

    //const minerFullName = `${minerName}-${minerAlias}`;
    const minerFullTitle = (minerName === minerAlias || ! minerAlias) ? minerName : `${minerName} (${minerAlias}))`;

    const url = `/miners/${minerName}/run`;
    const data = {
        action: 'start',
        miner: minerName,
        coin,
        algo,
        poolUrl,
        poolUser,
        extraArgs,
    };

    if (typeof onStart === 'function') {
        onStart(minerName, minerAlias);
    }

    jQuery.post(urlPrefix + url, data).then((response) => {
        if (response.startsWith('OK:')) {
            if (typeof onSuccess === 'function') {
                onSuccess(minerName, minerAlias, response);
            }
            alertify.success(`Miner ${minerFullTitle} started`);

        } else {
            if (typeof onFail === 'function') {
                onFail(minerName, minerAlias, { message: response });
            }
            alertify.error(`Miner ${minerFullTitle} cannot be started. ${response}`);
        }

    }, (err) => {
        if (typeof onFail === 'function') {
            onFail(minerName, minerAlias, err);
        }
        alertify.error(`Miner ${minerFullTitle} cannot be started. ${err.message}`);
    });
}


// MINER RUN STOP
function stopMinerAjax(minerName, minerAlias='', instanceName='', onStart=null, onSuccess=null, onFail=null) {
    if (! minerName) {
        console.warn(`Error: Missing {miner} parameter`);
        return;
    }

    instanceName = instanceName || `${minerName}-${minerAlias}`;


    alertify.confirm("<b>Miner stopping - confirmation</b>", `Do you want to stop the miner '<b>${instanceName}</b>' ?`,
        function(){
            alertify.success(`Stopping miner ${instanceName}...`);

            if (typeof onStart === 'function') {
                onStart(minerName, minerAlias, instanceName);
            }

            const url = `/miners/${minerName}/run`;
            const data = {
                action: 'stop',
                miner: minerName,
                alias: minerAlias,
                instanceName,
            };
            jQuery.post(urlPrefix + url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(minerName, minerAlias, instanceName, response);
                    }
                    alertify.success(`Miner ${instanceName} stopped<hr />`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(minerName, minerAlias, instanceName, { message: response });
                    }
                    alertify.error(`Miner ${instanceName} cannot be stopped. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(minerName, minerAlias, instanceName, err);
                }
                alertify.error(`Miner ${instanceName} cannot be stopped. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );

}


// MINER INSTALL START
function startMinerInstallAjax(minerName, minerAlias='', onStart=null, onSuccess=null, onFail=null) {
    if (! minerName) {
        console.warn(`Error: Missing {miner} parameter`);
        return;
    }

    //const minerFullName = `${minerName}-${minerAlias}`;
    const minerFullTitle = (minerName === minerAlias || ! minerAlias) ? minerName : `${minerName} (${minerAlias})`;

    alertify.confirm("<b>Miner installation - confirmation</b>", `Do you want to install the miner '<b>${minerFullTitle}</b>' ?`,
        function(){
            alertify.success(`Starting miner ${minerFullTitle} installation...`);

            if (typeof onStart === 'function') {
                onStart(minerName, minerAlias);
            }

            const url = `/miners/${minerName}/install`;
            const data = {
                action: 'start',
                miner: minerName,
            };

            jQuery.post(urlPrefix + url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(minerName, minerAlias, response);
                    }
                    alertify.success(`Miner ${minerFullTitle} installation started`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(minerName, minerAlias, { message: response });
                    }
                    alertify.error(`Miner ${minerFullTitle} installation cannot be started. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(minerName, minerAlias, err);
                }
                alertify.error(`Miner ${minerFullTitle} installation cannot be started. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}


// MINER INSTALL STOP
function stopMinerInstallAjax(minerName, minerAlias='', onStart=null, onSuccess=null, onFail=null) {
    if (! minerName) {
        console.warn(`Error: Missing {miner} parameter`);
        return;
    }

    //const minerFullName = `${minerName}-${minerAlias}`;
    const minerFullTitle = (minerName === minerAlias || ! minerAlias) ? minerName : `${minerName} (${minerAlias}))`;

    alertify.confirm("<b>Miner installation stopping - confirmation</b>", `Do you want to stop the installation of the miner '<b>${minerFullTitle}</b>' ?`,
        function(){
            alertify.success(`Stopping miner ${minerFullTitle} installation...`);

            if (typeof onStart === 'function') {
                onStart(minerName, minerAlias);
            }

            const url = `/miners/${minerName}/install`;
            const data = {
                action: 'stop',
                miner: minerName,
            };
            jQuery.post(urlPrefix + url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(minerName, minerAlias, response);
                    }
                    alertify.success(`Miner ${minerFullTitle} installation stopped<hr />`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(minerName, minerAlias, { message: response });
                    }
                    alertify.error(`Miner ${minerFullTitle} installation cannot be stopped. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(minerName, minerAlias, err);
                }
                alertify.error(`Miner ${minerFullTitle} installation cannot be stopped. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}


// MINER UNINSTALL START
function startMinerUninstallAjax(minerName, minerAlias='', onStart=null, onSuccess=null, onFail=null) {
    if (! minerName) {
        console.warn(`Error: Missing {miner} parameter`);
        return;
    }

    //const minerFullName = `${minerName}-${minerAlias}`;
    const minerFullTitle = (minerName === minerAlias || ! minerAlias) ? minerName : `${minerName} (${minerAlias}))`;

    alertify.confirm("<b>Miner uninstallation - confirmation</b>", `Do you want to uninstall the miner '<b>${minerFullTitle}</b>' ?`,
        function(){
            alertify.success(`Starting miner ${minerFullTitle} uninstallation...`);

            if (typeof onStart === 'function') {
                onStart(minerName, minerAlias);
            }

            const url = `/miners/${minerName}/uninstall`;
            const data = {
                action: 'start',
                miner: minerName,
            };

            jQuery.post(urlPrefix + url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(minerName, minerAlias, response);
                    }
                    alertify.success(`Miner ${minerFullTitle} uninstallation started`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(minerName, minerAlias, { message: response });
                    }
                    alertify.error(`Miner ${minerFullTitle} uninstallation cannot be started. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(minerName, minerAlias, err);
                }
                alertify.error(`Miner ${minerFullTitle} uninstallation cannot be started. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}


// MINER UNINSTALL STOP
function stopMinerUninstallAjax(minerName, minerAlias='', onStart=null, onSuccess=null, onFail=null) {
    if (! minerName) {
        console.warn(`Error: Missing {miner} parameter`);
        return;
    }

    //const minerFullName = `${minerName}-${minerAlias}`;
    const minerFullTitle = (minerName === minerAlias || ! minerAlias) ? minerName : `${minerName} (${minerAlias}))`;

    alertify.confirm("<b>Miner uninstallation stopping - confirmation</b>", `Do you want to stop the uninstallation of the miner '<b>${minerFullTitle}</b>' ?`,
        function(){
            alertify.success(`Stopping miner ${minerFullTitle} uninstallation...`);

            if (typeof onStart === 'function') {
                onStart(minerName, minerAlias);
            }

            const url = `/miners/${minerName}/uninstall`;
            const data = {
                action: 'stop',
                miner: minerName,
            };
            jQuery.post(urlPrefix + url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(minerName, minerAlias, response);
                    }
                    alertify.success(`Miner ${minerFullTitle} uninstallation stopped<hr />`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(minerName, minerAlias, { message: response });
                    }
                    alertify.error(`Miner ${minerFullTitle} uninstallation cannot be stopped. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(minerName, minerAlias, err);
                }
                alertify.error(`Miner ${minerFullTitle} uninstallation cannot be stopped. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}


function startRigMonitorAjax(onStart=null, onSuccess=null, onFail=null) {
    alertify.confirm("<b>Monitor run - confirmation</b>", `Do you want to start rig monitor' ?`,
        function(){
            alertify.success(`Starting rig monitor...`);

            if (typeof onStart === 'function') {
                onStart();
            }

            const url = `/monitor-run`;
            const data = {
                action: 'start',
            };

            jQuery.post(urlPrefix + url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(response);
                    }
                    alertify.success(`Rig monitor started`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail({ message: response });
                    }
                    alertify.error(`Rig monitor cannot be started. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(err);
                }
                alertify.error(`Rig monitor cannot be started. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}


function stopRigMonitorAjax(onStart=null, onSuccess=null, onFail=null) {
    alertify.confirm("<b>Monitor run - confirmation</b>", `Do you want to stop rig monitor' ?`,
        function(){
            alertify.success(`Stopping rig monitor...`);

            if (typeof onStart === 'function') {
                onStart();
            }

            const url = `/monitor-run`;
            const data = {
                action: 'stop',
            };

            jQuery.post(urlPrefix + url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(response);
                    }
                    alertify.success(`Rig monitor stopped`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail({ message: response });
                    }
                    alertify.error(`Rig monitor cannot be stopped. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(err);
                }
                alertify.error(`Rig monitor cannot be stopped. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}






function modalStartMinerChangeCoin() {
    const $coins = jQuery('#newMiner_coin');
    const $wallets = jQuery('#newMiner_wallet');
    const $pools = jQuery('#newMiner_pool');
    const $miners = jQuery('#newMiner_miner');
    const $extraArgs = jQuery('#newMiner_extraArgs');

    const coin = $coins.val();

    $wallets[0].length = 1;
    $pools.html('<option value=""></option>');

    if (! coin) {
        // no coin selected

        //$miners.children().attr('disabled', true); // disable all miners
        $miners.children().attr('disabled', false).removeClass('d-none'); // re-enable all miners

    } else {
        // coin selected


        const coinWallets = coinsWallets[coin] || {};
        const walletsHtml = Object.entries(coinWallets).map(entry => {
            const [walletName, walletAddress] = entry;
            return `<option value="${walletAddress}">${walletName} : ${walletAddress}</option>`;
        }).join('');
        $wallets.append(walletsHtml);

        if ($wallets[0].length == 2) {
            $wallets[0].selectedIndex = 1;
            $wallets.trigger('change');
        }

        // refresh pools
        const coinPools = coinsPools[coin] || {};
        const poolsHtml = Object.entries(coinPools).map(entry => {
            const [poolName, pool] = entry;
            const poolUrls = pool.urls || {};
            let poolUser = pool.user || '';

            const htmlOptions = Object.entries(poolUrls).map(entry => {
                const [serverName, poolUrl] = entry;
                return `<option value="${poolUrl}" data-pooluser="${poolUser}">${serverName} | ${poolUrl}</option>`;
            });

            let html = '';
            if (htmlOptions.length > 0) {
                html += `<optgroup label="${poolName}">`;
                html += htmlOptions.join('');
                html += `</optgroup>`;
            }
            return html;
        }).join('');
        $pools.append(poolsHtml);

        if ($pools[0].length == 2) {
            $pools[0].selectedIndex = 1;
            $pools.trigger('change');
        }

        // refresh miners
        $miners.children().each((idx, opt) => {
            const $opt = jQuery(opt);
            const minerName = $opt.val();

            if (minerName == '' || (minerName in coinsMiners[coin])) {
                $opt.attr('disabled', false).removeClass('d-none');

            } else {
                $opt.attr('disabled', true).addClass('d-none');
            }
        });
    }

    if ($miners.children(':selected:disabled').length) {
        $miners.val('');
        $miners.trigger('change');
    }

    if ($miners.children(':not(:disabled)').length == 2) {
        $miners.val( $miners.children(':not(:disabled)')[1].value );
        $miners.trigger('change');
    }
}

function modalStartMinerChangeWallet() {
    const $pools = jQuery('#newMiner_pool');
    const $wallets = jQuery('#newMiner_wallet');
    const $worker = jQuery('#newMiner_worker');
    const $user = jQuery('#newMiner_pool_user');
    const walletAddress = $wallets.val();

    const workerName = $worker.val();
    let poolUser = walletAddress ? `${walletAddress}.${workerName}` : '';

    if (poolUser) {
        const $selectPoolOption = $pools.find(':selected');

        if ($selectPoolOption.length) {
            const _poolUser = $selectPoolOption.data('pooluser');
            if (_poolUser) {
                poolUser = _poolUser;
                poolUser = poolUser.replace( new RegExp('{worker}', 'g'), workerName );
                poolUser = poolUser.replace( new RegExp('{wallet}', 'g'), walletAddress );
            }
        }

        if (poolUser.startsWith('.')) {
            poolUser = '';
        }
        if (poolUser.endsWith('.')) {
            poolUser = poolUser.slice(0, -1);
        }
        if (poolUser.endsWith('+')) {
            poolUser = poolUser.slice(0, -1);
        }
    }

    $user.val(poolUser);
}

function modalStartMinerChangePool() {
    const $pools = jQuery('#newMiner_pool');
    const $pool = jQuery('#newMiner_pool_url');
    $pool.val( $pools.val() );

    // la valeur de poolUser depend du choix de la pool, on declenche donc un refresh wallet
    modalStartMinerChangeWallet();
}

function modalStartMinerChangeWorker() {
    // la valeur de poolUser depend du choix du worker, on declenche donc un refresh wallet
    modalStartMinerChangeWallet();
}

function modalStartMinerChangeMiner() {
    const $miner = jQuery('#newMiner_miner');
    const $algo = jQuery('#newMiner_algo');
    const $extraArgs = jQuery('#newMiner_extraArgs');
    const $coins = jQuery('#newMiner_coin');

    const coin = $coins.val();
    const miner = $miner.val();

    const minerConf = miners[miner];
    let extraArgsArr = [];
    if (minerConf && minerConf.extraArgs && minerConf.extraArgs.trim()) {
        extraArgsArr.push(minerConf.extraArgs.trim());
    }

    if (coin && miner) {
        const coinMinerConf = coinsMiners[coin] ? coinsMiners[coin][miner] : null;
        $algo.val(coinMinerConf ? coinMinerConf.algo : '');

        if (coinMinerConf && coinMinerConf.extraArgs && coinMinerConf.extraArgs.trim()) {
            extraArgsArr.push(coinMinerConf.extraArgs.trim());
        }
    }

    const extraArgs = extraArgsArr.join(' ');
    $extraArgs.val(extraArgs);

}

