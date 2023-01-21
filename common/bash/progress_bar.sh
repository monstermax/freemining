#!/bin/bash

bar_size=70
#bar_char_done="#"
bar_char_todo="-"
bar_char_done="\u2588"
bar_char_todo="\u25AA"
bar_percentage_scale=0

function show_progress {
    current="$1"
    total="$2"

    # calculate the progress in percentage 
    percent=$(bc <<< "scale=$bar_percentage_scale; 100 * $current / $total" )
    # The number of done and todo characters
    done=$(bc <<< "scale=0; $bar_size * $percent / 100" )
    todo=$(bc <<< "scale=0; $bar_size - $done" )

    # build the done and todo sub-bars
    #done_sub_bar=$(printf "%${done}s" | tr " " "${bar_char_done}")
    #todo_sub_bar=$(printf "%${todo}s" | tr " " "${bar_char_todo}")
    done_sub_bar=$(printf "%${done}s" | sed "s/ /$(echo -e "${bar_char_done}")/g")
    todo_sub_bar=$(printf "%${todo}s" | sed "s/ /$(echo -e "${bar_char_todo}")/g")

    # output the bar
    #echo -ne "\rProgress : [${done_sub_bar}${todo_sub_bar}] ${percent}%"
    echo -ne "\r${percent}% \t|${done_sub_bar}${todo_sub_bar}|"

    if [ $total -eq $current ]; then
        echo -e "\nDONE"
    fi
}


if test "$0" = "$BASH_SOURCE"; then
    # Usage example: 

    show_progress 0 100

    p=0
    while test $p -lt 100; do
        show_progress $p 100

        delay=$(($RANDOM/15000))
        sleep $delay

        dp=$(($RANDOM/5000))
        let $((p = p + dp))
    done

    show_progress 100 100
fi

