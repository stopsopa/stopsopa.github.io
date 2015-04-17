#!/usr/bin/env bash


# Call like:
# /bin/bash .github/prune-node-modules.sh node_modules/vis-timeline/dist node_modules/vis-timeline/styles node_modules/easymde/dist
# 
# This script will:
# 1. Create a temporary directory
# 2. Move specified directories to temporary location
# 3. Clean node_modules completely
# 4. Restore moved directories
# 5. Remove temporary directory 

set -euo pipefail

SCRIPT_NAME=".github/prune-node-modules.sh"

# --- 1. Check openssl availability ---
openssl help 1> /dev/null 2> /dev/null || {
  echo "${SCRIPT_NAME} error: openssl is not installed"
  exit 1
}

# --- 2. Create unique temporary directory ---
while true; do
    TMPDIR="tmp-$(openssl rand -hex 4)"

    if [ ! -e "${TMPDIR}" ]; then
        # Cleanup function
        cleanup() {
            if [ -d "${TMPDIR}" ]; then
                echo "Cleaning up temporary directory: ${TMPDIR}"
                rm -rf "${TMPDIR}" || true
            fi
        }

        # Register trap before creating directory
        trap cleanup EXIT

        # Create temporary directory
        mkdir "${TMPDIR}"
        break
    fi
done

echo "Temporary directory created: ${TMPDIR}"

# --- 3. Validate arguments ---
if [ "$#" -eq 0 ]; then
    echo "${SCRIPT_NAME} error: no directories specified to keep"
    exit 1
fi

# --- 4. Move specified directories to temporary location ---
for path in "$@"; do
    if [ ! -d "${path}" ]; then
        echo "${SCRIPT_NAME} error: directory '${path}' does not exist"
        exit 1
    fi

    DEST="${TMPDIR}/${path%/*}"   # preserve relative structure
    mkdir -p "${DEST}"
    mv "${path}" "${DEST}/"
    echo "Moved ${path} → ${DEST}/"
done

# --- 5. Clean node_modules completely ---
if [ ! -d node_modules ]; then
    echo "${SCRIPT_NAME} error: node_modules directory does not exist"
    exit 1
fi

echo "Cleaning node_modules completely (including hidden files)"
find node_modules -mindepth 1 -exec rm -rf {} +

# --- 6. Restore moved directories ---
for path in "$@"; do
    SRC="${TMPDIR}/${path}"
    if [ -d "${SRC}" ]; then
        DEST_DIR="$(dirname "${path}")"
        mkdir -p "${DEST_DIR}"
        mv "${SRC}" "${DEST_DIR}/"
        echo "Restored ${SRC} → ${DEST_DIR}/"
    fi
done

echo "Done. Temporary directory will be removed automatically by trap."
