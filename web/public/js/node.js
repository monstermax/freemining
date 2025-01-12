

// FULLNODE RUN START
function startFullnodeAjax(fullnodeName, extraArgs='', onStart, onSuccess, onFail) {
    if (! fullnodeName) {
        console.warn(`Error: Missing {fullnode} parameter`);
        return;
    }

    alertify.confirm("<b>Fullnode start - confirmation</b>", `Do you want to start the fullnode '<b>${fullnodeName}</b>' ?`,
        function(){
            const url = `/node/fullnodes/${fullnodeName}/run`;
            const data = {
                action: 'start',
                chain: fullnodeName,
                extraArgs: extraArgs || '',
            };

            if (typeof onStart === 'function') {
                onStart(fullnodeName);
            }

            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(fullnodeName, response);
                    }
                    alertify.success(`Fullnode ${fullnodeName} started`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(fullnodeName, { message: response });
                    }
                    alertify.error(`Fullnode ${fullnodeName} cannot be started. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(fullnodeName, err);
                }
                alertify.error(`Fullnode ${fullnodeName} cannot be started. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}


// FULLNODE RUN STOP
function stopFullnodeAjax(fullnodeName, onStart, onSuccess, onFail) {
    if (! fullnodeName) {
        console.warn(`Error: Missing {fullnode} parameter`);
        return;
    }

    alertify.confirm("<b>Fullnode stopping - confirmation</b>", `Do you want to stop the fullnode '<b>${fullnodeName}</b>' ?`,
        function(){
            alertify.success(`Stopping fullnode ${fullnodeName}...`);

            if (typeof onStart === 'function') {
                onStart(fullnodeName);
            }

            const url = `/node/fullnodes/${fullnodeName}/run`;
            const data = {
                action: 'stop',
                fullnode: fullnodeName,
            };
            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(fullnodeName, response);
                    }
                    alertify.success(`Fullnode ${fullnodeName} stopped<hr />`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(fullnodeName, { message: response });
                    }
                    alertify.error(`Fullnode ${fullnodeName} cannot be stopped. ${response}`);
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



// FULLNODE INSTALL START
function startFullnodeInstallAjax(fullnodeName, onStart, onSuccess, onFail) {
    if (! fullnodeName) {
        console.warn(`Error: Missing {chain} parameter`);
        return;
    }

    alertify.confirm("<b>Fullnode installation - confirmation</b>", `Do you want to install the fullnode '<b>${fullnodeName}</b>' ?`,
        function(){
            alertify.success('Starting fullnode ' + fullnodeName + ' installation...');

            if (typeof onStart === 'function') {
                onStart(fullnodeName);
            }

            const url = `/node/fullnodes/${fullnodeName}/install`;
            const data = {
                action: 'start',
                fullnode: fullnodeName,
            };

            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(fullnodeName, response);
                    }
                    alertify.success(`Fullnode ${fullnodeName} installation started`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(fullnodeName, { message: response });
                    }
                    alertify.error(`Fullnode ${fullnodeName} installation cannot be started. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(fullnodeName, err);
                }
                alertify.error(`Fullnode ${fullnodeName} installation cannot be started. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}


// FULLNODE INSTALL STOP
function stopFullnodeInstallAjax() {
    if (! fullnodeName) {
        console.warn(`Error: Missing {chain} parameter`);
        return;
    }

    alertify.confirm("<b>Fullnode installation stopping - confirmation</b>", `Do you want to stop the installation of the fullnode '<b>${fullnodeName}</b>' ?`,
        function(){
            alertify.success(`Stopping fullnode ${fullnodeName} installation...`);

            if (typeof onStart === 'function') {
                onStart(fullnodeName);
            }

            const url = `/node/fullnodes/${fullnodeName}/install`;
            const data = {
                action: 'stop',
                fullnode: fullnodeName,
            };
            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(fullnodeName, response);
                    }
                    alertify.success(`Fullnode ${fullnodeName} installation stopped<hr />`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(fullnodeName, { message: response });
                    }
                    alertify.error(`Fullnode ${fullnodeName} installation cannot be stopped. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(fullnodeName, err);
                }
                alertify.error(`Fullnode ${fullnodeName} installation cannot be stopped. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}


// FULLNODE UNINSTALL START
function startFullnodeUninstallAjax(fullnodeName, onStart, onSuccess, onFail) {
    if (! fullnodeName) {
        console.warn(`Error: Missing {chain} parameter`);
        return;
    }

    alertify.confirm("<b>Fullnode uninstallation - confirmation</b>", `Do you want to uninstall the fullnode '<b>${fullnodeName}</b>' ?`,
        function(){
            alertify.success('Starting fullnode ' + fullnodeName + ' uninstallation...');

            if (typeof onStart === 'function') {
                onStart(fullnodeName);
            }

            const url = `/node/fullnodes/${fullnodeName}/uninstall`;
            const data = {
                action: 'start',
                fullnode: fullnodeName,
            };

            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(fullnodeName, response);
                    }
                    alertify.success(`Fullnode ${fullnodeName} uninstallation started`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(fullnodeName, { message: response });
                    }
                    alertify.error(`Fullnode ${fullnodeName} uninstallation cannot be started. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(fullnodeName, err);
                }
                alertify.error(`Fullnode ${fullnodeName} uninstallation cannot be started. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}


// FULLNODE UNINSTALL STOP
function stopFullnodeUninstallAjax() {
    if (! fullnodeName) {
        console.warn(`Error: Missing {chain} parameter`);
        return;
    }

    alertify.confirm("<b>Fullnode uninstallation stopping - confirmation</b>", `Do you want to stop the uninstallation of the fullnode '<b>${fullnodeName}</b>' ?`,
        function(){
            alertify.success(`Stopping fullnode ${fullnodeName} uninstallation...`);

            if (typeof onStart === 'function') {
                onStart(fullnodeName);
            }

            const url = `/node/fullnodes/${fullnodeName}/uninstall`;
            const data = {
                action: 'stop',
                fullnode: fullnodeName,
            };
            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(fullnodeName, response);
                    }
                    alertify.success(`Fullnode ${fullnodeName} uninstallation stopped<hr />`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail(fullnodeName, { message: response });
                    }
                    alertify.error(`Fullnode ${fullnodeName} uninstallation cannot be stopped. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(fullnodeName, err);
                }
                alertify.error(`Fullnode ${fullnodeName} uninstallation cannot be stopped. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}



function startNodeMonitorAjax(onStart, onSuccess, onFail) {
    alertify.confirm("<b>Monitor run - confirmation</b>", `Do you want to start node monitor' ?`,
        function(){
            alertify.success(`Starting node monitor...`);

            if (typeof onStart === 'function') {
                onStart();
            }

            const url = `/node/monitor-run`;
            const data = {
                action: 'start',
            };

            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(response);
                    }
                    alertify.success(`Node monitor started`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail({ message: response });
                    }
                    alertify.error(`Node monitor cannot be started. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(err);
                }
                alertify.error(`Node monitor cannot be started. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}


function stopNodeMonitorAjax(onStart, onSuccess, onFail) {
    alertify.confirm("<b>Monitor run - confirmation</b>", `Do you want to stop node monitor' ?`,
        function(){
            alertify.success(`Stopping node monitor...`);

            if (typeof onStart === 'function') {
                onStart();
            }

            const url = `/node/monitor-run`;
            const data = {
                action: 'stop',
            };

            jQuery.post(url, data).then((response) => {
                if (response.startsWith('OK:')) {
                    if (typeof onSuccess === 'function') {
                        onSuccess(response);
                    }
                    alertify.success(`Node monitor stopped`);

                } else {
                    if (typeof onFail === 'function') {
                        onFail({ message: response });
                    }
                    alertify.error(`Node monitor cannot be stopped. ${response}`);
                }

            }, (err) => {
                if (typeof onFail === 'function') {
                    onFail(err);
                }
                alertify.error(`Node monitor cannot be stopped. ${err.message}`);
            });
        },
        function(){
            //alertify.error('Cancel');
        }
    );
}

