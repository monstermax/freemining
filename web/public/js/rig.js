
const isFarm = (window.location.pathname.startsWith('/farm/'));
const urlPrefix = isFarm ? window.location.pathname.split('/').slice(0, 4).join('/') : '';


// MINER RUN START-MODAL
async function startMinerModal(minerName='', minerAlias='', onStart=null, onSuccess=null, onFail=null) {
    // /miners/miner-run-modal

    let startMinerModalObj;

    if (! window.startMinerModalObj) {
        const modalContent = await jQuery.get(urlPrefix + '/rig/miners-run-modal?miner=' + minerName);
        const $modalContainer = jQuery('<div id="modalMinerRun"></div>')
        $modalContainer.append(modalContent);
        jQuery(document.body).append($modalContainer);

        if (minerName) {
            jQuery('#newMiner_miner').val(minerName);

            if (minerName) {
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
    jQuery('#newMiner_preset').val('');
    jQuery('#newMiner_miner').val('');
    jQuery('#newMiner_alias').val('');
    jQuery('#newMiner_algo').val('');
    jQuery('#newMiner_pool_url').val('');
    jQuery('#newMiner_pool_user').val('');
    jQuery('#newMiner_optional_params').val('');
}


function loadStartMinerConfig(selectedPreset) {
    const $presetsContainer = jQuery('#startMinerPresets');
    const presetsContent = $presetsContainer.html();
    const presets = JSON.parse(presetsContent);

    const parts = selectedPreset.split('.');
    if (parts.length != 2) {
        jQuery('#newMiner_miner').val('');
        jQuery('#newMiner_alias').val('');
        jQuery('#newMiner_algo').val('');
        jQuery('#newMiner_pool_url').val('');
        jQuery('#newMiner_pool_user').val('');
        jQuery('#newMiner_optional_params').val('');
        return;
    }
    const [part1, part2] = parts;

    const config = presets[part1][part2];

    jQuery('#newMiner_miner').val(config.miner || '');
    jQuery('#newMiner_alias').val(config.alias || '');
    jQuery('#newMiner_algo').val(config.algo || '');
    jQuery('#newMiner_pool_url').val(config.poolUrl || '');
    jQuery('#newMiner_pool_user').val(config.poolUser || '');
    jQuery('#newMiner_optional_params').val(config.extraArgs || '');
}



function startMinerFromModal(modalOnStart=null, modalOnSuccess=null, modalOnFail=null) {
    const $form = jQuery('#startMinerForm');
    const $btn = jQuery('#startMinerBtnStart');

    $form.data('hasSubmited', true);
    if (! checkStartMinerForm()) return;

    // submit form
    //document.getElementById('action').value = 'start';
    //document.getElementById('startMinerForm').submit();

    const minerName = jQuery('#newMiner_miner').val();
    const minerAlias = jQuery('#newMiner_alias').val();
    const algo = jQuery('#newMiner_algo').val();
    const poolUrl = jQuery('#newMiner_pool_url').val();
    const poolUser = jQuery('#newMiner_pool_user').val();
    const extraArgs = jQuery('#newMiner_optional_params').val();

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
    startMinerAjax(minerName, minerAlias, algo, poolUrl, poolUser, extraArgs, onStart, onSuccess, onFail);
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
function startMinerAjax(minerName, minerAlias='', algo='', poolUrl='', poolUser='', extraArgs='', onStart=null, onSuccess=null, onFail=null) {
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

    const url = `/rig/miners/${minerName}/run`;
    const data = {
        action: 'start',
        miner: minerName,
        algo,
        poolUrl,
        poolUser,
        extraArgs: extraArgs || '',
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
function stopMinerAjax(minerName, minerAlias='', onStart=null, onSuccess=null, onFail=null) {
    if (! minerName) {
        console.warn(`Error: Missing {miner} parameter`);
        return;
    }

    //const minerFullName = `${minerName}-${minerAlias}`;
    const minerFullTitle = (minerName === minerAlias || ! minerAlias) ? minerName : `${minerName} (${minerAlias}))`;


    alertify.confirm("<b>Miner stopping - confirmation</b>", `Do you want to stop the miner '<b>${minerFullTitle}</b>' ?`,
        function(){
            alertify.success(`Stopping miner ${minerFullTitle}...`);

            if (typeof onStart === 'function') {
                onStart(minerName, minerAlias);
            }

            const url = `/rig/miners/${minerName}/run`;
            const data = {
                action: 'stop',
                miner: minerName,
            };
            jQuery.post(urlPrefix + url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(minerName, minerAlias, response);
                    }
                    alertify.success(`Miner ${minerFullTitle} stopped<hr />`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(minerName, minerAlias, { message: response });
                    }
                    alertify.error(`Miner ${minerFullTitle} cannot be stopped. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(minerName, minerAlias, err);
                }
                alertify.error(`Miner ${minerFullTitle} cannot be stopped. ${err.message}`);
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

            const url = `/rig/miners/${minerName}/install`;
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

            const url = `/rig/miners/${minerName}/install`;
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

            const url = `/rig/miners/${minerName}/uninstall`;
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

            const url = `/rig/miners/${minerName}/uninstall`;
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

            const url = `/rig/monitor-run`;
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

            const url = `/rig/monitor-run`;
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

