
_SHELL="$(ps "${$}" | grep "${$} " | grep -v grep | sed -rn "s/.*[-\/]+(bash|z?sh) .*/\1/p")"; # bash || sh || zsh
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

# https://learn.hashicorp.com/tutorials/vault/getting-started-deploy?in=vault/getting-started#seal-unseal
# target directory where vault should be created
_PORT="8200"
_CLUSTERPORT="8201"
_RELATIVEDBDIRPATH="db"
_INITFILE="_init.txt"
_UNSEALKEYSFILE="_unseal_keys.txt"
_ROOTTOKENFILE="_root_token.txt"
_BINARY="vault"
_CONFIGFILE="_config.hcl"

if [ "${VAULT_DIR}" != "" ]; then

    _DIR="${VAULT_DIR}"
fi

if [ "${VAULT_PORT}" != "" ]; then

    _PORT="${VAULT_PORT}"
fi

if [ "${VAULT_CLUSTERPORT}" != "" ]; then

    _CLUSTERPORT="${VAULT_CLUSTERPORT}"
fi

if [ "${VAULT_INITFILE}" != "" ]; then

    _INITFILE="${VAULT_INITFILE}"
fi

if [ "${VAULT_UNSEALKEYSFILE}" != "" ]; then

    _UNSEALKEYSFILE="${VAULT_UNSEALKEYSFILE}"
fi

if [ "${VAULT_ROOTTOKENFILE}" != "" ]; then

    _ROOTTOKENFILE="${VAULT_ROOTTOKENFILE}"
fi

if [ "${VAULT_BINARY}" != "" ]; then

    _BINARY="${VAULT_BINARY}"
fi

# FLAG="$(trim "${FLAG}")"

trim() {
    local var="${*}"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "${var}"
}

exec 3<> /dev/null
function green {
    printf "\e[32m${1}\e[0m\n"
}

function red {
    printf "\e[31m\n${1}\e[0m\n\n"
}

function yellow {
    printf "\e[33m${1}\e[0m\n"
}

function stop {

    { green "stopping server"; } 2>&3

    set -x

    BASE="$(basename "${_BINARY}")"

    ps aux | grep "${BASE} server" | grep "${_CONFIGFILE}" | grep -v grep

    ps aux | grep "${BASE} server" | grep "${_CONFIGFILE}" | grep -v grep | awk '{print $2}' | xargs kill

    set +x
}

export VAULT_ADDR="http://127.0.0.1:${_PORT}"

cd "${_DIR}"

if [ "${1}" = "endpoint" ]; then

  if [ -f "${_ROOTTOKENFILE}" ]; then

    echo -n "http://127.0.0.1:${_PORT}"

  else

    { red "\n${_ROOTTOKENFILE} doesn't exist yet"; } 2>&3
  fi

  exit 0
fi

if [ "${1}" = "token" ]; then

  if [ -f "${_ROOTTOKENFILE}" ]; then

    echo -n "$(trim "$(cat "${_ROOTTOKENFILE}")")"

  else

    { red "\n${_ROOTTOKENFILE} doesn't exist yet"; } 2>&3
  fi

  exit 0
fi

if [ "${1}" = "eval" ]; then

  if [ -f "${_ROOTTOKENFILE}" ]; then

cat <<EOF
# run
#     eval "\$(/bin/bash "${0}" eval)"
export VAULT_ADDR='http://127.0.0.1:${_PORT}';
export VAULT_TOKEN='$(cat "${_ROOTTOKENFILE}")';
echo VAULT_ADDR=${VAULT_ADDR}
echo VAULT_TOKEN=${VAULT_TOKEN}
${_BINARY} status
${_BINARY} token lookup
EOF

  else

    { red "\n${_ROOTTOKENFILE} doesn't exist yet"; } 2>&3
  fi

  exit 0
fi

echo "WORKING DIRECTORY ${_DIR}"

if [ "${1}" != "" ]; then

    echo "mode: ${1}"
fi

if [ "${1}" = "stop" ]; then

    stop

    eval ${_BINARY} status

    set -e
    
    _exit 2> /dev/null
fi

if [ "${1}" = "destroy" ]; then

    { green "destroying"; } 2>&3

    /bin/bash "${0}" stop

    rm -rf db    
    rm -rf logs
    rm -rf "${_CONFIGFILE}"
    rm -rf "${_INITFILE}"
    rm -rf "${_ROOTTOKENFILE}"
    rm -rf "${_UNSEALKEYSFILE}"

    ls -la

    set -e
    
    _exit 2> /dev/null
fi

if [ "${1}" = "start" ]; then

# --------------------- start -------------------------- vvvv

echo "::::::::: (cd '${_DIR}' && ${_BINARY} --help)"

$(${_BINARY} --help 2> /dev/null)

IS_VAULT_INSTALLED="${?}"

REG="^[0-9]+$";

if ! [[ ${_PORT} =~ ${REG} ]]; then

    { red "\nPORT (${_PORT}) don't match regex ${REG}"; } 2>&3

    _exit 2> /dev/null
fi

if ! [[ ${_CLUSTERPORT} =~ ${REG} ]]; then

    { red "\n_CLUSTERPORT (${_CLUSTERPORT}) don't match regex ${REG}"; } 2>&3

    _exit 2> /dev/null
fi

if [ "${IS_VAULT_INSTALLED}" != "0" ]; then

    { red "vault cli (${_BINARY}) is not installed, visit: https://www.vaultproject.io/downloads or for old version: https://releases.hashicorp.com/vault"; } 2>&3

    _exit 2> /dev/null
fi

unset VAULT_TOKEN

{ green "entered directory '${_DIR}'"; } 2>&3

if [ -f "${_CONFIGFILE}" ]; then

    { green "${_CONFIGFILE} already exist"; } 2>&3
else

    { green "creating ${_CONFIGFILE}"; } 2>&3

cat <<EOF > "${_CONFIGFILE}"

storage "raft" {
    path    = "./${_RELATIVEDBDIRPATH}"
    node_id = "node1"
}

disable_mlock = true

listener "tcp" {
    address     = "127.0.0.1:${_PORT}"
    tls_disable = "true"
}

api_addr = "http://127.0.0.1:${_PORT}"
cluster_addr = "https://127.0.0.1:${_CLUSTERPORT}"
ui = true

EOF

fi

if [ -d "${_RELATIVEDBDIRPATH}" ]; then

    { green "directory ${_RELATIVEDBDIRPATH} already exist"; } 2>&3
else

    { green "creating directory ${_RELATIVEDBDIRPATH}"; } 2>&3

    mkdir -p "${_RELATIVEDBDIRPATH}"

    if [ ! -d "${_RELATIVEDBDIRPATH}" ]; then

        { red "can't create directory ${_RELATIVEDBDIRPATH}"; } 2>&3

        _exit 2> /dev/null
    fi
fi


if [ -d "logs" ]; then

    { green "directory logs already exist"; } 2>&3
else

    { green "creating directory logs"; } 2>&3

    mkdir -p logs

    if [ ! -d "logs" ]; then

        { red "can't create directory logs"; } 2>&3

        _exit 2> /dev/null
    fi
fi

LOGFILE="logs/log-$(date +"%H-%m-%d_%H-%M-%S").log"

{ green "stopping server..."; } 2>&3

/bin/bash "${0}" stop

{ green "starting server..."; } 2>&3

DBFILEEXIST="0"
if [ -f "${_RELATIVEDBDIRPATH}/vault.db" ]; then
    
    DBFILEEXIST="1"    
fi

{ green "DBFILEEXIST ${DBFILEEXIST}"; } 2>&3

echo "::::::::: (cd '${_DIR}' && ${_BINARY} server -config="${_CONFIGFILE}")"

$(${_BINARY} server -config="${_CONFIGFILE}" >> "${LOGFILE}" & disown)

sleep 5

if [ "$(ps aux | grep vault | grep "${_CONFIGFILE}")" = "" ]; then

    { red "server crushed, last lines of log of the server ${_DIR}/${LOGFILE}:"; } 2>&3

    tail -n 40 "${LOGFILE}"

    _exit 2> /dev/null
fi

if [ "${DBFILEEXIST}" = "0" ]; then

    { green "this is first server run, initialising database"; } 2>&3

    echo "::::::::: (cd '${_DIR}' && ${_BINARY} operator init)"

    INIT="$(${_BINARY} operator init)"

    echo "${INIT}" > "${_INITFILE}"

cat <<EOF

--INIT---------------------------------- vvv
${INIT}
------------------------------------ ^^^

EOF

    cat "${_INITFILE}" | grep "^Unseal Key [0-9]:" | awk '{ print $4 }' > "${_UNSEALKEYSFILE}"

    cat "${_INITFILE}" | grep "^Initial Root Token" | awk '{ print $4 }' > "${_ROOTTOKENFILE}"
fi

export VAULT_TOKEN="$(cat "${_ROOTTOKENFILE}")"

if [ -f "${_UNSEALKEYSFILE}" ]; then

    { green "unsealing vault"; } 2>&3

    cat "${_UNSEALKEYSFILE}" | xargs -I %% ${_BINARY} operator unseal %%

    echo "::::::::: (cd '${_DIR}' && ${_BINARY} status)"

    ${_BINARY} status | grep Sealed

cat <<EOFF

cat <<EOF | xargs -I %% ${_BINARY} operator unseal %%
$(cat "${_UNSEALKEYSFILE}")
EOF

EOFF


fi

ls -la

{ green "server running"; } 2>&3

cat <<EOF

tail -n 40 -f "${_DIR}/${LOGFILE}"

http://127.0.0.1:${_PORT}

export VAULT_ADDR='http://127.0.0.1:${_PORT}'
export VAULT_TOKEN="$(cat "${_ROOTTOKENFILE}")"
${_BINARY} status

${_BINARY} secrets enable -path=test kv

${_BINARY} kv put test/hello target=world

EOF

# --------------------- start -------------------------- ^^^^


else

cat <<EOF

current vault version: $(${_BINARY} --version)

You might change some parameters at the beginning of this file, the default values are:
_DIR="${_DIR}"
_PORT="${_PORT}"
_CLUSTERPORT="${_CLUSTERPORT}"
_RELATIVEDBDIRPATH="${_RELATIVEDBDIRPATH}"
_INITFILE="${_INITFILE}"
_UNSEALKEYSFILE="${_UNSEALKEYSFILE}"
_ROOTTOKENFILE="${_ROOTTOKENFILE}"
_BINARY="${_BINARY}"

you might also define environment varialbes to override local variables used in the script 
export VAULT_DIR="${_DIR}"
export VAULT_PORT="${_PORT}"
export VAULT_CLUSTERPORT="${_CLUSTERPORT}"
export VAULT_RELATIVEDBDIRPATH="${_RELATIVEDBDIRPATH}"
export VAULT_INITFILE="${_INITFILE}"
export VAULT_UNSEALKEYSFILE="${_UNSEALKEYSFILE}"
export VAULT_ROOTTOKENFILE="${_ROOTTOKENFILE}"
export VAULT_BINARY="${_BINARY}"

You might also consider adding alias to ~/.bashrc

export VAULT_DIR="${_DIR}"
alias pvault='/bin/bash "${_DIR}/vault.sh"'

Then just run one of commands:

/bin/bash ${0} start
/bin/bash ${0} stop
/bin/bash ${0} destroy

or using alias

pvault start
pvault stop
pvault destroy
pvault endpoint
pvault token
pvault eval
eval "\$(pvault eval)"

EOF

STATUS="$(ps aux | grep -v grep | grep "${_CONFIGFILE}")"

if [ "${STATUS}" = "" ]; then

  { red "SERVER STATUS: NOT WORKING"; } 2>&3;
else

  { green "SERVER STATUS: WORKING\n${STATUS}"; } 2>&3;
fi

if [ -f "${_ROOTTOKENFILE}" ]; then

cat <<EOF

steps to connect local vault cli with vault server
export VAULT_ADDR='http://127.0.0.1:${_PORT}';
export VAULT_TOKEN='$(cat "${_ROOTTOKENFILE}")';
${_BINARY} status
${_BINARY} token lookup

every time you need this credentials just run

/bin/bash ${0}
or 
pvault

EOF

fi

fi
    


