
# script will return value of environment variable from .env under ${1} name variable
# /bin/bash bash/env.sh ../.env PROTECTED_MYSQL_HOST

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

if [ ${#} -lt 2 ]; then

    echo "${0} error: bash/env.sh: not enough arguments given"; 

    exit 1
fi

if [ ! -f "${1}" ]; then  # not exist (fnode, directory, socket, etc.)

    # https://stackoverflow.com/a/23622446
    echo "${0} error: under path ${1} there is no file";

    exit 1;
fi

source "${1}";

# better way of extracting than using eval:
# indirect expansion
# https://stackoverflow.com/a/8515492
# https://ss64.com/bash/syntax-expand.html
# g(Shell Parameter Expansion ${ })

# buuuuuu it' doesn't work with zsh :(, revert to eval ...

#echo -n "${!2}"

echo -n "$(eval echo "\$${2}")"
