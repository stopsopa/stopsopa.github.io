

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

ROOT="$DIR/../../"

set -e
set -x

if [ ! -e "$ROOT/node_modules" ]; then

    (cd "$ROOT" && yarn)
fi

node "$ROOT/node_modules/.bin/uglifyjs" "$DIR/jira-create.js" -o "$DIR/jira-create.min.js" -m -c toplevel,sequences=false --mangle-props

(cd "$DIR" && node template.js)
