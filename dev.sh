
_SHELL="$(ps "${$}" | grep "${$} " | grep -v grep | sed -rn "s/.*[-\/]+(bash|z?sh) .*/\1/p")"; # bash || sh || zsh
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    ;;
esac

set -x
set -e

if [ ! -d "${_DIR}/node_modules" ]; then

  yarn
fi

source "${_DIR}/bash/colours.sh";

if [ "${1}" = "" ]; then

    { red "${0} error: FLAG is not specified"; } 2>&3

    exit 1
fi

FLAG="${1}";

source "${_DIR}/.env"

if [ "${NODE_PORT}" = "" ]; then

  echo "${0} error: NODE_PORT is not defined"

  exit 1;
fi

__HOST="0.0.0.0"

if [ "${LOCAL_HOSTS}" != "" ]; then

  __HOST="${LOCAL_HOSTS}"
fi

function _kill {

  ps aux | grep "_${FLAG}" | grep -v grep | awk '{print $2}' | xargs kill


  kill "${PID1}" 1> /dev/null 2> /dev/null || :
  kill "${PID2}" 1> /dev/null 2> /dev/null || :
}

_kill;

trap _kill EXIT;

node libs/preprocessor.js

LOGFILE="${_DIR}/var/log.log"

rm -rf "${LOGFILE}"

# /bin/bash "${_DIR}/bash/proc/run-with-flag-and-kill.sh" "1_${FLAG}" \
# node node_modules/.bin/webpack --watch 2>&1 >> "${LOGFILE}" &
node node_modules/.bin/webpack --watch 1> >(/bin/bash bash/dlogger.sh o webpack >> "${LOGFILE}") 2> >(/bin/bash bash/dlogger.sh e webpack >> "${LOGFILE}") &
PID1="${!}"  

# WAITINGMESSAGE="hidden modules" # this text shows at the end of webpack build
WAITINGMESSAGE="compiled successfully in" # this text shows at the end of webpack build


cat <<EEE


  Now let's wait for webpack to spit '${WAITINGMESSAGE}' message
  if it takes too long go and inspect 
    ${LOGFILE}


EEE


set +x
while [ "$(cat "${LOGFILE}" | grep "${WAITINGMESSAGE}")" = "" ]
do
  sleep 0.02;

  # echo "================================ waiting for webpack to finish build ================================" >> "${LOGFILE}"
  echo "================================ waiting for webpack to finish build ================================" 1> >(/bin/bash bash/dlogger.sh o server_ >> "${LOGFILE}") 
done

set -x

# /bin/bash "${_DIR}/bash/proc/run-with-flag-and-kill.sh" "2_${FLAG}" \
# node server.js --flag "3_${FLAG}" 2>&1 >> "${LOGFILE}" &
node server.js --flag "3_${FLAG}" 1> >(/bin/bash bash/dlogger.sh o server_ >> "${LOGFILE}") 2> >(/bin/bash bash/dlogger.sh e server_ >> "${LOGFILE}") &
PID2="${!}"  

sleep 3 && node "${_DIR}/node_modules/.bin/open-cli" http://${__HOST}:${NODE_PORT}/index.html &

if [ "${2}" = "launch_ide" ]; then


    function wstorm {
      WSTORMTES="${HOME}/Library/Application Support/JetBrains/Toolbox/scripts/webstorm"
      WSTORMRUN="${HOME}/Library/Application\ Support/JetBrains/Toolbox/scripts/webstorm"

      if [ "${1}" = "detect" ]; then
        if [ -f "${WSTORMTES}" ]; then echo exist; else echo missing; fi
      else
        eval "${WSTORMRUN}" .
      fi
    }

    if [ "$(wstorm detect)" = "exist" ]; then
      cd "${_DIR}"
      wstorm
    else
      code "${_DIR}"
    fi

fi

tail -n 10000 -f "${LOGFILE}"
