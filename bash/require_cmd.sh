#!/usr/bin/env sh

# require_cmd: Checks if all given commands exist in PATH.
# If any are missing, lists them and exits with error.
#
# use:
# #!/usr/bin/env sh
# . ./utils.sh
# require_cmd node git ffmpeg
#

require_cmd() {
  missing=""

  for cmd in "$@"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      missing="$missing $cmd"
    fi
  done

  if [ -n "$missing" ]; then
    echo "Error: Missing required commands:$missing" >&2
    exit 1
  fi
}
