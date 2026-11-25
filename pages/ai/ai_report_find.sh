
find -P . -mindepth 1 -maxdepth 4 -type d -name node_modules -prune -o \
  -mindepth 2 -type d -name .git -print |
  awk '{sub(/\/\.git$/, ""); print}' |
  sort
