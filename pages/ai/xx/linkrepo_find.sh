#
# Default list of directories to choose from for pages/ai/xx/linkrepo.sh (ai linkrepo):
# all git repositories (directories with .git directory in it) found in current directory
# up to 3 levels deep, absolute paths, one per line, sorted.
#
#   [cwd]/repo/.git                   -> [cwd]/repo
#   [cwd]/group/repo/.git             -> [cwd]/group/repo
#   [cwd]/group/subgroup/repo/.git    -> [cwd]/group/subgroup/repo
#
# node_modules directories are not searched.
# Found repository is not searched deeper (.git is not entered, but repositories nested
# in other repository are still found if they fit in the depth limit).
# Only .git which is a directory counts: worktrees and submodules (.git is a file there) are not listed.
#
# Executed by linkrepo.sh with current directory = WORKSPACE_DIR,
# used when env var WORKSPACE_DIR_LIST is not defined.
# Copy and change it (e.g. -maxdepth 3 for layout [group]/[repository] only)
# and point WORKSPACE_DIR_LIST to the copy to get different list.
#
# Usage:
#   cd "${WORKSPACE_DIR}"
#   /bin/bash /path/to/pages/ai/xx/linkrepo_find.sh
#
find -P "$(pwd)" -mindepth 2 -maxdepth 4 -type d \( -name node_modules -prune -o -name .git -print -prune \) |
  awk '{sub(/\/\.git$/, ""); print}' |
  sort
