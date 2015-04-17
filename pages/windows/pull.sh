
# current shell name reliably
_SHELL="$(ps "${$}" | grep "${$} " | grep -v grep | sed -rn "s/.*[-\/]+(bash|z?sh) .*/\1/p")"; # bash || sh || zsh
case ${_SHELL} in
  zsh)
    DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    _0="$( basename "${(%):-%N}" )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    _PWD="$(pwd)"
    ;;
  sh)
    DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _0="$( basename "${0}" )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    _PWD="$(pwd)"
    ;;
  *)
    DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _0="$( basename "${BASH_SOURCE[0]}" )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    _PWD="$(pwd)"
    ;;
esac

node -v 2>&1 > /dev/null

if [ "${?}" != "0" ]; then

  echo "${0} error: node is not installed"

  exit 1
fi

if [ "${?}" != "0" ]; then

  echo "${0} error: sshh is not installed"

  exit 1
fi

PULLJS="${DIR}/pull.js"

if [ ! -f "${PULLJS}" ]; then

  cat <<EEE > ${PULLJS}
if (typeof process.argv[2] !== "string") {
  throw new Error(\`process.argv[1] is not a string - provide github repo to pull\`);
}

let repo = process.argv[2];

const reg = /^git@(github\.(com|secureserver\.net)|bitbucket\.org)/;

if (!reg.test(repo)) {
  throw new Error(\`repo '\${repo}' don't match regex '\${reg}'\`);
}

repo = repo.replace(/:/g, "/").split("/");

const name = repo.pop().replace(/^(.*?)(\.git)?\$/, "\$1");

const project = repo.pop().toUpperCase();

const dir = \`\${project}__\${name}\`;

process.stdout.write(dir);
EEE

fi

function clone() {

  ENDDIR="$(node "${PULLJS}" "${1}")";

  PDIR2="${DIR}/${ENDDIR}/${ENDDIR}"

  if [ -d "${PDIR2}/.git" ]; then

    echo "Directory "${PDIR2}" already exist"

    return 0
  fi

  (
    mkdir -p "${PDIR2}"

    cd "${PDIR2}"

    echo "git clone $1 ."

    git clone "$1" .
  )
}

clone git@github.com:stopsopa/c.git stopsopa

clone git@github.com:stopsopa/cpp.git stopsopa

