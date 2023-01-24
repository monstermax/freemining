
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




function startFullnodeAjax(fullnodeName, optionalParams='', onStart, onSuccess, onFail) {
    if (! fullnodeName) {
        console.warn(`Error: Missing {fullnode} parameter`);
        return;
    }

    const url = '/fullnodes/fullnode-run?chain=' + fullnodeName;
    const data = {
        action: 'start',
        chain: fullnodeName,
        optionalParams: optionalParams || '',
    };

    if (typeof onStart === 'function') {
        onStart(fullnodeName);
    }

    jQuery.post(url, data).then((response) => {
        if (response.startsWith('OK:')) {
            if (typeof onSuccess === 'function') {
                onSuccess(fullnodeName, response);
            }
            alertify.success('Fullnode ' + fullnodeName + ' started');

        } else {
            if (typeof onFail === 'function') {
                onFail(fullnodeName, err);
            }
            alertify.error('Fullnode ' + fullnodeName + ' cannot be started. ' + response);
        }

    }, (err) => {
        if (typeof onFail === 'function') {
            onFail(fullnodeName, err);
        }
        alertify.error('Fullnode ' + fullnodeName + ' cannot be started. ' + err.message);
    });
}


function stopFullnodeAjax(fullnodeName, onStart, onSuccess, onFail) {
    if (! fullnodeName) {
        console.warn(`Error: Missing {fullnode} parameter`);
        return;
    }

    alertify.confirm("<b>Fullnode stopping - confirmation</b>", "Do you want to stop the fullnode '<b>" + fullnodeName + "</b>' ?",
        function(){
            alertify.success('Stopping fullnode ' + fullnodeName + '...');

            if (typeof onStart === 'function') {
                onStart(fullnodeName);
            }

            const url = '/fullnodes/fullnode-run?chain=' + fullnodeName;
            const data = {
                action: 'stop',
                fullnode: fullnodeName,
            };
            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(fullnodeName, response);
                    }
                    alertify.success('Fullnode ' + fullnodeName + ' stopped<hr />');

                } else {
                    if (typeof onFail === 'function') {
                        onFail(fullnodeName, err);
                    }
                    alertify.error('Fullnode ' + fullnodeName + ' cannot be stopped. ' + response);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(fullnodeName, err);
                }
                alertify.error('Fullnode ' + fullnodeName + ' cannot be stopped. ' + err.message);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );

}
