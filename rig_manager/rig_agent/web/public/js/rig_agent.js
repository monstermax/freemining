
function toggleDarkMode(colorScheme) {
    if (! colorScheme) {
        const currentMode = (document.documentElement.style.colorScheme == 'dark') ? 'dark' : 'light';
        colorScheme = (currentMode == 'dark') ? 'light' : 'dark';
    }
    document.documentElement.style.colorScheme = colorScheme;
    document.querySelector('meta[name="color-scheme"]').content = document.documentElement.style.colorScheme;
    window.localStorage.setItem('colorScheme', colorScheme);

    if (colorScheme === 'dark') {
        jQuery('body').addClass('dark');
    } else {
        jQuery('body').removeClass('dark');
    }

    const colorIcon = (colorScheme == 'dark') ? '🌞' : '🌙';
    jQuery('.dark-icon').text(colorIcon);
}



function startMinerAjax(minerName, algo, poolUrl, poolAccount, optionalParams='', onStart, onSuccess, onFail) {
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
    if (! poolAccount) {
        console.warn(`Error: Missing {poolAccount} parameter`);
        return;
    }

    const url = '/miners/miner-run?miner=' + minerName;
    const data = {
        action: 'start',
        miner: minerName,
        algo,
        poolUrl,
        poolAccount,
        optionalParams: optionalParams || '',
    };

    if (typeof onStart === 'function') {
        onStart(minerName);
    }

    jQuery.post(url, data).then((response) => {
        if (response.startsWith('OK:')) {
            if (typeof onSuccess === 'function') {
                onSuccess(minerName, response);
            }
            alertify.success('Miner ' + minerName + ' started');

        } else {
            if (typeof onFail === 'function') {
                onFail(minerName, err);
            }
            alertify.error('Miner ' + minerName + ' cannot be started. ' + response);
        }

    }, (err) => {
        if (typeof onFail === 'function') {
            onFail(minerName, err);
        }
        alertify.error('Miner ' + minerName + ' cannot be started. ' + err.message);
    });
}


function stopMinerAjax(minerName, onStart, onSuccess, onFail) {
    if (! minerName) {
        console.warn(`Error: Missing {miner} parameter`);
        return;
    }

    alertify.confirm("<b>Miner stopping - confirmation</b>", "Do you want to stop the miner '<b>" + minerName + "</b>' ?",
        function(){
            alertify.success('Stopping miner ' + minerName + '...');

            if (typeof onStart === 'function') {
                onStart(minerName);
            }

            const url = '/miners/miner-run?miner=' + minerName;
            const data = {
                action: 'stop',
                miner: minerName,
            };
            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(minerName, response);
                    }
                    alertify.success('Miner ' + minerName + ' stopped<hr />');

                } else {
                    if (typeof onFail === 'function') {
                        onFail(minerName, err);
                    }
                    alertify.error('Miner ' + minerName + ' cannot be stopped. ' + response);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(minerName, err);
                }
                alertify.error('Miner ' + minerName + ' cannot be stopped. ' + err.message);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );

}
