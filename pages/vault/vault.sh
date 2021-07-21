
# https://learn.hashicorp.com/tutorials/vault/getting-started-deploy?in=vault/getting-started#seal-unseal
# target directory where vault should be created
DIR="."
PORT="8202"
CLUSTERPORT="8203"
RELATIVEDBDIRPATH="db"
INITFILE="_init.txt"
UNSEALKEYSFILE="_unseal_keys.txt"
ROOTTOKENFILE="_root_token.txt"

exec 3<> /dev/null
function green {
    printf "\e[32m$1\e[0m\n"
}

function red {
    printf "\e[31m\n$1\e[0m\n\n"
}

function yellow {
    printf "\e[33m$1\e[0m\n"
}

function kill {
    ps aux | grep "vault server" | grep "_config.hcl" | grep -v grep
    ps aux | grep "vault server" | grep "_config.hcl" | grep -v grep | awk '{print $2}' | xargs kill
}

{ green "export VAULT_ADDR='http://127.0.0.1:${PORT}'"; } 2>&3

export VAULT_ADDR="http://127.0.0.1:${PORT}"

if [ "$1" = "kill" ]; then

    { green "killing server"; } 2>&3

    kill

    vault status

    set -e
    
    _exit 2> /dev/null
fi

if [ "$1" = "clean" ]; then

    { green "cleaning"; } 2>&3

    /bin/bash "$0" kill

    rm -rf db    
    rm -rf logs
    rm -rf "${INITFILE}"
    rm -rf "${ROOTTOKENFILE}"
    rm -rf "${UNSEALKEYSFILE}"

    ls -la

    set -e
    
    _exit 2> /dev/null
fi

if [ "$1" = "start" ]; then

# --------------------- start -------------------------- vvvv

vault --help 2> /dev/null

IS_VAULT_INSTALLED="$?"

REG="^[0-9]+$";

if ! [[ ${PORT} =~ ${REG} ]]; then

    { red "\nPORT (${PORT}) don't match regex ${REG}"; } 2>&3

    _exit 2> /dev/null
fi

if ! [[ ${CLUSTERPORT} =~ ${REG} ]]; then

    { red "\nCLUSTERPORT (${CLUSTERPORT}) don't match regex ${REG}"; } 2>&3

    _exit 2> /dev/null
fi

if [ "${IS_VAULT_INSTALLED}" != "0" ]; then

    { red "vault cli is not installed, visit: https://www.vaultproject.io/downloads"; } 2>&3

    _exit 2> /dev/null
fi

unset VAULT_TOKEN

cd "${DIR}"

{ green "entered directory '${DIR}'"; } 2>&3

if [ -f "_config.hcl" ]; then

    { green "_config.hcl already exist"; } 2>&3
else

    { green "creating _config.hcl"; } 2>&3

cat <<EOF > _config.hcl

storage "raft" {
    path    = "./${RELATIVEDBDIRPATH}"
    node_id = "node1"
}

# disable_mlock = true

listener "tcp" {
    address     = "127.0.0.1:${PORT}"
    tls_disable = "true"
}

api_addr = "http://127.0.0.1:${PORT}"
cluster_addr = "https://127.0.0.1:${CLUSTERPORT}"
ui = true

EOF

fi

if [ -d "${RELATIVEDBDIRPATH}" ]; then

    { green "directory ${RELATIVEDBDIRPATH} already exist"; } 2>&3
else

    { green "creating directory ${RELATIVEDBDIRPATH}"; } 2>&3

    mkdir -p "${RELATIVEDBDIRPATH}"

    if [ ! -d "${RELATIVEDBDIRPATH}" ]; then

        { red "can't create directory ${RELATIVEDBDIRPATH}"; } 2>&3

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

/bin/bash "$0" kill

{ green "starting server..."; } 2>&3

DBFILEEXIST="0"
if [ -f "${RELATIVEDBDIRPATH}/vault.db" ]; then
    
    DBFILEEXIST="1"    
fi

vault server -config=_config.hcl >> "${LOGFILE}" & disown

sleep 5

if [ "$(ps aux | grep vault | grep _config.hcl)" = "" ]; then

    { red "server crushed, last lines of log of the server ${LOGFILE}:"; } 2>&3

    tail -n 40 "${LOGFILE}"

    _exit 2> /dev/null
fi

if [ "${DBFILEEXIST}" = "0" ]; then

    { green "this is first server run, initialising database"; } 2>&3

    INIT="$(vault operator init)"

    echo "${INIT}" > "${INITFILE}"

cat <<EOF

--INIT---------------------------------- vvv
${INIT}
------------------------------------ ^^^

EOF

    cat "${INITFILE}" | grep "^Unseal Key [0-9]:" | awk '{ print $4 }' > "${UNSEALKEYSFILE}"

    cat "${INITFILE}" | grep "^Initial Root Token" | awk '{ print $4}' > "${ROOTTOKENFILE}"
fi

if [ -f "${UNSEALKEYSFILE}" ]; then

    { green "unsealing vault"; } 2>&3

    cat "${UNSEALKEYSFILE}" | xargs -I %% vault operator unseal %%

    vault status | grep Sealed

cat <<EOFF

cat <<EOF | xargs -I %% vault operator unseal %%
$(cat "${UNSEALKEYSFILE}")
EOF

EOFF


fi

ls -la

{ green "server running"; } 2>&3

cat <<EOF

tail -n 40 -f "${LOGFILE}"

http://0.0.0.0:${PORT}

root token: $(cat "${ROOTTOKENFILE}")

EOF

# --------------------- start -------------------------- ^^^^


else

cat <<EOF

/bin/bash $0 start
/bin/bash $0 kill
/bin/bash $0 clean

EOF

fi

