#!/bin/bash

# used in
# https://github.com/stopsopa/stopsopa.github.io

# GITSTORAGESOURCE="git@github.com:.. our repo link if different than default"

GITSTORAGETARGETDIR="github-stopsopa.github.io"

GITSTORAGELIST=(
    "../.env::${GITSTORAGETARGETDIR}/.env"
    "gitstorage-config.sh::${GITSTORAGETARGETDIR}/gitstorage-config.sh"
    "xx.cjs::${GITSTORAGETARGETDIR}/xx.cjs"
    ".gitignore_local::${GITSTORAGETARGETDIR}/.gitignore_local"
)
