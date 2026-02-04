#
# always safe to run
#   /bin/bash pages/typescript/defaults/getconfig-some.sh
#

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

LIST=(
  5.9.3
  4.9.5
  3.9.10
)

LOG="${DIR}/getconfig-some.log"
rm -rf "${LOG}"

for VERSION in "${LIST[@]}"; do

cat <<EEE

-------------------------------------
ver: ${VERSION}

EEE
  /bin/bash "${DIR}/getconfig.sh" "$VERSION" 2>&1 | tee -a "${LOG}"
done