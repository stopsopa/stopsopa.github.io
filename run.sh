#!/bin/bash

# This script is executed with PROCESSVALUE extracted from .env in $1
# This script is usually executed by start.sh through make

set -e
set -x

_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

cd "$_DIR"

source "$_DIR/.env"

if [ "$NODE_PORT" = "" ]; then

  echo "$0 error: NODE_PORT is not defined"

  exit 1;
fi

source "$_DIR/bash/colours.sh";

FLAG="$1"

if [ "$#" -lt 1 ]; then

    { red "$0 error: not enought parameters specified, specify --flag .. parameter for ps aux"; } 2>&3

    exit 1
fi

if [ "$1" = "" ]; then

    { red "$0 error: flag parameter is empty"; } 2>&3

    exit 1
fi

# load tools
source "$_DIR/bash/time-format.sh"

# create log dir and file path
LOGDIR="$_DIR/var/logs/$(_date)"
mkdir -p "$LOGDIR"
LOGFILE="$LOGDIR/$(_time).log"

echo -e "\n\n\n-----v $(_datetime) v----->>>\n" >> $LOGFILE

__HOST="0.0.0.0"

if [ "$LOCAL_HOSTS" != "" ]; then

  __HOST="$LOCAL_HOSTS"
fi

sleep 0.5 && node "$_DIR/node_modules/.bin/open-cli" http://$__HOST:$NODE_PORT/index.html &

node server.js --port $NODE_PORT --log 15 --flag "$FLAG-main"












