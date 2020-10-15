#!/bin/bash

GITSTORAGESOURCE="git@github.com:stopsopa/gitstorage.git"

GITSTORAGETARGETDIR="github-stopsopa.github.io"

GITSTORAGELIST=(
    ".env::$GITSTORAGETARGETDIR/.env"
    "gitstorage-config.sh::$GITSTORAGETARGETDIR/gitstorage-config.sh"
)
