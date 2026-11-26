#
# Default list of directories to choose from for pages/ai/xx/linkrepo.sh (ai linkrepo):
# all direct subdirectories of current directory, absolute paths, one per line, sorted.
#
# Executed by linkrepo.sh with current directory = WORKSPACE_DIR,
# used when env var WORKSPACE_DIR_LIST is not defined.
# Copy and change it (e.g. -mindepth 2 -maxdepth 2 for layout [group]/[repository])
# and point WORKSPACE_DIR_LIST to the copy to get different list.
#
# Usage:
#   cd "${WORKSPACE_DIR}"
#   /bin/bash /path/to/pages/ai/xx/linkrepo_find.sh
#
find "$(pwd)" -mindepth 1 -maxdepth 1 -type d | sort
