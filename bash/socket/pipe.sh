#
# This is just demo to wrap nc with some checks and then forward to nc -U
#
# SOCKET=var/socket.sock /bin/bash bash/socket/pipe.sh
# SOCKET=var/socket.sock /bin/bash bash/socket/pipe.sh --raw
#
# Pipes stdin to the socket.
# Options:
#   default (no flags) : Encodes entire stdin (including newlines and backslashes) into a single wire message
#   --raw              : Pipes stdin directly without line escaping
#
# Example - send multi-line block as a single message (default behavior):
#
#   printf "
#   first line
#   \e[32msecond\e[0m line
#   \e[33mthird\e[0m line
#   \e[35mfourth\e[0m line
#   \e[31mfifth\e[0m line
#   last line
#   " | SOCKET=var/socket.sock /bin/bash bash/socket/pipe.sh
#
# Example - slow animated multi-line send (raw line-by-line):
#
#   printf "
#   first line
#   \e[32msecond\e[0m line
#   \e[33mthird\e[0m line
#   \e[35mfourth\e[0m line
#   \e[31mfifth\e[0m line
#   last line
#   " | perl -pe "system 'sleep .3'" | SOCKET=var/socket.sock /bin/bash bash/socket/pipe.sh --raw
#
# Or skip the wrapper and pipe directly with nc:
#
#   printf "..." | perl -pe "system 'sleep .03'" | nc -U var/socket.sock
#

# Source status.sh script relative to this file's directory to verify socket status
THIS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${THIS_DIR}/status.sh"

# pipe stdin into the socket with appropriate wire encoding
# nc -U connects to a Unix domain socket
if [[ "$*" =~ (^|[[:space:]])--raw($|[[:space:]]) ]]; then
    # Raw unescaped passthrough
    nc -U "${SOCKET}"
else
    # Default: encode entire stdin as a single line message (\ -> \\, newline -> \n)
    perl -0777 -pe 's/\\/\\\\/g; s/\n/\\n/g; s/$/\n/;' | nc -U "${SOCKET}"
fi
