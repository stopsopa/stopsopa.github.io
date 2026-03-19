
# script to run many processes exclusively using OS lock file

# cat <<EEE > worker.sh
# echo "Worker starting..."
# sleep 2.5
# echo "Worker finished."
# EEE

# cat <<EEE > do.sh 
# echo start do.sh

# LOCKFILE="lock.lock"

# /bin/bash lock.sh "\${LOCKFILE}" /bin/bash worker.sh

# echo end do.sh
# EEE

# # and run simultaniously in 3 terminals
# /bin/bash do.sh 


# Check if we have at least 2 arguments
if [ "$#" -lt 2 ]; then
    echo "${0} error: usage: ${0} <lockfile> <command> [args...]"
    exit 1
fi

LOCK_FILE="$1"
shift

# Ensure the lock file exists
if [ ! -f "${LOCK_FILE}" ]; then
    touch "${LOCK_FILE}"
fi

if [ ! -f "${LOCK_FILE}" ]; then
    echo "${0} error: lock file >${LOCK_FILE}< does not exist. and couldn't be created"
    exit 1
fi

# Detect binary and execute directly
if command -v flock &> /dev/null; then
    # Linux (Non-blocking)
    flock -n "${LOCK_FILE}" "$@"
elif command -v lockf &> /dev/null; then
    # macOS / BSD (Non-blocking)
    # We add -d (debug output) to stderr to see exactly what's failing if it still does
    lockf -nk "${LOCK_FILE}" "$@"
else
    echo "${0} error: neither flock nor lockf found on this system."
    exit 1
fi
