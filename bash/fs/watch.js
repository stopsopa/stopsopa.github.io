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

const file = process.argv[2];

if (!fs.existsSync(file)) {
  throw new Error(`file ${file} doesn't exist`);
}

console.log(`waiting for changes in file ${file} ... (press any key to force restart)`);

fs.watch(file, function () {
  process.exit(0);
});

// Setup stdin to react to any keypress
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function (key) {
    // Ctrl+C or Ctrl+D pressed
    if (key === '\u0003' || key === '\u0004') {
      process.exit(130); 
    }
    // For any other key, exit with 2 to indicate manual interruption
    process.exit(2);
  });
} else {
  process.stdin.resume();
  process.stdin.on('data', function () {
    process.exit(2);
  });
}
