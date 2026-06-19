
            
#!/usr/bin/env bash

# --- CONFIGURATION ---
SSH_USER="bob"
SSH_HOST="ssh-domain.com"
SSH_PORT="22"
REMOTE_DIR="/home/somwhereremote"
SOCKET_PATH="${HOME}/.ssh/roles_sock"
SSH_PASS="xxxx"
# ---------------------

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

fswatch -0 ./ | while read -d "" file; do

  # Skip common ignored directories
  [[ "${file}" == */vendor/* ]] && continue
  [[ "${file}" == */node_modules/* ]] && continue
  [[ "${file}" == */.git/* ]] && continue

  # Convert ABSOLUTE → RELATIVE
  rel_path="${file#$PROJECT_DIR/}"
  REMOTE_PATH="${REMOTE_DIR}/${rel_path}"

  if [[ -e "${file}" ]]; then
    [[ -f "${file}" || -d "${file}" ]] || continue

    echo "✅ File exists: ${file}"

    CMD="sshpass -p \"${SSH_PASS}\" rsync -az \
      -e \"ssh -p ${SSH_PORT}\" \
      \"${file}\" \
      \"${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}\""

  else
    echo "❌ File deleted: ${file}"

    CMD="sshpass -p \"${SSH_PASS}\" ssh \
      -p ${SSH_PORT} \
      ${SSH_USER}@${SSH_HOST} \
      '[ -f \"${REMOTE_PATH}\" ] && rm \"${REMOTE_PATH}\"'"
  fi

  printf '%s\n\n' "  ${CMD}"
  eval "${CMD}"

done