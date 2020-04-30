
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

set -e
set -x

(cd "$DIR" && node template.js)

