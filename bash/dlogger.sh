#!/bin/bash

# enable colors only when stdout is terminal or DLOGGERN_COLOR=true
if [ -t 1 ] || [ "${DLOGGERN_COLOR}" = "true" ]; then
  if [ "${1}" = "e" ]; then
    DLOGGER_COLOR="\033[31m"
  else
    DLOGGER_COLOR="\033[32m"
  fi
  DLOGGER_RESET="\033[0m"
else
  DLOGGER_COLOR=""
  DLOGGER_RESET=""
fi

if [ "${DLOGGERN}" = "" ]; then
  echo "dlogger.sh error: DLOGGERN is not defined, label >${2}<";
  exit 1
fi

# check if DLOGGERN match /^\d+$/
if ! [[ "${DLOGGERN}" =~ ^[0-9]+$ ]]; then
  echo "dlogger.sh error: DLOGGERN is not a number, label >${2}<";
  exit 1
fi



# DLOGGERN is a number and we have to exit 1 with error when $2 is of lenght smaller than DLOGGERN
if [ "${#2}" -gt "${DLOGGERN}" ]; then
  echo "dlogger.sh error: ${2} is of length ${#2} smaller than ${DLOGGERN}, label >${2}<";
  exit 1
fi

# pad with spaces on the right to length ${DLOGGERN}
DLOGGER_PAD="${2}"
while [ ${#DLOGGER_PAD} -lt ${DLOGGERN} ]; do
  DLOGGER_PAD="${DLOGGER_PAD} "
done

while IFS= read -r line; do
  printf '%b[%s %s%b %s%b]%b%s\n' \
    "${DLOGGER_COLOR}" \
    "$(date '+%Y-%m-%d %H:%M:%S')" \
    "${1}" \
    "${DLOGGER_RESET}" \
    "${DLOGGER_PAD}" \
    "${DLOGGER_COLOR}" \
    "${DLOGGER_RESET}" \
    "$line"
done

# full example how to use it: https://stopsopa.github.io/pages/bash/index.html?admin:password#prepend-date-to-each-stream-line


# cat <<EEE > dlogger.sh
# #!/bin/bash
# while IFS= read -r line; do
#   printf '[%s %s %s]%s\n' "\$(date '+%Y-%m-%d %H:%M:%S')" "\$1" "\$2" "\$line" 
# done
# EEE


# # then call
# rm -rf log.log | true

# node -e "
# const {EOL} = require('os');
# let k = 5;
# (function loop() {
#   if (k !== 0) {
#     setTimeout(loop, 1000);
#   }
#   process.stdout.write('stdout: ' + k + EOL);
#   process.stderr.write('stderr: ' + k + EOL);
#   k -= 1;
# }());
# " 1> >(/bin/bash dlogger.sh o devserver >> log.log) 2> >(/bin/bash dlogger.sh e devserver >> log.log)