// ROOT="$(pwd)"
// FILE="${ROOT}/ttt.txt"
// WATCHC="0"
// STATUS="0"
// while [ "${STATUS}" = "0" ]; do
//     WATCHC="$((WATCHC + 1))"
//     until [ -f "${FILE}" ]
//     do
//         echo "${0} ${WATCHC} log: waiting for ${FILE} to be created"
//         sleep 1
//     done
//     echo "MY ACTION ON MY FILE HERE ${WATCHC}"
// #   /bin/bash "${ROOT}/start.sh"
//     node "${ROOT}/bash/fs/watch.js" "${FILE}"
//     STATUS="${?}"
// #   /bin/bash "${ROOT}/stop.sh"
// done

/**
 * Above code works actually pretty well
 * - it will wait for file to be created - and triggers ACTION immediately
 *   in both cases: when file exist on start of after it will be created after delay
 *
 * - it will execut on each file change after
 * - and once file will be deleted it will wait for it to be created again to trigger ACTION again
 *
 */

const fs = require("fs");

if (!fs.existsSync(process.argv[2])) {
  throw new Error(`file ${process.argv[2]} doesn't exist`);
}

fs.watchFile(process.argv[2], function () {
  process.exit(0);
});
