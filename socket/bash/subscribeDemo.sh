# 
# SOCKET=var/socket.sock  /bin/bash socket/bash/subscribeDemo.sh
# 

# Source status.sh script relative to this file's directory to verify socket status
THIS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${THIS_DIR}/status.sh"

# nc -U "${SOCKET}" only works when socket alrady exist
        # -U -> use a Unix domain socket (instead of TCP/UDP)        


COUNT=0

# no new shell - use that
while IFS= read -r LINE; do
    COUNT=$((COUNT + 1))
    echo "inside: COUNT=$COUNT LINE=$LINE"
done < <(nc -U "${SOCKET}")

# new shell
# nc -U "${SOCKET}" | while IFS= read -r LINE; do
#     COUNT=$((COUNT + 1))
#     echo "inside: COUNT=$COUNT LINE=$LINE"
# done


# this will be printed when broker exits, then while will exit and we will see the final counter
# counter will not work with the commented version because pipe crates new shell
echo "outside: COUNT=$COUNT"


# RECAP:
# so that's how you can tap to the event bus in shell
# just setup export SOCKET and use status.sh for validation before going on with nc