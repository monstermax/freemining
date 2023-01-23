#!/usr/bin/env python3

from sys import argv
from setproctitle import setproctitle
from subprocess import run

if len(argv) < 3:
    exit(1)


processName = argv[1]
cmd = ' '.join(argv[2:])

cmdFile = cmd.split(' ')[0]
#cmdFileBasename = cmdFile.split('/')[-1]

processName = "[" + processName + "] " + cmd

try:
    setproctitle(processName)

    run(cmd.split(' '))

except RuntimeError as error:
    print("Error")
    exit(1)
