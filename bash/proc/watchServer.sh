#!/bin/bash

# Usage: /bin/bash bash/proc/watchServer.sh <file_to_watch> -- <command> [args...]
# Example: /bin/bash bash/proc/watchServer.sh server.js -- node --env-file .env server.js
# /bin/bash bash/proc/watchServer.sh server.js -- node --env-file .env --watch server.js

if [ "$#" -lt 3 ]; then
    echo "Usage: ${0} <file_to_watch> -- <command> [args...]"
    exit 1
fi

WATCH_FILE="$1"
shift

if [ "$1" != "--" ]; then
    echo "Error: Expected '--' after filename."
    echo "Usage: ${0} <file_to_watch> -- <command> [args...]"
    exit 1
fi
shift

# The rest of the arguments are the command and its arguments
CMD=("$@")

# Function to handle cleanup on script exit
cleanup() {
    local EXIT_STATUS=$?
    if [ ! -z "${PID}" ]; then
        kill ${PID} 2>/dev/null
        wait ${PID} 2>/dev/null
    fi
    exit ${EXIT_STATUS}
}

trap cleanup SIGINT SIGTERM

while true; do
    echo "🚀 Starting: ${CMD[*]}"
    
    # Run the command in the background
    "${CMD[@]}" &
    PID=${!}
    
    # Wait for file change using the existing tool
    echo "👀 Watching: ${WATCH_FILE}"
    NODE_OPTIONS="" node bash/fs/watch.cjs "${WATCH_FILE}"
    WATCH_EXIT_CODE=$?
    
    if [ $WATCH_EXIT_CODE -eq 0 ]; then
        echo "♻️  Changes detected in file, restarting..."
    elif [ $WATCH_EXIT_CODE -eq 130 ]; then
        echo "${0}: 🛑 Stopped by user (Ctrl+C)"
        (exit 130)
        cleanup
    else
        echo "⌨️  Manual interruption (keypress), restarting on demand..."
    fi
    
    # Kill the background process and wait for it to exit
    kill ${PID} 2>/dev/null
    wait ${PID} 2>/dev/null

    sleep 0.5
done
