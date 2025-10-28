
_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    _0="$( basename "${(%):-%N}" )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    _PWD="$(pwd)"
    ;;
  sh)
    # be carefull this will not work when sourcing this file in sh shell
    # will though work when called /bin/sh my_script.sh from any shell
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _0="$( basename "${0}" )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    _PWD="$(pwd)"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _0="$( basename "${BASH_SOURCE[0]}" )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    _PWD="$(pwd)"
    ;;
esac

trimLeft() {
  local str="$1"
  local trim_char="$2"
  while [[ $str == $trim_char* ]]; do
    str="${str#$trim_char}"
  done
  echo "$str"
}

set +e

# function stop {
#     if [ "${_BINARY}" = "/bin/zsh" ]; then
#     read -sk
#     else
#     read -n 1
#     fi
# }

# export NODE_OPTIONS=""

REVERSE=$'\e[7m'
RESET=$'\e[0m'

_PWD="$(pwd)"

trim() {
    local var="${*}"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "${var}"
}

XX_GENERATED=".git/xx_generated.sh"

SETUP_FILE=".git/xx.cjs"

if [ "${1}" = "--help" ]; then
    cat <<EEE
    
    WARNING: FOR USING xx --lock first register .gitignore_local
        git config core.excludesFile .git/.gitignore_local
        touch .git/.gitignore_local
        gits add .git/.gitignore_local

        cat .git/config 

--help - this help page
--gen  - just generate file after picking up command
--init - init file ${SETUP_FILE}

--copy - just copy files from .git/xxlockdir
--lock - copy and lock files from .git/xxlockdir
    --lock debug
--unlock - git checkout files from .git/xxlockdir and unlock them
    above works with
    gits lock [path to files to add]

    https://stopsopa.github.io/viewer.html?file=xx.cjs

global config path:
    ${_DIR}/global-setup.cjs

gits:
    "xx.cjs::\${GITSTORAGETARGETDIR}/xx.cjs"

EEE

return 0
fi


function run {

if [ "${1}" = "--lock" ] || [ "${1}" = "--unlock" ] || [ "${1}" = "--copy" ]; then

    if [ "${1}" = "--copy" ]; then  
        /bin/bash "${0}" --unlock     
    fi

cat <<EEE

    MODE: ${1};

EEE

    LOCKDIR=".git/xxlockdir"

    if [ ! -d "${LOCKDIR}" ]; then

        cat <<EEE
        
        ${0} error: directory '${LOCKDIR}' doesn't exist"

        mkdir -p "${LOCKDIR}"

EEE
        return 1
    fi

    cd "${LOCKDIR}"

    LIST="$(find . -type f)"

    cd "${_PWD}"

    if [ "${LIST}" = "" ]; then

cat <<EEE

nothing found in ${LOCKDIR}

EEE
    else           
        CHANGED=""
        GITIGNORE="" 
        COUNT="$(echo "${LIST}" | wc -l)"
        COUNT="$(trim "${COUNT}")"
        I="0"
        while read -r xxx
        do        
            xxx="$(trimLeft "${xxx}" ".")"
            xxx="$(trimLeft "${xxx}" "/")"

            REASON="" 

            # basename and file extension
            PD="$(dirname "${xxx}")"
            PB="$(basename "${xxx}")"
            EXTENSION="${PB##*.}"
            FILENAME="${PB%.*}"
            if [ "${FILENAME}" = "" ]; then
                FILENAME="${PB}"
                EXTENSION=""
            fi
            if [ "${FILENAME}" = "${PB}" ]; then
                EXTENSION=""
            fi

            # echo "PD=${PD}"
            # echo "PB=${PB}"
            # echo "EXTENSION=${EXTENSION}"
            # echo "FILENAME=${FILENAME}"

            if [ "${1}" = "--copy" ]; then           

                mkdir -p "${PD}"

                STATUS="0"

                # check if file is tracked by git
                if git ls-files --error-unmatch "${xxx}" &>/dev/null; then
                    # check if file is changed in comparison to last commited state
                    git --no-pager diff --exit-code "${xxx}" 1> /dev/null 2> /dev/null   

                    STATUS="${?}"
                    if [ "${STATUS}" != "0" ]; then
                        REASON="DIFF : "
                    fi
                else
                    if [ -f "${xxx}" ]; then
                        diff "${LOCKDIR}/${xxx}" "${xxx}"

                        STATUS="${?}"
                        if [ "${STATUS}" != "0" ]; then
                            REASON="EXIST: "
                        fi
                    fi
                fi

                if [ "${STATUS}" = "0" ]; then

                    echo cp "${LOCKDIR}/${xxx}" "${xxx}"
                    
                    cp "${LOCKDIR}/${xxx}" "${xxx}"
                else
                    echo ADDING3 "reason>${REASON}<" ">${xxx}<"
                    CHANGED="$(echo -e "${CHANGED}\n${REASON}${xxx}")"
                fi
            fi

            if [ "${1}" = "--lock" ]; then

                mkdir -p "${PD}"

                STATUS="0"

                # check if file is tracked by git
                if git ls-files --error-unmatch "${xxx}" &>/dev/null; then
                    # echo "file ${xxx} is tracked"
                    SWITCH="0"
                    # check if file is already on the list of assume-unchanged, then I will have to unlist it temporarly below and mark list it back
                    if git ls-files -v | grep "^h " | grep "${xxx}"; then
                        SWITCH="1"                    
                    fi
                    # echo "file SWITCH>${SWITCH}<"
#                     if [ "${xxx}" = "./config/sensitive/sensitive-config.json" ]; then
#                     cat <<EEE

# git ls-files -v | grep "^h " | grep "${xxx}"
# >$(git ls-files -v )<

# EEE
#                     fi

                    if [ "${SWITCH}" = "1" ]; then
                        # echo 'unlock assume unchanded'
                        git update-index --no-assume-unchanged "${xxx}" 1> /dev/null 2> /dev/null       
                    fi

                    # check if file is changed in comparison to last commited state
                    git --no-pager diff --exit-code "${xxx}" 1> /dev/null 2> /dev/null   

                    STATUS="${?}"
                    # echo "git --no-pager diff --exit-code ${xxx}>${STATUS}< >>$(git  diff  "${xxx}")<<"
                    # diff "${LOCKDIR}/${xxx}" "${xxx}"
                    if [ "${STATUS}" != "0" ]; then
                        REASON="DIFF : "
                    fi

                    if [ "${SWITCH}" = "1" ]; then
                        # echo 'lock assume unchanded'
                        git update-index --assume-unchanged "${xxx}" 1> /dev/null 2> /dev/null  
                    fi
                else
                    # echo "file ${xxx} is NOT tracked"
                    if [ -f "${xxx}" ]; then
                        diff "${LOCKDIR}/${xxx}" "${xxx}"

                        STATUS="${?}"
                        if [ "${STATUS}" != "0" ]; then
                            REASON="EXIST: "
                        fi
                    fi
                fi

                if [ "${STATUS}" = "0" ]; then

                    echo cp "${LOCKDIR}/${xxx}" "${xxx}"

                    cp "${LOCKDIR}/${xxx}" "${xxx}"

                    git update-index --assume-unchanged "${xxx}" 1> /dev/null 2> /dev/null

                    if [ "${?}" != "0" ]; then
                        GITIGNORE="$(echo -e "${GITIGNORE}\n${xxx}")"
                    fi

                    if [ "${2}" != "" ]; then

                        cat <<EEE

cp "${LOCKDIR}/${xxx}" "${xxx}"
git update-index --assume-unchanged "${xxx}"
EEE
                    fi
                else
                    echo ADDING2 "reason>${REASON}<" ">${xxx}<"
                    CHANGED="$(echo -e "${CHANGED}\n${REASON}${xxx}")"
                fi
            fi

            if [ "${1}" = "--unlock" ]; then
                STATUS="0"

                TRACKED="0"

                if git ls-files --error-unmatch "${xxx}" &>/dev/null; then
                    TRACKED="1"
                fi

                if [ -f "${xxx}" ]; then
                    diff "${LOCKDIR}/${xxx}" "${xxx}" 1> /dev/null 2> /dev/null
                    STATUS="${?}"
                    REASON="DIFF : "
                fi

                git update-index --no-assume-unchanged "${xxx}" 1> /dev/null 2> /dev/null           

                if [ "${STATUS}" = "0" ]; then
                    git checkout "${xxx}" 1> /dev/null 2> /dev/null    

                    if [ "${?}" != "0" ]; then
                        echo rm "${xxx}"
                        rm "${xxx}" 1> /dev/null 2> /dev/null    
                    fi
                    if [ "${2}" != "" ]; then
                        
                        echo "git checkout \"${xxx}\""
                    fi
                else
                    echo ADDING ">${xxx}<"
                    CHANGED="$(echo -e "${CHANGED}\n${xxx}")"
                fi
            fi

        done <<< "${LIST}"

        if [ "${1}" = "--lock" ] || [ "${1}" = "--copy" ]; then
            if [ "${CHANGED}" != "" ]; then
        cat <<EEE
${REVERSE}
${0} error: 

        DIFF : git detected differences 
        EXIST: file exist but is different
${CHANGED}
${RESET}
EEE

return 1
            fi

            if [ "${1}" = "--copy" ]; then
                return 0
            fi
        fi

        if [ "${1}" = "--unlock" ]; then
            if [ "${CHANGED}" != "" ]; then
        cat <<EEE
${REVERSE}
${0} error: 
files with differences which were not reverted:
${CHANGED}
${RESET}

    make sure you are using custom global gitignore:
        cat .git/config 

        git config core.excludesFile .git/.gitignore_local        
        touch .git/.gitignore_local
        gits add .git/.gitignore_local

EEE
return 1
            fi

            return 0
        fi

        COREEXCLUDESFILE="$(git config --get core.excludesFile)"

        RESULT="$(NODE_OPTIONS="" node "${_DIR}/xx.lock.gits-update-config.node.bundled.gitignored.cjs" "${_PWD}" ".git/gitstorage-config.sh" ".git/.gitignore_local" "${GITIGNORE}" "${COREEXCLUDESFILE}")"

        cat <<EEE
${RESULT}

EEE

    fi

    return 0
fi

if [ "${1}" = "--init" ]; then

    if [ -e "${SETUP_FILE}" ]; then

        echo "${0} error: file >${SETUP_FILE}< already exist"

        return 1
    fi
    
    cp "${_DIR}/xx-template.cjs" "${SETUP_FILE}"

cat <<EEE
    file: 
        ${SETUP_FILE}
    generated
EEE

return 0
fi

LOAD_CONFIG=".git/xx.cjs";
LOAD_CONFIG1="${LOAD_CONFIG}"

if [ ! -f "${LOAD_CONFIG}" ]; then
    LOAD_CONFIG="xx.cjs";
    LOAD_CONFIG2="${LOAD_CONFIG}"

    if [ ! -d "./.git" ]; then
        
        eval XX_GENERATED="~/xx_generated.sh"    
    fi
fi

if [ ! -f "${LOAD_CONFIG}" ]; then
    
    eval USER_CONFIG="~/xx.cjs" 

    if [ "${USER_CONFIG}" = "" ]; then

        echo "${0} error: USER_CONFIG>${USER_CONFIG}< seems to be empty, and it shouldn't";

        return 1
    fi 

    if [ ! -f "${USER_CONFIG}" ]; then

        echo -n "${0} error: xx.cjs doesn't exist in any location normally searched:
${LOAD_CONFIG1}
${LOAD_CONFIG2}
~/xx.cjs
"
        return 1;
    fi

    XX_GENERATED="$(dirname "${USER_CONFIG}")/xx_generated.sh"

    LOAD_CONFIG="${USER_CONFIG}"
fi

# look for [jkjlv8589448939ijhfdjzxfklds8934u89439u843u834u089345]
# node "${_DIR}/xx.node.cjs" "${LOAD_CONFIG}" "${XX_GENERATED}" "${@}"
NODE_OPTIONS="" node "${_DIR}/xx.node.bundled.gitignored.cjs" "${LOAD_CONFIG}" "${XX_GENERATED}" "${@}"

CODE="${?}"
EXECUTEUSING_SOURCE="0"

if [ "${CODE}" = "55" ]; then
    EXECUTEUSING_SOURCE="1"
    CODE="0"
fi

# to fix dissapearing carret when inquirier.js interupted with ctrl+c
# https://unix.stackexchange.com/a/512630
tput cnorm

if [ "${CODE}" = "10" ]; then

    cat <<EEE   

    ${0} info: generating ${XX_GENERATED} success - no confirmation to execute

EEE

    exit ${CODE}
fi


if [ "${CODE}" != "0" ]; then

    if [ "${CODE}" = "130" ]; then
      echo "";
    else

        cat <<EEE    

    ${0} error: generating ${XX_GENERATED} failed

EEE
    fi
else    
    if [ "${1}" = "--gen" ]; then
    cat <<EEE
${0}: script generated >${XX_GENERATED}<, content: 
$(cat "${XX_GENERATED}")

EEE

    else

        # shift is needed to properly pass down parameters ${1}, ${2}, ${3} etc.
        if [ $# -gt 0 ]; then
            shift
        fi
        if [ "${EXECUTEUSING_SOURCE}" = "1" ]; then
            # echo 'source block'
            source "${XX_GENERATED}" "${@}"
            set +e
        else
            # echo 'exec block'    
            /bin/bash "${XX_GENERATED}" "${@}"
        fi
    fi
fi


}

run "${@}"

