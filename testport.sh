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

node "$_DIR/bash/node/is-port-free.js" "0.0.0.0:${NODE_PORT}" --verbose