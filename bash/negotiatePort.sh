
#
# logic based on: https://github.com/stopsopa/nlab/blob/6d25a0029bca4ba717c62ca04efc96616dfc6241/src/negotiatePort.js
# use:
#   /bin/bash bash/negotiatePort.sh http 4500 
#       will print >4500<
#
#   /bin/bash bash/negotiatePort.sh http 4500 ":"
#       will print >:4500<
#
#   /bin/bash bash/negotiatePort.sh http 80 ":"
#       will print ><
#
#   /bin/bash bash/negotiatePort.sh https 80 
#       will print >80<
#
#   /bin/bash bash/negotiatePort.sh https 80 ":"
#       will print >:80<
#
#   /bin/bash bash/negotiatePort.sh https 443 ":"
#       will print ><
#
#   /bin/bash bash/negotiatePort.sh https "" ":"
#       will print >< because port is not provided
#
# and so on...

SCHEMA="${1}"
PORT="${2}"
PREFIX="${3}"

TEST="^https?$"

if ! [[ ${SCHEMA} =~ ${TEST} ]]; then

    echo "${0} error: SCHEMA >${SCHEMA}< don't match ${TEST}"

    exit 1;
fi

if [ "${PORT}" = "" ]; then
    
    # for cases when port is not provided it should not fail too
    #
    # /bin/bash bash/negotiatePort.sh https "" ":"
    # /bin/bash bash/negotiatePort.sh http "" ":"
    # /bin/bash bash/negotiatePort.sh https "" 
    # /bin/bash bash/negotiatePort.sh http "" 
    #
    # that's weird case but it seems ok
    # for how this script will be used
    # script should just return empty stdout and 0 exit code

    exit 0;
fi

TEST="^[0-9]+$"

if ! [[ ${PORT} =~ ${TEST} ]]; then

    echo "${0} error: PORT >${PORT}< don't match ${TEST}"

    exit 1;
fi

RET=""

if [ "${SCHEMA}" = "https" ]; then
    if [ "${PORT}" != "443" ]; then
        RET="${PORT}"
    fi
else
    if [ "${PORT}" != "80" ]; then
        RET="${PORT}"
    fi
fi

if [ "${RET}" != "" ]; then
    echo -n "${PREFIX}${RET}";
fi



