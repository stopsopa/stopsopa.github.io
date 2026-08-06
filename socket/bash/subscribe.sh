# 
# SOCKET=var/socket.sock  /bin/bash socket/bash/subscribe.sh
# 
# 

if [ -z "${SOCKET}" ]; then
    echo "${0} error: env var SOCKET is empty"
    exit 1
fi

# don't use -s - that is for checking if file specified by env var exist and is not empty, use -S for sockets
if [ ! -S "${SOCKET}" ]; then
    echo "${0} error: socket ${SOCKET} doesn't exist"
    exit 1
fi

# nc -U "${SOCKET}" only works when socket alrady exist
        # -U -> use a Unix domain socket (instead of TCP/UDP)        

# nc -U "${SOCKET}" | while IFS= read -r LINE; do
#     echo "line >${LINE}<"
# done


# while IFS= read -r LINE; do
#     echo "line >${LINE}<"
# done < <(nc -U "${SOCKET}")



COUNT=0

nc -U "${SOCKET}" | while IFS= read -r LINE; do
    COUNT=$((COUNT + 1))
    echo "inside: COUNT=$COUNT LINE=$LINE"
done

echo "outside: COUNT=$COUNT"