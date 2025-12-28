
cat /this-file-does-not-exist | tr , :

PIPESTAT=( "${PIPESTATUS[@]:-${pipestatus[@]}}" ) # to normalize sources from bash and zsh

declare -p PIPESTAT

for s in "${PIPESTAT[@]}"; do (( s == 0 )) || { 
    echo "$0 error: pipeline failed, $(declare -p PIPESTAT)"; exit 1; 
}; done
