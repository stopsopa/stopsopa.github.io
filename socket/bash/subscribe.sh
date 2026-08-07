# 
# SOCKET=var/socket.sock  /bin/bash socket/bash/subscribe.sh
# 
# 

# Source status.sh script relative to this file's directory to verify socket status
THIS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${THIS_DIR}/status.sh"

# nc -U "${SOCKET}" only works when socket alrady exist
        # -U -> use a Unix domain socket (instead of TCP/UDP)        

# nc -U "${SOCKET}" | while IFS= read -r LINE; do
#     echo "line >${LINE}<"
# done



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

echo "outside: COUNT=$COUNT"