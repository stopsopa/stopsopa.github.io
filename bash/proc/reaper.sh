#
# kill version 2 - upgraded
# this script is just designed to kill particular processes found in ps aux filtered with grep
# look at the very bottom of this script where exact grep sequences are specified with explanation what is supposed to be killed
#

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    __DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    ;;
  sh)
    __DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    ;;
  *)
    __DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    ;;
esac

set -e

source "${__DIR}/../trim.sh"

set +e

function findDevFrontServerPid {
    CMD="${1}"

    ROW="$(eval "${CMD}")"

    echo -e "  executing: >${CMD}< found rows:\n  ${ROW:->not found<}"

    PID_CMD="echo '${ROW}' | awk '{ print \$2 }'"

    PIDS="$(eval "${PID_CMD}")"

    PIDS="$(trim "${PIDS}")"

    if [ "${PIDS}" != "" ]; then
        echo "  executing: >${CMD}< pids: >$(echo -n "${PIDS}" | tr '\n' ',')<"
    fi
}

function tryToKill {
    findDevFrontServerPid "${1}"

    while read -r PID
    do
        if [ "${KILL_V2_EXCLUDE_PARENT_PID}" != "" ] && [ "${PID}" = "${KILL_V2_EXCLUDE_PARENT_PID}" ]; then

            cat <<EEE

    skipping KILL_V2_EXCLUDE_PARENT_PID >${KILL_V2_EXCLUDE_PARENT_PID}<

EEE

            continue;
        fi

        if [ "${PID}" != "" ]; then
            if [[ ${PID} =~ ^[0-9]+$ ]]; then

                echo "  executing: >${CMD}< attempt to kill >${PID}<"

                kill "${PID}"

                if [ "${WAIT}" != "" ]; then
                    sleep 1
                fi
            else
                echo "  executing: >${CMD}< error: if it's not empty then it should be integer"
            fi
        else

            echo "  executing: >${CMD}< status: not found in the first place"
        fi

    done <<< "${PIDS}"

    echo "  executing: >${CMD}< find again after..."

    findDevFrontServerPid "${1}"
    if [ "${PIDS}" = "" ]; then

        echo "  executing: >${CMD}< status: successfully killed"
    else

        echo "  executing: >${CMD}< status: couldn't kill, pids >${PIDS}<"

        exit 1
    fi
}

# # How to use this library:
# # Just create separate shell script with content like

# ... get _DIR env var with the path to where this new shell script is
# ... copy it from top of this file

# ROOT="${_DIR}/.."

# cd "${ROOT}"

# ROOT="$(pwd)"

# source "${ROOT}/bash/proc/reaper.sh"


# set -e

# source env.sh # to have PROJECT_NAME from .env available

# set +e

# echo "attempt to kill --flag-to-help-filter-ps-aux-to-kill-group-of-processes ${PROJECT_NAME}:"
# tryToKill "ps aux | grep -v grep | grep \"\--flag-to-help-filter-ps-aux-to-kill-group-of-processes ${PROJECT_NAME}\""



