
# place this script somewhere in ~/ dir and run with "help" param, then follow instructions to register it as alias

_SHELL="$(ps "${$}" | grep "${$} " | grep -v grep | sed -rn "s/.*[-\/]+(bash|z?sh) .*/\1/p")"; # bash || sh || zsh
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    _PWD="$(pwd)"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    _PWD="$(pwd)"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    _PWD="$(pwd)"
    ;;
esac


_PWD="$(pwd)"

GIT=".git"

if [ ! -d "${GIT}" ]; then

  echo "directory ${GIT} doesn't exist";

  exit 1
fi

SCRIPT="${GIT}/lint.sh"

if [ "${1}" = "help" ]; then

  cat <<EEE

  Register it as an aliast by adding this line to ~/.bashrc or ~/.zshrc

  alias lint="/bin/bash ${_DIR}/lint.sh";

EEE

  exit 0
fi

if [ "${1}" = "create" ]; then

  if [ -f "${SCRIPT}" ]; then

    echo "script ${SCRIPT} already exist";

    exit 1
  else

    cat <<EEE > "${SCRIPT}"

set -e
set -x
if [ "\${1}" = "fix" ]; then
  yarn prettier --list-different .
else
  yarn prettier --write .
  yarn lint
fi
docker run --rm -v "\$(pwd)":/git godaddy/tartufo --output-dir /git/.tartufo --config /git/tartufo.toml scan-local-repo /git

EEE

    echo "script ${SCRIPT} created";
  fi

  exit 0;
fi

if [ ! -f "${SCRIPT}" ]; then

  echo -e "script ${SCRIPT} doesn't exist\nrun:\n\n    /bin/bash ${0} create\n\n";

  exit 1
fi

set -e

cat <<EEE

You might run it in two modes:

  /bin/bash ${SCRIPT}

  or

  /bin/bash ${SCRIPT} fix

EEE

/bin/bash ${SCRIPT}


