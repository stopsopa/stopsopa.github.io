
# The purpose of this command is to be able to run any command with special flag (string) that would allow you
# to filter this command with `ps aux | grep ${FLAG}`
# having this you can use /bin/bash bash/proc/kill.sh to kill this command by this flag
# this command killed will take care of killing all command that was executed in background
#
# /bin/bash "${_DIR}/bash/proc/run-with-flag-and-kill.sh" "${FLAG}" /bin/bash "${_DIR}/ttt.sh" a b "c d" &

# Then you can kill the bash script and it's child with:
# ps aux | grep "${FLAG}" | grep -v grep | awk '{print $2}' | xargs kill
# or more aggressively
# ps aux | grep "${FLAG}" | grep -v grep | awk '{print $2}' | xargs kill -9

set -e

FLAG="${1}"

shift

if [ "${FLAG}" = "" ]; then
    echo "${0} error: FLAG is not defined"
    exit 1
fi

# Prevent silently doing nothing if no command was supplied.
if [ "$#" -eq 0 ]; then
    echo "${0} error: command is not defined"
    exit 1
fi

function cleanup {
    kill -9 $(pgrep -P $$) > /dev/null 2> /dev/null || :
}

trap cleanup EXIT

# Execute the command exactly as received, preserving all arguments.
"$@"