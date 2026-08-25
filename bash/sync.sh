set -e

WEB="https://stopsopa.github.io" # https://stopsopa.github.io/bash/bash.tar.gz

if command -v wget >/dev/null 2>&1; then
    wget_sh() {
        local URL="${1}"
        local DESTINATION="${2}"

        wget -O "${DESTINATION}" "${URL}"
    }
elif command -v curl >/dev/null 2>&1; then
    wget_sh() {
        local URL="${1}"
        local DESTINATION="${2}"

        curl -L -o "${DESTINATION}" "${URL}"
    }
else
    echo "${0} error: neither wget nor curl is installed" >&2
    exit 1
fi

# see bash/require_cmd.sh
relative_path() {
    from=$1
    to=$2

    # Make FROM absolute.
    case "$from" in
        /*)
            ;;
        *)
            from=$(cd "$from" 2>/dev/null && pwd) || return 1
            ;;
    esac

    # Make TO absolute.
    case "$to" in
        /*)
            ;;
        *)
            to=$(cd "$(dirname "$to")" 2>/dev/null &&
                printf '%s/%s' "$(pwd)" "$(basename "$to")") || return 1
            ;;
    esac

    # Find common ancestor.
    common=$from

    while [ "$to" != "$common" ]; do
        case "$to" in
            "$common"/*)
                break
                ;;
        esac

        case "$common" in
            /)
                break
                ;;
            */*)
                common=${common%/*}
                ;;
            *)
                common=/
                ;;
        esac
    done

    # Count how many directories we need to go up from FROM.
    result=
    current=$from

    while [ "$current" != "$common" ]; do
        if [ -n "$result" ]; then
            result="../$result"
        else
            result=..
        fi

        case "$current" in
            /)
                break
                ;;
            */*)
                current=${current%/*}
                ;;
            *)
                current=/
                ;;
        esac
    done

    # Add the path from COMMON to TO.
    if [ "$to" != "$common" ]; then
        if [ "$common" = "/" ]; then
            remainder=${to#/}
        else
            remainder=${to#"$common"/}
        fi

        if [ -n "$remainder" ]; then
            if [ -n "$result" ]; then
                result="$result/$remainder"
            else
                result=$remainder
            fi
        fi
    fi

    if [ -n "$result" ]; then
        printf '%s\n' "$result"
    else
        printf '.\n'
    fi
}

TARGETDIR=""
function prepareDir {
  while true
  do
    TARGETDIR="$(openssl rand -hex 2)"

    echo "checking TARGETDIR >${TARGETDIR}<"

    if ! [ -d "${TARGETDIR}" ]; then

      echo "TARGETDIR >${TARGETDIR}< can be created"

      break;
    fi
  done

  mkdir "${TARGETDIR}"

  trap "rm -rf \"${TARGETDIR}\"" EXIT
}

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

DUMPFILE="$(relative_path "$(pwd)" "${_DIR}/bash.tar.gz" )"

HELP=1
if [ "${1}" = "dump" ]; then
    HELP=0

    FOUND="$(find bash -type f ! -path "$DUMPFILE" | sort)"

    rm -f "${DUMPFILE}"

    printf '%s\n' "${FOUND}" | tar -czf "${DUMPFILE}" -T -

    cat <<EEE

${0} output:
CREATED ${DUMPFILE} WITH >>
${FOUND}
<<

EEE

    ls -la ${DUMPFILE}

fi

if [ "${1}" = "pull" ]; then
    HELP=0

    if [ ! -d "bash" ]; then
      echo "${0} error: no ./bash directory found"
      exit 1
    fi

    LIST="$(find bash -type f ! -path "${DUMPFILE}" | sort)"

    prepareDir

    (
        cd "${TARGETDIR}"
        pwd

        echo wget_sh "${WEB}/bash/bash.tar.gz" "bash.tar.gz" 
        wget_sh "${WEB}/bash/bash.tar.gz" "bash.tar.gz" 

        tar -zxf bash.tar.gz
    )

    echo $'\033[0;32m\nbash.tar.gz extracted ok\033[0m'

    FAILED=()
    while IFS=$'\n' read -r LINE; do
    if mv "${TARGETDIR}/${LINE}" "${LINE}" 2>/dev/null; then
        echo "mv ${TARGETDIR}/${LINE} ${LINE}"
    else
        echo $'\033[0;31m'"mv ${TARGETDIR}/${LINE} ${LINE}"$'\033[0m'
        FAILED+=("${LINE}")
    fi
    done <<< "$LIST"

    # Print final summary: all good or list failed files
    if [ "${#FAILED[@]}" -eq 0 ]; then
        echo $'\033[0;32m\nall updated\033[0m'
    else
        echo $'\033[0;31m\nsome failed ('"${#FAILED[@]}"$'):\033[0m'
        for F in "${FAILED[@]}"; do
            echo $'\033[0;31m  '"${F}"$'\033[0m'
        done    
        echo ""
    fi

    if [ -t 0 ]; then
        printf "\n      Press Enter to continue\n"
        read
    fi
fi

if [ "${1}" = "pull-existing" ]; then
    HELP=0

    if [ ! -d "bash" ]; then
      echo "${0} error: no ./bash directory found"
      exit 1
    fi

    prepareDir

    (
        cd "${TARGETDIR}"
        pwd

        echo wget_sh "${WEB}/bash/bash.tar.gz" "bash.tar.gz" 
        wget_sh "${WEB}/bash/bash.tar.gz" "bash.tar.gz" 

        
    )

    tar -zxvf "${TARGETDIR}/bash.tar.gz" 

    echo $'\033[0;32m\nbash.tar.gz extracted ok\033[0m'

    if [ -t 0 ]; then
        printf "\n      Press Enter to continue\n"
        read
    fi

fi

if [ "${HELP}" = "1" ]; then

  cat <<EEE

    /bin/bash ${0} dump
        # to create local dump file: ${DUMPFILE}

    /bin/bash ${0} pull
        # to sync all local with remote

    /bin/bash ${0} pull-existing
        # to sync only these which exist locally

EEE

fi