DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# add --watch flag for dev mode

set -e

if [ ! -f ".env" ]; then
  
  echo "${0} error: file .env doesn't exist"

  exit 1
fi

source ".env"

if [ ! -f ".env.sh" ]; then
  
  echo "${0} error: file .env doesn't exist"

  exit 1
fi

eval "$(/bin/bash bash/exportsource.sh ".env")"

source ".env.sh"

export NODE_NO_WARNINGS=1

# add to gitignore /coverage/
# require ts-resolver.js
# require node-suppress-warning.js
# require node.config.json

if [[ "${CHECK}" != "false" ]]; then
  if [ -z "${SILENT}" ]; then
    cat <<EEE

  Type-checking ...

EEE
    NODE_OPTIONS="" "${DIR}/node_modules/.bin/tsc" -p "${DIR}"
  else
    # if SILENT is present, only show output if tsc fails
    TSC_OUT=$(NODE_OPTIONS="" "${DIR}/node_modules/.bin/tsc" -p "${DIR}" 2>&1) || {
      TSC_RET=$?
      printf "%s\n" "$TSC_OUT"
      exit $TSC_RET
    }
  fi
fi

NODE_CMD=(node --experimental-config-file="${DIR}/node.config.json" --experimental-loader="${DIR}/ts-resolver.js" --import "file://${DIR}/node-suppress-warning.js")

if [[ "${@}" == *"--test"* ]]; then

  rm -rf "${DIR}/coverage"
  # without c8 ... - test will work like nothing happened but coverage directory won't be created
  # yarn add -D c8

  REPORTERS=(--reporter=lcov --reporter=html --reporter=text)

  if [ -n "${SILENT}" ]; then
    REPORTERS=(--reporter=lcov --reporter=html)
  fi

  # only allow node to be attached to debugger, not npx or c8
  # https://github.com/bcoe/c8/issues/136#issuecomment-680456108
  # also reseting NODE_OPTIONS to empty string for wrapper c8 process but forwarding it as is to the main testing process
  NODE_OPTIONS="" npx c8 "${REPORTERS[@]}" \
    env NODE_OPTIONS="${NODE_OPTIONS}" \
    "${NODE_CMD[@]}" "${@}"
else
  "${NODE_CMD[@]}" "${@}"
fi
