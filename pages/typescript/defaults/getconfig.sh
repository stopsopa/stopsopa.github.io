

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

mkdir -p ~/ts_remove_me_later

cd ~/ts_remove_me_later
echo "{}" > package.json
rm -rf node_modules tsconfig.json
npm install typescript
node node_modules/.bin/tsc --init     
TSVERSION="${DIR}/defaults/$(echo "ts_ver_$(node node_modules/.bin/tsc --version | sed 's/Version //; s/\./_/g')")"     
echo 'export {}' > index.ts
node node_modules/.bin/tsc --showConfig > tsconfig_default.json

cd "${DIR}"

mkdir -p "${TSVERSION}"

cp ~/ts_remove_me_later/tsconfig.json "${TSVERSION}/tsconfig.json"
cp ~/ts_remove_me_later/tsconfig_default.json "${TSVERSION}/tsconfig_default.json"



