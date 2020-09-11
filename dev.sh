#!/bin/bash

tmux kill-window

sessionName="dev-chat-socket"

tmux has-session -t $sessionName
# ↑ 上个命令的退出状态，或函数的返回值。
hasSession=$?

if [ "$hasSession" = "0" ];then
    tmux attach -t $sessionName
    exit 0
fi

echo "$sessionName 启动中……"

tmux new-session -d -s $sessionName -n "dev-chat-socket-session" "$SHELL"
t=$sessionName:"dev-chat-socket-session"
# use ^+b o to move mouse indicator 
tmux split-window -h -t $t "./node_modules/nodemon/bin/nodemon.js ./app/main.js $SHELL"
# tmux split-window -h -t $t "trap '' 1; nodemon ./app/main.js $SHELL"
# watch server ts
tmux split-window -h -t $t "trap '' 2;./node_modules/typescript/bin/tsc --watch -p ./ -w;$SHELL"

tmux attach -t $sessionName
