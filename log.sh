#!/bin/bash
os="$(uname -s)"
log=''
if [ "$os" == "Darwin" ]; then
    log="$(find ./logs -maxdepth 1 -type f | sort -n | tail -1 | cut -f2- -d" ")"
elif [ "$os" == 'Linux' ]; then
    log="$(find ./logs -maxdepth 1 -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")"
fi

echo "log of $log"
export LESSCHARSET=utf-8
less -R +F "$log"
