# main test runner for hardlink tests
#
# Purpose:
# Runs all hardlink test suites in bash/tests/hardlink/tests/[0-9]*/test.sh sequentially.
# Exits with 0 if all pass, or 1 if any fail.
#
# Usage:
# /bin/bash bash/tests/hardlink/test.sh

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

source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../self.sh"

echo "Starting hardlink test suite..."

set -e

echo "${REVERSE}tests/001/test.sh${RESET}"
/bin/bash "${_DIR}/tests/001/test.sh"

echo "${REVERSE}tests/002/test.sh${RESET}"
/bin/bash "${_DIR}/tests/002/test.sh"

echo "${REVERSE}tests/003/test.sh${RESET}"
/bin/bash "${_DIR}/tests/003/test.sh"

echo "${REVERSE}tests/004/test.sh${RESET}"
/bin/bash "${_DIR}/tests/004/test.sh"

echo "${REVERSE}tests/005/test.sh${RESET}"
/bin/bash "${_DIR}/tests/005/test.sh"

echo "${REVERSE}tests/006/test.sh${RESET}"
/bin/bash "${_DIR}/tests/006/test.sh"

echo "${REVERSE}tests/007/test.sh${RESET}"
/bin/bash "${_DIR}/tests/007/test.sh"

echo "${REVERSE}tests/008/test.sh${RESET}"
/bin/bash "${_DIR}/tests/008/test.sh"

echo "${REVERSE}tests/009/test.sh${RESET}"
/bin/bash "${_DIR}/tests/009/test.sh"

echo "${REVERSE}tests/010/test.sh${RESET}"
/bin/bash "${_DIR}/tests/010/test.sh"

echo "${REVERSE}tests/011/test.sh${RESET}"
/bin/bash "${_DIR}/tests/011/test.sh"

echo "${REVERSE}tests/012/test.sh${RESET}"
/bin/bash "${_DIR}/tests/012/test.sh"

echo "${REVERSE}tests/013/test.sh${RESET}"
/bin/bash "${_DIR}/tests/013/test.sh"

echo "${REVERSE}tests/014/test.sh${RESET}"
/bin/bash "${_DIR}/tests/014/test.sh"

echo "${REVERSE}tests/015/test.sh${RESET}"
/bin/bash "${_DIR}/tests/015/test.sh"

echo "${REVERSE}tests/016/test.sh${RESET}"
/bin/bash "${_DIR}/tests/016/test.sh"

echo "${REVERSE}tests/017/test.sh${RESET}"
/bin/bash "${_DIR}/tests/017/test.sh"

echo "${REVERSE}tests/018/test.sh${RESET}"
/bin/bash "${_DIR}/tests/018/test.sh"

echo "${REVERSE}tests/019/test.sh${RESET}"
/bin/bash "${_DIR}/tests/019/test.sh"

echo "${REVERSE}tests/020/test.sh${RESET}"
/bin/bash "${_DIR}/tests/020/test.sh"

echo "${REVERSE}tests/021/test.sh${RESET}"
/bin/bash "${_DIR}/tests/021/test.sh"

echo "${REVERSE}tests/022/test.sh${RESET}"
/bin/bash "${_DIR}/tests/022/test.sh"

echo "${REVERSE}tests/023/test.sh${RESET}"
/bin/bash "${_DIR}/tests/023/test.sh"

echo "${REVERSE}tests/024/test.sh${RESET}"
/bin/bash "${_DIR}/tests/024/test.sh"

echo "${REVERSE}tests/025/test.sh${RESET}"
/bin/bash "${_DIR}/tests/025/test.sh"

echo "${REVERSE}tests/026/test.sh${RESET}"
/bin/bash "${_DIR}/tests/026/test.sh"

echo "${REVERSE}tests/027/test.sh${RESET}"
/bin/bash "${_DIR}/tests/027/test.sh"

echo "${REVERSE}tests/028/test.sh${RESET}"
/bin/bash "${_DIR}/tests/028/test.sh"

echo "${REVERSE}tests/029/test.sh${RESET}"
/bin/bash "${_DIR}/tests/029/test.sh"

echo "${REVERSE}tests/030/test.sh${RESET}"
/bin/bash "${_DIR}/tests/030/test.sh"

echo "${REVERSE}tests/031/test.sh${RESET}"
/bin/bash "${_DIR}/tests/031/test.sh"

echo "${REVERSE}tests/032/test.sh${RESET}"
/bin/bash "${_DIR}/tests/032/test.sh"

echo "${REVERSE}tests/033/test.sh${RESET}"
/bin/bash "${_DIR}/tests/033/test.sh"

echo "${REVERSE}tests/034/test.sh${RESET}"
/bin/bash "${_DIR}/tests/034/test.sh"

echo "All hardlink tests passed!"
