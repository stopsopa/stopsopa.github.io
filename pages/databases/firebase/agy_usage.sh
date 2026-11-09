
# 
# /bin/bash pages/databases/firebase/agy_usage.sh
# 
# 

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%x}" )" && pwd -P )"
    _0="$( basename "${(%):-%N}" )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _0="$( basename "${0}" )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _0="$( basename "${BASH_SOURCE[0]}" )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    ;;
esac
_PWD="$(pwd)"

ROOT=""

GRAY="$(printf '\033[38;5;244m')"
BLACK="$(printf '\033[30m')"
RED="$(printf '\033[31m')"
GREEN="$(printf '\033[32m')"
YELLOW="$(printf '\033[33m')"
BLUE="$(printf '\033[34m')"
MAGENTA="$(printf '\033[35m')"
CYAN="$(printf '\033[36m')"
WHITE="$(printf '\033[37m')"
BOLD="$(printf '\033[1m')"
REVERSE="$(printf '\033[7m')"
RESET="$(printf '\033[0m')"

set -e

ROOT="$(cd "${_DIR}/../../.." && pwd)"

cd "${ROOT}"

export FB_SECTION=antigravity_cli
export NODE_OPTIONS=;

# I need to define some kind of map here
# "Gemini Models" from pages/databases/firebase/agy_usage.json is related to key "Gemini%203%2E8%20Flash" in the firebase
# "Claude and GPT models" from pages/databases/firebase/agy_usage.json is related to key "Claude%20Sonnet%204%2E6%20(Thinking)" in the firebase
MAPPING_JSON='{
    "Gemini Models": "Gemini%203%2E8%20Flash",
    "Claude and GPT models": "Claude%20Sonnet%204%2E6%20(Thinking)"
}'

agy_usage() {
    local session="agy-usage-$$"

    tmux new-session -d -s "$session" -x 120 -y 45 'agy'

    sleep 3

    tmux send-keys -t "$session" -l '/usage'
    tmux send-keys -t "$session" Enter

    sleep 3

    tmux capture-pane -t "$session" -p

    tmux kill-session -t "$session" 2>/dev/null
}

TOKEN_FILE=~/.gemini/antigravity-cli/antigravity-oauth-token

EMAIL=""

# Try primary method: extract email from oauth token file
if [[ -f "${TOKEN_FILE}" ]]; then
    EMAIL="$(jq -r '.id_token_email' "${TOKEN_FILE}" | tr -d '\n')"
else
    # Fallback: launch agy in tmux, capture /usage output and parse email from it
    AGY_USAGE="$(agy_usage)"

    # Email appears on a line like: "  xxxxxxxxxxxxx@gmail.com (Antigravity Starter Quota)"
    # Extract just the email address portion (before the space and parenthetical)
    EMAIL="$(echo "${AGY_USAGE}" | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' | head -1 | tr -d '\n')"
fi

if [[ -z "${EMAIL}" ]]; then
    echo "${0} error: EMAIL can't be extracted (token file =>TOKEN_FILE=${TOKEN_FILE}< does not exist and agy_usage fallback also failed)"
    exit 1
fi

cat <<EEE

Antigravity CLI account: ${BLUE}${EMAIL}${RESET}
https://console.firebase.google.com/
https://stopsopa.github.io/pages/services/antigravity/index.html

EEE

EMAIL_FIREBASE_KEY="$(echo -n "${EMAIL}" | tr '.' ',')"

# 1. Extract data as they are before update
BEFORE_DATA="$(NODE_OPTIONS= node --env-file .env pages/databases/firebase/cli.ts get "list/${EMAIL_FIREBASE_KEY}/models/" || echo "{}")"

# 2. Fetch agy usage and transform it dynamically using defined mapping and helper
PAYLOAD="$(agy --print "/usage" --output-format json | node "${_DIR}/agy_usage.helper.ts" transform_usage "${MAPPING_JSON}")"

# cat <<EEE

# cat <<DDD | NODE_OPTIONS= node --env-file .env pages/databases/firebase/cli.ts set "list/${EMAIL_FIREBASE_KEY}/models"
# ${PAYLOAD}
# DDD

# EEE

# 3. Push new data to Firebase
FIREBASE_PATH="$(echo "${PAYLOAD}" | NODE_OPTIONS= node --env-file .env pages/databases/firebase/cli.ts set "list/${EMAIL_FIREBASE_KEY}/models")"

# Path format: users/<firebase_user_email>/antigravity_cli/list/<cli_user_email>/models
IFS='/' read -r -a _PATH_PARTS <<< "${FIREBASE_PATH}"
if [ ${#_PATH_PARTS[@]} -ge 5 ]; then
    _PATH_PARTS[1]="${YELLOW}${_PATH_PARTS[1]}${RESET}"
    _PATH_PARTS[4]="${BLUE}${_PATH_PARTS[4]}${RESET}"
    ( IFS='/'; echo "${_PATH_PARTS[*]}" )
else
    echo "${FIREBASE_PATH}"
fi

# 4. Fetch updated data from Firebase
AFTER_DATA="$(NODE_OPTIONS= node --env-file .env pages/databases/firebase/cli.ts get "list/${EMAIL_FIREBASE_KEY}/models/")"

# 5. Present difference report in table format using console.table()
node "${_DIR}/agy_usage.helper.ts" print_diff "${BEFORE_DATA}" "${AFTER_DATA}"
