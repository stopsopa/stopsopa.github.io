
#
# Script to compile C source files.
#
# Examples:
#   /bin/bash c/compile.sh c/printenv/main.c
#   /bin/bash c/c.sh c/printenv/main.c
#   /bin/bash c/compile.sh c/printenv/main.c -Wall -O2
#
# Output path logic:
#   1. Reads first line of source file. If it matches "// compile <path>",
#      the output path is resolved relative to the source file directory.
#   2. Otherwise, defaults to the source file path without the .c extension.
#

# Validate source file argument
if [[ $# -lt 1 || -z "${1}" ]]; then
  echo "${0} error: missing source file argument =>${1}<="
  exit 1
fi

SRC_FILE="${1}"

if [[ ! -f "${SRC_FILE}" ]]; then
  echo "${0} error: source file not found =>${SRC_FILE}<="
  exit 1
fi

# Detect available C compiler (macOS / Linux)
COMPILER=""
if command -v clang >/dev/null 2>&1; then
  COMPILER="clang"
elif command -v gcc >/dev/null 2>&1; then
  COMPILER="gcc"
elif command -v cc >/dev/null 2>&1; then
  COMPILER="cc"
else
  echo "${0} error: no C compiler found (clang, gcc, cc)"
  exit 1
fi

# Determine source directory and default output binary path
SRC_DIR="$(dirname "${SRC_FILE}")"
DEFAULT_OUT="${SRC_FILE%.*}"

# Check first line for custom output destination: e.g. // compile bin/executable
FIRST_LINE="$(head -n 1 "${SRC_FILE}")"
TARGET_REL=""

if [[ "${FIRST_LINE}" == *"compile"* ]]; then
  CUSTOM_PATH="$(echo "${FIRST_LINE}" | sed -E -n 's/^[[:space:]]*\/\/[[:space:]]*compile[[:space:]:]+[[:space:]]*(.+)/\1/p' | sed -E -e 's/[[:space:]]+$//')"
  if [[ -n "${CUSTOM_PATH}" ]]; then
    TARGET_REL="${CUSTOM_PATH}"
  fi
fi

if [[ -n "${TARGET_REL}" ]]; then
  if [[ "${TARGET_REL}" == /* ]]; then
    OUT_FILE="${TARGET_REL}"
  else
    OUT_FILE="${SRC_DIR}/${TARGET_REL}"
  fi
else
  OUT_FILE="${DEFAULT_OUT}"
fi

# Ensure target directory exists
OUT_DIR="$(dirname "${OUT_FILE}")"
if [[ ! -d "${OUT_DIR}" ]]; then
  mkdir -p "${OUT_DIR}"
fi

# Compile program
echo "Compiling ${SRC_FILE} -> ${OUT_FILE} (${COMPILER})..."
if ! "${COMPILER}" "${SRC_FILE}" -o "${OUT_FILE}" "${@:2}"; then
  echo "${0} error: compilation failed for =>${SRC_FILE}<="
  exit 1
fi
