
            
#!/usr/bin/env bash

# --- CONFIGURATION ---
SSH_USER="bob"
SSH_HOST="ssh-domain.com"
SSH_PORT="22"
REMOTE_DIR="/home/somwhereremote"
SOCKET_PATH="${HOME}/.ssh/roles_sock"
SSH_PASS="xxxx"
# ---------------------

S="\\"

PROJECT_DIR="$(pwd)"

if ! command -v fswatch >/dev/null 2>&1; then
  echo "❌ fswatch missing"
  echo "👉 brew install fswatch"
  exit 1
fi

if ! command -v sshpass >/dev/null 2>&1; then
  echo "❌ sshpass missing"
  echo ""
  echo "👉 Install:"
  echo "   macOS: brew install hudochenkov/sshpass/sshpass"
  echo "   Linux: sudo apt install sshpass"
  exit 1
fi

if [[ -z "${SSH_PASS}" ]]; then
  echo "❌ SSH_PASS is not set"
  echo "👉 export SSH_PASS='your_password'"
  exit 1
fi
# ---------------------------

# start SSH multiplexing
ssh -M -S "${SOCKET_PATH}" -fnNT \
  -p "${SSH_PORT}" "${SSH_USER}@${SSH_HOST}"

fswatch -0 ./ | while read -d "" file; do
#   echo fswatch: "${file}"

  # Skip common ignored directories
  [[ "${file}" == */vendor/* ]] && continue
  [[ "${file}" == */node_modules/* ]] && continue
  [[ "${file}" == */.git/* ]] && continue

  # Convert ABSOLUTE → RELATIVE
  rel_path="${file#$PROJECT_DIR/}"
  REMOTE_PATH="${REMOTE_DIR}/${rel_path}"

  if [[ -e "${file}" ]]; then
    # prevent race-condition rsync on disappearing files
    [[ -f "${file}" || -d "${file}" ]] || continue

    echo "✅ File exists: ${file}"
    # --- FILE EXISTS: Sync it ---

    CMD="sshpass -p \"${SSH_PASS}\" rsync -az \
      -e \"ssh -p ${SSH_PORT} -S ${SOCKET_PATH}\" \
      \"${file}\" \
      \"${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}\""

  else
    echo "❌ File deleted: ${file}"
    # --- FILE DELETED LOCALLY: Remove remotely if it's a file ---
    # [ -f ... ] checks if it exists and is a regular file, then rm removes it.

    CMD="sshpass -p \"${SSH_PASS}\" ssh \
      -p ${SSH_PORT} -S ${SOCKET_PATH} \
      ${SSH_USER}@${SSH_HOST} \
      '[ -f \"${REMOTE_PATH}\" ] && rm \"${REMOTE_PATH}\"'"
  fi

  printf '%s\n\n' "  ${CMD}"
  eval "${CMD}"  

done