#!/bin/bash

tmux kill-window

sessionName="project-x"

tmux has-session -t $sessionName
hasSession=$?

if [ "$hasSession" = "0" ]; then
    tmux attach -t $sessionName
    exit 0
fi

echo "$sessionName 启动中……"

tmux new-session -d -s $sessionName -n "project-x-session" "$SHELL"
t=$sessionName:"project-x-session"
# watch server ts
tmux split-window -h -t $t "trap '' 2;./node_modules/typescript/bin/tsc --watch -p ./ -w;$SHELL"

tmux attach -t $sessionName
