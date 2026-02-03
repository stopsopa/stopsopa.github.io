

set -e
set -x
export NODE_OPTIONS=""

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Read version from argument, default to "latest"
TS_VERSION_TO_INSTALL="${1:-latest}"
echo "Installing typescript version: ${TS_VERSION_TO_INSTALL}"

mkdir -p ~/ts_remove_me_later

cp "${DIR}/getAllFlags.js" ~/ts_remove_me_later/getAllFlags.js

cd ~/ts_remove_me_later
echo '{"type": "module"}' > package.json
rm -rf node_modules tsconfig.json
npm install "typescript@${TS_VERSION_TO_INSTALL}"

node node_modules/.bin/tsc --init  

TSVERSION="${DIR}/defaults/$(echo "ts_ver_$(node node_modules/.bin/tsc --version | sed 's/Version //; s/\./_/g')")"     
echo 'export {}' > index.ts
node node_modules/.bin/tsc --showConfig > showConfig.json
node getAllFlags.js getAllFlags.json

cd "${DIR}"

rm -rf "${TSVERSION}"
mkdir -p "${TSVERSION}"

cp ~/ts_remove_me_later/tsconfig.json "${TSVERSION}/tsconfig.json"
cp ~/ts_remove_me_later/showConfig.json "${TSVERSION}/showConfig.json"
cp ~/ts_remove_me_later/allDefaults.json "${TSVERSION}/allDefaults.json"

npm view typescript versions --json | grep -vE '(-dev|-beta|-rc|-insiders|-alpha)' > versions.json

cat <<EEE

  All good

EEE



