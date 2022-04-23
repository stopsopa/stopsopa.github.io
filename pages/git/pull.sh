
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

node -v 2>&1 > /dev/null

if [ "${?}" != "0" ]; then

  echo "${0} error: node is not installed"

  exit 1
fi

/bin/bash ~/sshh.sh --help 2>&1 > /dev/null

if [ "${?}" != "0" ]; then

  echo "${0} error: ~/sshh.sh is not installed"

  exit 1
fi

PULLJS="${DIR}/pull.js"

if [ ! -f "${PULLJS}" ]; then

  cat <<EEE > ${PULLJS}
if (typeof process.argv[2] !== "string") {
  throw new Error(\`process.argv[1] is not a string - provide github repo to pull\`);
}

let repo = process.argv[2];

const reg = /^git@github/;

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

  if [ -d "${PDIR2}" ]; then

    echo "Directory "${PDIR2}" already exist"

    return 0
  fi

  (
    mkdir -p "${PDIR2}"

    cd "${PDIR2}"

    echo "git clone $1 ."

    git clone "$1" .

    if [ "${2}" != "" ]; then

      /bin/bash ~/sshh.sh -i $(/bin/bash ~/sshh.sh _ ${2})

      /bin/bash ~/sshh.sh --hook
    fi
  )
}

clone git@github.com:stopsopa/stopsopa.github.io.git stopsopa