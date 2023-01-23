#!/bin/bash

if [ "$commonBashDir" = "" ]; then
    commonBashDir=$(dirname $BASH_SOURCE)
fi

# https://iridakos.com/programming/2018/03/01/bash-programmable-completion-tutorial

_frm_completions_daemon="run debug start restart stop status ps log log-file pid pid-log pid-file"


#COMP_WORDS: an array of all the words typed after the name of the program the compspec belongs to
#COMP_CWORD: an index of the COMP_WORDS array pointing to the word the current cursor is at - in other words, the index of the word the cursor was when the tab key was pressed
#COMP_LINE: the current command line



function _frm_completions {

    if [ "${COMP_WORDS[1]}" = "rig" ]; then
        # FRM / RIG
        COMP_WORDS=("${COMP_WORDS[@]:1}")
        _rig_completions

    elif [ "${COMP_WORDS[1]}" = "farm" ]; then
        # FRM / FARM
        COMP_WORDS=("${COMP_WORDS[@]:1}")
        _farm_completions

    elif [ "${COMP_WORDS[1]}" = "node" ]; then
        # FRM / NODE
        COMP_WORDS=("${COMP_WORDS[@]:1}")
        _node_completions

    elif [ "${COMP_WORDS[1]}" = "pool" ]; then
        # FRM / POOL
        COMP_WORDS=("${COMP_WORDS[@]:1}")
        _pool_completions

    elif [ "${COMP_WORDS[1]}" = "miner" ]; then
        # FRM / MINER (shortcut to FRM / RIG / MINER)
        COMP_WORDS=("${COMP_WORDS[@]:1}")
        _rig_miners_completions

    elif [ "${COMP_WORDS[1]}" = "fullnode" ]; then
        # FRM / FULLNODE (shortcut to FRM / NODE / FULLNODE)
        COMP_WORDS=("${COMP_WORDS[@]:1}")
        _node_fullnodes_completions

    else
        # FRM / *

        if [ "${#COMP_WORDS[@]}" -gt "2" ]; then
            return
        fi

        values="rig farm pool node bin-install modules-install compile ps update miner fullnode dir"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[1]}"))
    fi

}


function _rig_completions {
    # import farm_manager to access to $FARM_CONFIG_FILE
    source ${commonBashDir}/../../farm_manager/farm_manager.sh

    # import rig_manager to access to $CONFIGURED_MINERS & $INSTALLED_MINERS & $INSTALLABLE_MINERS
    source ${commonBashDir}/../../rig_manager/rig_manager.sh

    if [ "${COMP_WORDS[1]}" = "config" ]; then
        # FRM / RIG / CONFIG
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="show set {} []"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    elif [ "${COMP_WORDS[1]}" = "miner" ]; then
        # FRM / RIG / MINER
        COMP_WORDS=("${COMP_WORDS[@]:1}")
        _rig_miners_completions

    elif [ "${COMP_WORDS[1]}" = "miner-install" ]; then
        # FRM / MINER / MINER-INSTALL
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="${INSTALLABLE_MINERS}"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    elif [ "${COMP_WORDS[1]}" = "miner-uninstall" ]; then
        # FRM / MINER / miner-UNINSTALL
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="${INSTALLED_MINERS}"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    elif [ "${COMP_WORDS[1]}" = "agent" ]; then
        # FRM / RIG / AGENT
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="$_frm_completions_daemon"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    else
        # FRM / RIG / *
        if [ "${#COMP_WORDS[@]}" -gt "2" ]; then
            return
        fi
        values="ps json install miner-install miner-uninstall config miner agent status dir"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[1]}"))
    fi
}


function _rig_miners_completions {
    LAST_WORD=${COMP_WORDS[-1]}
    PREV_WORD=""
    #NB_WORDS=${#COMP_WORDS[@]}
    ALL_EXCEPT_LAST=${COMP_WORDS[@]::${#COMP_WORDS[@]}-1}

    if [ "${COMP_WORDS[1]}" = "ps" ]; then
        # FRM / RIG / MINER / PS
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="${INSTALLED_MINERS}"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    elif [ "${COMP_WORDS[1]}" = "dir" ]; then
        # FRM / RIG / MINER / DIR
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="${INSTALLED_MINERS}"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    elif [[ " $INSTALLED_MINERS " =~ .*" ${COMP_WORDS[1]} ".* ]]; then
        # FRM / RIG / MINER / {MINER}
        if [ "${COMP_WORDS[2]}" = "run" -o "${COMP_WORDS[2]}" = "start" -o "${COMP_WORDS[2]}" = "restart" -o "${COMP_WORDS[2]}" = "debug" ]; then
            PREV_WORD=${COMP_WORDS[-2]}
            values=""

            if [ "$PREV_WORD" = "-algo" ]; then
                selectedUser=$(getArrayOpt "-user" ${ALL_EXCEPT_LAST[@]})
                selectedPool=$(getArrayOpt "-url" ${ALL_EXCEPT_LAST[@]})

                if [ "$selectedUser" != "" ]; then
                    algos="$(jq -r "[.pools[][] | select(.poolAccount == \"$selectedUser\") .algo] | unique[]" $FARM_CONFIG_FILE)"
                    values="$values $algos"

                elif [ "$selectedPool" != "" ]; then
                    algos="$(jq -r "[.pools[][] | select(.poolUrl == \"$selectedPool\") .algo] | unique[]" $FARM_CONFIG_FILE)"
                    values="$values $algos"

                else
                    algos="$(jq -r "[.pools[][].algo] | unique[]" $FARM_CONFIG_FILE)"
                    values="$values $algos"
                fi

                # TODO: load algos list for selected miner
                #values="$values x1 x2 x3"

            elif [ "$PREV_WORD" = "-url" ]; then
                # list accounts from config file
                selectedUser=$(getArrayOpt "-user" ${ALL_EXCEPT_LAST[@]})
                if [ "$selectedUser" != "" ]; then
                    urls="$(jq -r "[.pools[][] | select(.poolAccount == \"$selectedUser\") .poolUrl] | unique[]" $FARM_CONFIG_FILE)"
                    values="$values $urls"
                else
                    urls="$(jq -r "[.pools[][].poolUrl] | unique[]" $FARM_CONFIG_FILE)"
                    values="$values $urls"
                fi

            elif [ "$PREV_WORD" = "-user" ]; then
                # list accounts from config file

                selectedPool=$(getArrayOpt "-url" ${ALL_EXCEPT_LAST[@]})
                if [ "$selectedPool" != "" ]; then
                    users="$(jq -r "[.pools[][] | select(.poolUrl == \"$selectedPool\") .poolAccount] | unique[]" $FARM_CONFIG_FILE)"
                    values="$values $users"
                else
                    users="$(jq -r "[.pools[][].poolAccount] | unique[]" $FARM_CONFIG_FILE)"
                    values="$values $users"
                fi

            else
                if [[ ! " ${ALL_EXCEPT_LAST[@]} " =~ .*" -algo ".* ]]; then
                    values="$values -algo"
                fi

                if [[ ! " ${ALL_EXCEPT_LAST[@]} " =~ .*" -url ".* ]]; then
                    values="$values -url"
                fi

                if [[ ! " ${ALL_EXCEPT_LAST[@]} " =~ .*" -user ".* ]]; then
                    values="$values -user"
                fi
            fi

            COMPREPLY=($(compgen -W '${values}' -- "${LAST_WORD}"))
            return
        fi
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="$_frm_completions_daemon dir status-json status-txt"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    else
        # FRM / RIG / MINER / *
        values="${INSTALLED_MINERS} ps dir"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[1]}"))
    fi

}


function _farm_completions {
    if [ "${COMP_WORDS[1]}" = "config" ]; then
        # FRM / FARM / CONFIG
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="show set {} []"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    elif [ "${COMP_WORDS[1]}" = "webserver" ]; then
        # FRM / FARM / WEBSERVER
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="$_frm_completions_daemon"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    else
        # FRM / FARM / *
        if [ "${#COMP_WORDS[@]}" -gt "2" ]; then
            return
        fi
        values="ps rigs json install config webserver dir"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[1]}"))
    fi
}


function _node_completions {
    # import node_manager to access to $CONFIGURED_FULLNODES & $INSTALLABLE_FULLNODES & $INSTALLED_FULLNODES
    source ${commonBashDir}/../../node_manager/node_manager.sh

    if [ "${COMP_WORDS[1]}" = "config" ]; then
        # FRM / NODE / CONFIG
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="show set {} []"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    elif [ "${COMP_WORDS[1]}" = "fullnode" ]; then
        # FRM / NODE / FULLNODE
        COMP_WORDS=("${COMP_WORDS[@]:1}")
        _node_fullnodes_completions

    elif [ "${COMP_WORDS[1]}" = "fullnode-install" ]; then
        # FRM / NODE / FULLNODE-INSTALL
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="${INSTALLABLE_FULLNODES}"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    elif [ "${COMP_WORDS[1]}" = "fullnode-uninstall" ]; then
        # FRM / NODE / FULLNODE-UNINSTALL
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="${INSTALLED_FULLNODES}"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    elif [ "${COMP_WORDS[1]}" = "webserver" ]; then
        # FRM / NODE / WEBSERVER
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="$_frm_completions_daemon"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    else
        if [ "${#COMP_WORDS[@]}" -gt "2" ]; then
            return
        fi
        values="ps json install fullnode fullnode-install fullnode-uninstall webserver dir"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[1]}"))
    fi
}



function _node_fullnodes_completions {

    if [ "${COMP_WORDS[1]}" = "ps" ]; then
        # FRM / NODE / FULLNODE / PS
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="${INSTALLED_FULLNODES}"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    elif [ "${COMP_WORDS[1]}" = "dir" ]; then
        # FRM / NODE / FULLNODE / DIR
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="${INSTALLED_FULLNODES}"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    elif [[ " $INSTALLED_FULLNODES " =~ .*" ${COMP_WORDS[1]} ".* ]]; then
        # FRM / NODE / FULLNODE / {FULLNODE}
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="$_frm_completions_daemon dir"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    else
        # FRM / NODE / FULLNODE / *
        values="${INSTALLED_FULLNODES} ps dir"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[1]}"))
    fi

}


function _pool_completions {
    if [ "${COMP_WORDS[1]}" = "config" ]; then
        # FRM / POOL / CONFIG
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="show set {} []"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    elif [ "${COMP_WORDS[1]}" = "webserver" ]; then
        # FRM / POOL / WEBSERVER
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="$_frm_completions_daemon"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    elif [ "${COMP_WORDS[1]}" = "engine" ]; then
        # FRM / POOL / ENGINE
        if [ "${#COMP_WORDS[@]}" -gt "3" ]; then
            return
        fi
        values="$_frm_completions_daemon"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[2]}"))

    else
        # FRM / POOL / *
        if [ "${#COMP_WORDS[@]}" -gt "2" ]; then
            return
        fi
        values="ps install package-install engine webserver dir"
        COMPREPLY=($(compgen -W '${values}' -- "${COMP_WORDS[1]}"))
    fi
}


complete -F _frm_completions frm

