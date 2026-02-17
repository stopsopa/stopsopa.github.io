
# Usually it's good idea to execute it after /bin/bash scripts/uglify.sh

# Finds all *.template.html and process them to *.rendered.html in the same location
# <%url pages/bookmarklets/jira-create.uglify.min.js %>
# <%inject pages/bookmarklets/periscope.uglify.js %>

# /bin/bash scripts/template.sh
# /bin/bash scripts/template.sh pages/js/popper/html-vanilla/index.template.html

# export NODE_OPTIONS="" 

set -e

if [ "$1" = "" ]; then
  find . -type d -name 'node_modules' -prune -o -type f -name '*.template.html' -print \
    | SILENT=true /bin/bash ts.sh scripts/template.v2.ts
else
  echo "${1}" \
    | SILENT=true /bin/bash ts.sh scripts/template.v2.ts
fi