

// MINER RUN START-MODAL
async function startMinerModal(minerName='') {
    // /miners/miner-run-modal

    let startMinerModalObj;

    if (! window.startMinerModalObj) {
        const modalContent = await jQuery.get('/rig/miners-run-modal?miner=' + minerName);
        const $modalContainer = jQuery('<div id="modalMinerRun"></div>')
        $modalContainer.append(modalContent);
        jQuery(document.body).append($modalContainer);

        if (minerName) {
            jQuery('#newMiner_miner').val(minerName);
        }

        const options = {};
        const modal = document.getElementById('startMinerModal');
        startMinerModalObj = new bootstrap.Modal(modal, options);
        window.startMinerModalObj = startMinerModalObj;
    }

    window.startMinerModalObj.show();
}


function resetStartMinerModalForm() {
    jQuery('#newMiner_preset').val('');
    jQuery('#newMiner_miner').val('');
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
        jQuery('#newMiner_algo').val('');
        jQuery('#newMiner_pool_url').val('');
        jQuery('#newMiner_pool_user').val('');
        jQuery('#newMiner_optional_params').val('');
        return;
    }
    const [part1, part2] = parts;

    const config = presets[part1][part2];

    jQuery('#newMiner_miner').val(config.miner);
    jQuery('#newMiner_algo').val(config.algo);
    jQuery('#newMiner_pool_url').val(config.poolUrl);
    jQuery('#newMiner_pool_user').val(config.poolUser);
    jQuery('#newMiner_optional_params').val(config.args);
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
    const algo = jQuery('#newMiner_algo').val();
    const poolUrl = jQuery('#newMiner_pool_url').val();
    const poolUser = jQuery('#newMiner_pool_user').val();
    const extraArgs = jQuery('#newMiner_optional_params').val();

    const onStart = (minerName, reason) => {
        $btn.prop('disabled', true);
        $btn.addClass('disabled');
        $btn.html('Starting...');

        if (typeof modalOnStart === 'function') {
            modalOnStart(minerName, response);
        }
    };

    const onSuccess = (minerName, response) => {
        resetStartMinerModalForm();
        $form.data('hasSubmited', false);
        $btn.html('Start !');
        $btn.prop('disabled', false);
        $btn.removeClass('disabled');
        startMinerModalObj.hide();

        // delete startMinerModalObj to reload the running miners list
        jQuery('#startMinerModal').remove();

        if (typeof modalOnSuccess === 'function') {
            modalOnSuccess(minerName, response);
        }
    };
    const onFail = (minerName, err) => {
        const $btn = jQuery('#startMinerBtnStart');
        $btn.html('Start !');
        $btn.prop('disabled', false);
        $btn.removeClass('disabled');

        if (typeof modalOnFail === 'function') {
            modalOnFail(minerName, response);
        }
    };
    startMinerAjax(minerName, algo, poolUrl, poolUser, extraArgs, onStart, onSuccess, onFail);
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
function startMinerAjax(minerName, algo, poolUrl, poolUser, extraArgs='', onStart, onSuccess, onFail) {
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
        onStart(minerName);
    }

    jQuery.post(url, data).then((response) => {
        if (response.startsWith('OK:')) {
            if (typeof onSuccess === 'function') {
                onSuccess(minerName, response);
            }
            alertify.success(`Miner ${minerName} started`);

        } else {
            if (typeof onFail === 'function') {
                onFail(minerName, { message: response });
            }
            alertify.error(`Miner ${minerName} cannot be started. ${response}`);
        }

    }, (err) => {
        if (typeof onFail === 'function') {
            onFail(minerName, err);
        }
        alertify.error(`Miner ${minerName} cannot be started. ${err.message}`);
    });
}


// MINER RUN STOP
function stopMinerAjax(minerName, onStart, onSuccess, onFail) {
    if (! minerName) {
        console.warn(`Error: Missing {miner} parameter`);
        return;
    }

    alertify.confirm("<b>Miner stopping - confirmation</b>", `Do you want to stop the miner '<b>${minerName}</b>' ?`,
        function(){
            alertify.success(`Stopping miner ${minerName}...`);

            if (typeof onStart === 'function') {
                onStart(minerName);
            }

            const url = `/rig/miners/${minerName}/run`;
            const data = {
                action: 'stop',
                miner: minerName,
            };
            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(minerName, response);
                    }
                    alertify.success(`Miner ${minerName} stopped<hr />`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(minerName, { message: response });
                    }
                    alertify.error(`Miner ${minerName} cannot be stopped. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(minerName, err);
                }
                alertify.error(`Miner ${minerName} cannot be stopped. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );

}


// MINER INSTALL START
function startMinerInstallAjax(minerName, onStart, onSuccess, onFail) {
    if (! minerName) {
        console.warn(`Error: Missing {miner} parameter`);
        return;
    }

    alertify.confirm("<b>Miner installation - confirmation</b>", `Do you want to install the miner '<b>${minerName}</b>' ?`,
        function(){
            alertify.success(`Starting miner ${minerName} installation...`);

            if (typeof onStart === 'function') {
                onStart(minerName);
            }

            const url = `/miners/${minerName}/install`;
            const data = {
                action: 'start',
                miner: minerName,
            };

            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(minerName, response);
                    }
                    alertify.success(`Miner ${minerName} installation started`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(minerName, { message: response });
                    }
                    alertify.error(`Miner ${minerName} installation cannot be started. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(minerName, err);
                }
                alertify.error(`Miner ${minerName} installation cannot be started. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}


// MINER INSTALL STOP
function stopMinerInstallAjax() {
    if (! minerName) {
        console.warn(`Error: Missing {miner} parameter`);
        return;
    }

    alertify.confirm("<b>Miner installation stopping - confirmation</b>", `Do you want to stop the installation of the miner '<b>${minerName}</b>' ?`,
        function(){
            alertify.success(`Stopping miner ${minerName} installation...`);

            if (typeof onStart === 'function') {
                onStart(minerName);
            }

            const url = `/miners/${minerName}/install`;
            const data = {
                action: 'stop',
                miner: minerName,
            };
            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(minerName, response);
                    }
                    alertify.success(`Miner ${minerName} installation stopped<hr />`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(minerName, { message: response });
                    }
                    alertify.error(`Miner ${minerName} installation cannot be stopped. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(minerName, err);
                }
                alertify.error(`Miner ${minerName} installation cannot be stopped. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}


// MINER UNINSTALL START
function startMinerUninstallAjax(minerName, onStart, onSuccess, onFail) {
    if (! minerName) {
        console.warn(`Error: Missing {miner} parameter`);
        return;
    }

    alertify.confirm("<b>Miner uninstallation - confirmation</b>", `Do you want to uninstall the miner '<b>${minerName}</b>' ?`,
        function(){
            alertify.success(`Starting miner ${minerName} uninstallation...`);

            if (typeof onStart === 'function') {
                onStart(minerName);
            }

            const url = `/miners/${minerName}/uninstall`;
            const data = {
                action: 'start',
                miner: minerName,
            };

            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(minerName, response);
                    }
                    alertify.success(`Miner ${minerName} uninstallation started`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(minerName, { message: response });
                    }
                    alertify.error(`Miner ${minerName} uninstallation cannot be started. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(minerName, err);
                }
                alertify.error(`Miner ${minerName} uninstallation cannot be started. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}


// MINER UNINSTALL STOP
function stopMinerUninstallAjax() {
    if (! minerName) {
        console.warn(`Error: Missing {miner} parameter`);
        return;
    }

    alertify.confirm("<b>Miner uninstallation stopping - confirmation</b>", `Do you want to stop the uninstallation of the miner '<b>${minerName}</b>' ?`,
        function(){
            alertify.success(`Stopping miner ${minerName} uninstallation...`);

            if (typeof onStart === 'function') {
                onStart(minerName);
            }

            const url = `/miners/${minerName}/uninstall`;
            const data = {
                action: 'stop',
                miner: minerName,
            };
            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(minerName, response);
                    }
                    alertify.success(`Miner ${minerName} uninstallation stopped<hr />`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(minerName, { message: response });
                    }
                    alertify.error(`Miner ${minerName} uninstallation cannot be stopped. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(minerName, err);
                }
                alertify.error(`Miner ${minerName} uninstallation cannot be stopped. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}
