
# https://unix.stackexchange.com/a/79065

# script will properly export variables defined in .env file, where normally they are not prefixed with "export" keyword
#
# USAGE:

# override mode - false (default) - variables already present in the environment (even empty) are left alone
# eval "$(/bin/bash bash/exportsource.sh .env.test)"
#
# override mode - true
# eval "$(/bin/bash bash/exportsource.sh .env.test true)"
#
# eval "$(...)" hides exit code of this script, if you need to stop on error (e.g. missing file):
# ENVEXPORTS="$(/bin/bash bash/exportsource.sh .env.test)" || exit 1
# eval "${ENVEXPORTS}"
#
# tests: /bin/bash bash/tests/exportsource/test.sh
#
# the same thing implemented in node: bash/exportsource.ts
# difference: this script sources the file (so it is interpreted by bash: FOO=$BAR is expanded),
#             bash/exportsource.ts parses it with dotenv (nothing is executed)

# NOTE
# NOTE
# NOTE
# There is a way to do this natively
# WARNING: the problem with set -a is that it will override existing env vars
# if that is a problem then still use this script instead
#
# old_opts=$(set +o)
# set -a
# source .env
# eval "$old_opts"
#
# that will override though existing flags
# in order to not override:
#
# old_opts=$(set +o)
# while IFS='=' read -r key value; do
#   [[ $key =~ ^#.*$ || -z $key ]] && continue
#   [[ -z ${!key+x} ]] && export "$key=$value"
# done < .env
# eval "$old_opts"
#
# NOTE
# NOTE
# NOTE

# all variables are prefixed with ___ to not collide with variables defined in the sourced file

if [ "${1}" = "" ]; then

  echo "${0} error: .env file not specified - provide it in first arg" >&2

  exit 1
fi

if [ ! -f "${1}" ]; then

  echo "${0} error: file '${1}' doesn't exist" >&2

  exit 1
fi

if [ "${2}" != "" ] && [ "${2}" != "true" ] && [ "${2}" != "false" ]; then

  echo "${0} error: second arg (override mode) should be 'true', 'false' or not specified, it is '${2}'" >&2

  exit 1
fi

# find names of the variables defined in the file:
#   KEY=value
#   export KEY=value
# comments, empty lines and everything else is ignored

___REG='^[[:space:]]*(export[[:space:]]+)?([a-zA-Z_][a-zA-Z0-9_]*)='

___KEYS=()

while IFS= read -r ___LINE || [ "${___LINE}" != "" ]
do
  if [[ "${___LINE}" =~ ${___REG} ]]; then

    ___KEYS+=("${BASH_REMATCH[2]}")
  fi
done < "${1}"

# remember which of them are already present in the environment (before sourcing the file)
# printenv is used on purpose: it sees only exported variables and returns 0 also for empty one

___EXISTING=" "

for ___KEY in "${___KEYS[@]}"
do
  if printenv "${___KEY}" > /dev/null; then

    ___EXISTING="${___EXISTING}${___KEY} "
  fi
done

# source without slash in the path would search for the file in PATH first

# anything printed by the sourced file would be evaluated by the caller - send it to stderr

case "${1}" in
  */*) source "${1}" 1>&2 ;;
  *) source "./${1}" 1>&2 ;;
esac

___Q="'"

for ___KEY in "${___KEYS[@]}"
do
  if [ "${2}" != "true" ]; then

    case "${___EXISTING}" in
      *" ${___KEY} "*) continue ;;
    esac
  fi

  # not set after sourcing - it was not really a variable (e.g. line of multiline value)
  if [ "${!___KEY+x}" = "" ]; then

    continue
  fi

  ___VALUE="${!___KEY}"

  # single quotes, each ' in the value replaced with '\''
  # this way nothing in the value is interpreted when the output is evaluated
  printf "export %s='%s'\n" "${___KEY}" "${___VALUE//${___Q}/${___Q}\\${___Q}${___Q}}"
done

# materials to improve: https://gist.github.com/mihow/9c7f559807069a03e302605691f85572
