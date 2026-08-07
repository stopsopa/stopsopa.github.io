#
# SOCKET=var/socket.sock /bin/bash bash/socket/pipe.sh
#
# Pipes stdin to the socket (each newline-terminated line is forwarded as a message).
#
# Example - slow animated multi-line send:
#
#   printf "
#   first line
#   \e[32msecond\e[0m line
#   \e[33mthird\e[0m line
#   \e[35mfourth\e[0m line
#   \e[31mfifth\e[0m line
#   last line
#   " | perl -pe "system 'sleep .03'" | SOCKET=var/socket.sock /bin/bash bash/socket/pipe.sh
#
# Or skip the wrapper and pipe directly with nc:
#
#   printf "..." | perl -pe "system 'sleep .03'" | nc -U var/socket.sock
#

# Source status.sh script relative to this file's directory to verify socket status
THIS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${THIS_DIR}/status.sh"

# pipe stdin directly into the socket
# nc -U connects to a Unix domain socket and forwards stdin line by line
nc -U "${SOCKET}"
