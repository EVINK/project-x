#!/bin/bash

PORT=null
num_re='^[0-9]+$'

if [ "$1" == "dev" ]; then
  ./node_modules/nodemon/bin/nodemon.js -r source-map-support/register --trace-uncaught ./app/main.js
  exit 1
elif [ "$1" == "-p" ] || [ "$1" == "--port" ]; then
  if ! [[ $2 =~ $num_re ]]; then
    echo "error: $1 need a number type, but got '$2'" >&2
    exit 1
  fi
  PORT=$2
fi

if [ $PORT == null ]; then
  node -r source-map-support/register --trace-uncaught ./app/main.js
  exit 1
fi

PORT=$PORT node -r source-map-support/register --trace-uncaught ./app/main.js
