#!/usr/bin/env bash

# cat /this-file-does-not-exist | tr , :
# or just for simulation:
true | false | true | false

PIPESTAT=( "${PIPESTATUS[@]:-${pipestatus[@]}}" ) # to normalize sources from bash and zsh

declare -p PIPESTAT

for s in "${PIPESTAT[@]}"; do
    [ "$s" -eq 0 ] || {
    echo "$0 error: pipeline failed, $(declare -p PIPESTAT)"; exit 1; 
    }
done
