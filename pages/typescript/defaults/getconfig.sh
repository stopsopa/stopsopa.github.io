
# 
#  WARNING: for now disabled because you can't run this code for ts ver 7
#  pages/typescript/defaults/kkk.ts
# 
# 
# 
# run: 
#   /bin/bash pages/typescript/defaults/getconfig.sh
#   /bin/bash pages/typescript/defaults/getconfig.sh 5.9.3
#   /bin/bash pages/typescript/defaults/getconfig.sh 6.0.3   
#     ^- last version dumped, after that I've stopped using this script
#     because this annoncment:
#         https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
#         g(Daniel Rosenwasser Announcing TypeScript 7.0)
#     from that point in time
#          npm show typescript version
#     returns: 7.0.2
# 

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

./node_modules/.bin/tsc --init  

TSVERSION="${DIR}/defaults/$(./node_modules/.bin/tsc --version | sed 's/Version //; s/\./_/g')"     
echo 'export {}' > index.ts
./node_modules/.bin/tsc --showConfig > showConfig.json
node getAllFlags.js getAllFlags.json

cd "${DIR}"

rm -rf "${TSVERSION}"
mkdir -p "${TSVERSION}"

cp ~/ts_remove_me_later/tsconfig.json "${TSVERSION}/tsconfig.json"
cp ~/ts_remove_me_later/showConfig.json "${TSVERSION}/showConfig.json"

npm view typescript versions --json | grep -vE '(-dev|-beta|-rc|-insiders|-alpha)' > versions.json

find defaults -type f | tee list.txt

cat <<EEE

  All good

EEE



