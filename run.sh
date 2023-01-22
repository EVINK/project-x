#!/bin/bash

PORT=null
NODE_ENV=null
num_re='^[0-9]+$'

NODE_ENV=$1
if [ "$1" == "dev" ]; then
  NODE_ENV=$NODE_ENV ./node_modules/nodemon/bin/nodemon.js -r source-map-support/register --trace-uncaught --trace-warnings ./app/main.js
  exit 1
elif [ "$1" == "-p" ] || [ "$1" == "--port" ]; then
  if ! [[ $2 =~ $num_re ]]; then
    echo "error: $1 need a number type, but got '$2'" >&2
    exit 1
  fi
  NODE_ENV=null
  PORT=$2
fi

if [ $PORT == null ]; then
  NODE_ENV=$NODE_ENV node -r source-map-support/register --trace-uncaught --trace-warnings ./app/main.js
  exit 1
fi

NODE_ENV=$NODE_ENV PORT=$PORT node -r source-map-support/register --trace-uncaught --trace-warnings ./app/main.js
