

# 
# call directly
#   /bin/bash bash/enter_esc.sh
# to test
# 
# but generally this script is designed to be used:
#   source bash/enter_esc.sh
# 

GRAY=$'\033[38;5;244m'
BLACK=$'\033[30m'
RED=$'\033[31m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
BLUE=$'\033[34m'
MAGENTA=$'\033[35m'
CYAN=$'\033[36m'
WHITE=$'\033[37m'
BOLD=$'\033[1m'
REVERSE=$'\033[7m'
RESET=$'\033[0m'

BG_BLACK=$'\033[40m'
BG_RED=$'\033[41m'
BG_GREEN=$'\033[42m'
BG_YELLOW=$'\033[43m'
BG_BLUE=$'\033[44m'
BG_MAGENTA=$'\033[45m'
BG_CYAN=$'\033[46m'
BG_WHITE=$'\033[47m'

function enter {
    echo "${BG_GREEN}"
    printf '\n Press any key to continue (Esc to exit)...\n';old=$(stty -g);stty -icanon -echo
    IFS= read -r -n1 k 2>/dev/null||IFS= read -r k;stty "$old"
    echo "${RESET}"
    if [ "$k" = "$(printf '\033')" ]; then
        exit 0;
    fi
}

function esc {
    echo "${BG_RED}"
    printf '\n  Press Enter to continue (any other key exits)...\n';old=$(stty -g);stty -icanon -echo
    IFS= read -r -n1 k 2>/dev/null||IFS= read -r k;stty "$old"
    echo "${RESET}"
    if [ -n "$k" ]; then
        exit 0;
    fi
}

# WARNING: that only works for bash - the condition
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    cat <<EEE

    try enter
EEE

    enter

    cat <<EEE

    try esc
EEE

    esc

    cat <<EEE

    continue...

EEE

fi