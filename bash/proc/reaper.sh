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
# Also use NO_COLOR=1 to disable colors
# 
# 

# Color support - disabled when NO_COLOR env var is set and non-empty
# (intentionally not checking isatty because this script reads from stdin by design)
if [ -n "${NO_COLOR}" ]; then
    C_RESET=""
    C_DIM=""
    C_LABEL=""
    C_CMD=""
    C_PID=""
    C_ROWS=""
    C_OK=""
    C_WARN=""
    C_ERR=""
else
    C_RESET="\033[0m"
    C_DIM="\033[2m"
    C_LABEL="\033[1;36m"   # bold cyan  - script name / section headers
    C_CMD="\033[33m"        # yellow     - command / source label
    C_PID="\033[1;35m"      # bold magenta - pid values
    C_ROWS="\033[2;37m"     # dim white  - raw process rows
    C_OK="\033[1;32m"       # bold green - success
    C_WARN="\033[1;33m"     # bold yellow - warnings / skips
    C_ERR="\033[1;31m"      # bold red   - errors / failures
fi

echo -e "  ${C_LABEL}script reaper.sh:${C_RESET} "

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

    if [ "${REAPER_NOT_FILTER_OUT_GREP}" = "" ]; then

        TEXT="$(echo "${TEXT}" | grep -v grep)"
    fi

    PIDS="$(echo "${TEXT}" | awk '{ print $2 }')"

    PIDS="$(trim "${PIDS}")"
}

function findDevFrontServerPid {
    CMD="${1}"

    ROW="$(eval "${CMD}")"

    echo -e "  executing: ${C_CMD}>${CMD}<${C_RESET} found rows:\n${C_ROWS}  ${ROW:-${C_WARN}>not found<${C_RESET}}${C_RESET}"

    extractPidsFromText "${ROW}"

    if [ "${PIDS}" != "" ]; then
        echo -e "  executing: ${C_CMD}>${CMD}<${C_RESET} pids: ${C_PID}>$(echo -n "${PIDS}" | tr '\n' ',')< ${C_RESET}"
    fi
}

function collectPidsFromStdin {
    CMD="piped input"
    local STDIN_CONTENT
    STDIN_CONTENT="$(cat)"

    echo -e "  executing: ${C_CMD}>${CMD}<${C_RESET} found rows (raw, grep not filtered out yet):\n${C_ROWS}  ${STDIN_CONTENT:-${C_WARN}>not found<${C_RESET}}${C_RESET}"

    extractPidsFromText "${STDIN_CONTENT}"

    if [ "${PIDS}" = "" ]; then
        echo -e "  executing: ${C_CMD}>${CMD}<${C_RESET} ${C_WARN}no pids to kill${C_RESET}"
    else
        echo -e "  executing: ${C_CMD}>${CMD}<${C_RESET} pids: ${C_PID}>$(echo -n "${PIDS}" | tr '\n' ',')<${C_RESET}"
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

            echo -e "\n  ${C_WARN}skipping KILL_V2_EXCLUDE_PARENT_PID >${KILL_V2_EXCLUDE_PARENT_PID}<${C_RESET}\n"

            continue;
        fi

        if [ "${PID}" != "" ]; then
            if [[ ${PID} =~ ^[0-9]+$ ]]; then

                echo -e "  executing: ${C_CMD}>${CMD}<${C_RESET} attempt to kill ${C_PID}>${PID}<${C_RESET}"

                kill "${PID}"

                if [ "${WAIT}" != "" ]; then
                    sleep 1
                fi
            else
                echo -e "  executing: ${C_CMD}>${CMD}<${C_RESET} ${C_ERR}error: if it's not empty then it should be integer${C_RESET}"
            fi
        else

            echo -e "  executing: ${C_CMD}>${CMD}<${C_RESET} ${C_WARN}status: not found in the first place${C_RESET}"
        fi

    done <<< "${PIDS}"

    echo -e "  executing: ${C_CMD}>${CMD}<${C_RESET} find again after..."

    findDevFrontServerPid "${1}"
    if [ "${PIDS}" = "" ]; then

        echo -e "  executing: ${C_CMD}>${CMD}<${C_RESET} ${C_OK}status: successfully killed${C_RESET}"
    else

        echo -e "  executing: ${C_CMD}>${CMD}<${C_RESET} ${C_ERR}status: couldn't kill, pids >${PIDS}<${C_RESET}"

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

# echo -e "\n${0}: ============ attempt to kill --flag-to-help-filter-ps-aux-to-kill-group-of-processes ${PROJECT_NAME}: ============"
# tryToKill "ps aux | grep -v grep | grep \"\--flag-to-help-filter-ps-aux-to-kill-group-of-processes ${PROJECT_NAME}\""




if [ ! -t 0 ]; then
    collectPidsFromStdin
    if [ "${PIDS}" != "" ]; then
        tryToKillPIDS
    fi
fi
