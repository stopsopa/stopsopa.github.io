#
# SOCKET=var/socket.sock /bin/bash bash/socket/status.sh
#
# Checks whether the broker socket is alive and accepting connections.
# Exits 0 if alive, exits 1 if not.
#
# Manual diagnostics:
#   lsof var/socket.sock
#   netstat -an | grep socket.sock
#   nc -U var/socket.sock
#

if [ -z "${SOCKET}" ]; then
    echo "${0} error: env var SOCKET is empty"
    exit 1
fi

# don't use -s - that is for checking if file specified by env var exist and is not empty, use -S for sockets
if [ ! -S "${SOCKET}" ]; then
    echo "dead: socket file does not exist: ${SOCKET}"
    exit 1
fi

# Try to connect with an immediate close (empty stdin via /dev/null).
# On macOS, nc -U with closed stdin connects and immediately disconnects cleanly.
# If nothing is listening, nc exits non-zero.
if nc -U "${SOCKET}" < /dev/null > /dev/null 2>&1; then
    # Socket is alive and accepting connections
    # allow script to continue
    # it is designed to be used like
    # source bash/socket/status.sh
    :
else
    echo "dead: socket file exists but nothing is listening: ${SOCKET}"
    exit 1
fi
