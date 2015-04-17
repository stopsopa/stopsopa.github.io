
# usage:
#                                        V---- pid
# /bin/bash bash/proc/pid-is-running.sh 56
# /bin/bash bash/proc/pid-is-running.sh 56 "custom message - maybe name for tested process??"

if [ "${1}" = "" ]; then
    echo "${0} error: pid is not provided"
fi

if ! [[ ${1} =~ ^[0-9]+$ ]]; then

    echo "${0} error: given pid >${1}< doesn't match requirements ^[0-9]+$"

    exit 1
fi

LOG="${1}"

if [ "${2}" != "" ]; then
    LOG="${2}"
fi

if ps -p ${1} > /dev/null
then
   echo "${0}: ${LOG} is running"
else   
   echo "${0}: ${LOG} is NOT running"

   exit 1
fi