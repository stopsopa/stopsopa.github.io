#
# kill version 2 - upgraded
# this script is just designed to kill particular processes found in ps aux filtered with grep
# look at the very bottom of this script where exact grep sequences are specified with explanation what is supposed to be killed
#

# 
# It can be called directly too

# cat <<EEE > garbage2.sh
# export NODE_OPTIONS=""
# node -e 'setTimeout(() => console.log(process.argv[1]), 1000000000)' -- --xxxxtest1 &
# node -e 'setTimeout(() => console.log(process.argv[1]), 1000000000)' -- --xxxxtest2 &
# node -e 'setTimeout(() => console.log(process.argv[1]), 1000000000)' -- --xxxxtest3 &
# EEE
# 
# then run: 
#   /bin/bash garbage2.sh
# 
# then you can run:
#   ps aux | grep xxxxtest | /bin/bash bash/proc/reaper.sh
#     by default reaper.sh will filter out what it was given with grep -v grep but you can skip that by setting REAPER_NOT_FILTER_OUT_GREP=1
#     but then better filter this yourself
# 
#   ps aux | grep -v grep | grep xxxxtest | REAPER_NOT_FILTER_OUT_GREP=1 /bin/bash bash/proc/reaper.sh
# 
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

trim() {
    local var="${*}"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "${var}"
}

function extractPidsFromText {
    local TEXT="${1}"

    PIDS="$(echo "${TEXT}" | awk '{ print $2 }')"

    if [ "${REAPER_NOT_FILTER_OUT_GREP}" != "" ]; then

        PIDS="$(echo "${PIDS}" | grep -v grep)"
    fi

    PIDS="$(trim "${PIDS}")"
}

function findDevFrontServerPid {
    CMD="${1}"

    ROW="$(eval "${CMD}")"

    echo -e "  executing: >${CMD}< found rows:\n  ${ROW:->not found<}"

    extractPidsFromText "${ROW}"

    if [ "${PIDS}" != "" ]; then
        echo "  executing: >${CMD}< pids: >$(echo -n "${PIDS}" | tr '\n' ',')<"
    fi
}

function collectPidsFromStdin {
    CMD="piped input"
    local STDIN_CONTENT
    STDIN_CONTENT="$(cat)"

    echo -e "  executing: >${CMD}< found rows:\n  ${STDIN_CONTENT:->not found<}"

    extractPidsFromText "${STDIN_CONTENT}"

    if [ "${PIDS}" != "" ]; then
        echo "  executing: >${CMD}< pids: >$(echo -n "${PIDS}" | tr '\n' ',')<"
    fi
}

function tryToKill {
    findDevFrontServerPid "${1}"

    tryToKillPIDS
}

function tryToKillPIDS {
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

# WARNING: 
# WARNING: ALWAYS REMEMBER TO START FROM:     ps aux | grep -v grep
# WARNING:                                             ^^^^^^^^^^^^ - THIS IS IMPORTANT BECAUSE IT WILL CAUSE ISSUE IF NOT ADDED
# WARNING: 

# echo -e "\n${0}: ============ attempt to kill --flag-to-help-filter-ps-aux-to-kill-group-of-processes ${PROJECT_NAME}: ============"
# tryToKill "ps aux | grep -v grep | grep \"\--flag-to-help-filter-ps-aux-to-kill-group-of-processes ${PROJECT_NAME}\""




if [ ! -t 0 ]; then
    collectPidsFromStdin
    if [ "${PIDS}" != "" ]; then
        tryToKillPIDS
    fi
fi
