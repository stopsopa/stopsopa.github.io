# /bin/bash dev.sh
#   will not open browser nor ide
#
# /bin/bash dev.sh browser
#   will open browser
#
# /bin/bash dev.sh launch_ide
#   will open browser and ide
#
_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
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

cd "${_DIR}"

OPENBROWSER="0"
OPENIDE="0"
if [ "${1}" = "browser" ]; then
  OPENBROWSER="1"
fi
if [ "${1}" = "launch_ide" ]; then
  OPENBROWSER="1"
  OPENIDE="1"
fi

export NODE_OPTIONS=""

set -e

if [ ! -d "${_DIR}/node_modules" ]; then

  yarn
fi

mkdir -p public
cp node_modules/envprocessor/dist/esm/env.js public/env.js

source "${_DIR}/bash/colours.sh";

# -L file       True if file exists and is a symbolic link.
if [ ! -L _______index.html ]; then

  set +e
  ln -s index.html _______index.html
fi

if [ ! -L _______index.html ]; then
    { red "${0} error: _______index.html is not a symbolic link and it can't be created"; } 2>&3

    exit 1
fi

ENV=".env"

if [ ! -f "${ENV}" ]; then

    { red "${0} error: file >${ENV}< doesn't exist"; } 2>&3

    exit 1
fi

eval "$(node bash/exportsource.js "${ENV}")"

source ".env.sh"

__HOST="0.0.0.0"

if [ "${LOCAL_HOSTS}" != "" ]; then

  __HOST="${LOCAL_HOSTS}"
fi

function _kill {

  echo "final cleanup: kill"

  ps aux | grep "_${FLAG}" | grep -v grep | awk '{print $2}' | xargs kill

  kill "${PID1}" 1> /dev/null 2> /dev/null || :

  kill "${PID2}" 1> /dev/null 2> /dev/null || :

  kill "${PID3}" 1> /dev/null 2> /dev/null || :

  kill "${PID4}" 1> /dev/null 2> /dev/null || :

  kill "${PID5}" 1> /dev/null 2> /dev/null || :

  kill "${PID6}" 1> /dev/null 2> /dev/null || :
}

_kill;

trap _kill EXIT;

# node libs/preprocessor.js
node node_modules/.bin/envprocessor --maskEnv EXPOSE_EXTRA_ENV_VARIABLES --verbose --debug build/preprocessed.js public/preprocessed.js


LOGFILE="${_DIR}/var/log.log"

rm -rf "${LOGFILE}"

node esbuild-entries.js --watch --name "esbuild_${FLAG}" 1> >(/bin/bash bash/dlogger.sh " " esbuild >> "${LOGFILE}") 2> >(/bin/bash bash/dlogger.sh e esbuild >> "${LOGFILE}") &
PID1="${!}"  

/bin/bash esbuild-node.sh watch 1> >(/bin/bash bash/dlogger.sh " " esbuild >> "${LOGFILE}") 2> >(/bin/bash bash/dlogger.sh e esbuild >> "${LOGFILE}") &
PID3="${!}"

/bin/bash .github/injector.sh watch 1> >(/bin/bash bash/dlogger.sh " " esbuild >> "${LOGFILE}") 2> >(/bin/bash bash/dlogger.sh e esbuild >> "${LOGFILE}") &
PID4="${!}"

/bin/bash pages/bash/xx/xx.inverse.postprocessor.sh watch 1> >(/bin/bash bash/dlogger.sh " " invpost >> "${LOGFILE}") 2> >(/bin/bash bash/dlogger.sh e invpost >> "${LOGFILE}") &
PID5="${!}"

node node_modules/.bin/chokidar '**/*.template.html' --initial --ignore '**/node_modules/**/*' -c '/bin/bash scripts/template.sh' 1> >(/bin/bash bash/dlogger.sh " " templat >> "${LOGFILE}") 2> >(/bin/bash bash/dlogger.sh e templat >> "${LOGFILE}") &
PID6="${!}"

WAITINGMESSAGE="exbuilddone2" # this text shows at the end of esbuild build

cat <<EEE


  Now let's wait for esbuild to spit '${WAITINGMESSAGE}' message
  if it takes too long go and inspect 
    ${LOGFILE}


EEE

while [ "$(cat "${LOGFILE}" | grep "${WAITINGMESSAGE}")" = "" ]
do
  sleep 1;

  echo "================================ waiting for esbuild to finish build ================================" 1> >(/bin/bash bash/dlogger.sh " " "server " >> "${LOGFILE}") 
done

# /bin/bash "${_DIR}/bash/proc/run-with-flag-and-kill.sh" "2_${FLAG}" \
# node server.js --flag "3_${FLAG}" 2>&1 >> "${LOGFILE}" &
node server.js --flag "3_${FLAG}" 1> >(/bin/bash bash/dlogger.sh " " "server " >> "${LOGFILE}") 2> >(/bin/bash bash/dlogger.sh e "server " >> "${LOGFILE}") &
PID2="${!}"  

if [ "${OPENBROWSER}" = "1" ]; then
  sleep 3 && node "${_DIR}/node_modules/.bin/open-cli" http://${__HOST}:${NODE_API_PORT}/index.html 1> >(/bin/bash bash/dlogger.sh " " "opencli" >> "${LOGFILE}") 2> >(/bin/bash bash/dlogger.sh e "opencli" >> "${LOGFILE}") &
fi

if [ "${OPENIDE}" = "1" ]; then

  code "${_DIR}"
fi

set -e

/bin/bash bash/proc/pid-is-running.sh ${PID1} "esbuild2 process" 

/bin/bash bash/proc/pid-is-running.sh ${PID2} "server process" 

/bin/bash bash/proc/pid-is-running.sh ${PID3} "esbuild1 process" 

/bin/bash bash/proc/pid-is-running.sh ${PID4} "injector process" 

/bin/bash bash/proc/pid-is-running.sh ${PID5} "pages/bash/xx/xx.inverse.postprocessor.sh" 

/bin/bash bash/proc/pid-is-running.sh ${PID5} "template process" 

# tail -n 10000 -f "${LOGFILE}"

/bin/bash "${_DIR}/bash/proc/run-with-flag-and-kill.sh" "tail_${FLAG}" tail -n 10000 -f "${LOGFILE}"

