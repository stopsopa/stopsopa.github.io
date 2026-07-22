/**
 * 
EXAMPLE: (see file watch.ts.test.sh next to this file)
Create bash script
(first prepare ignoring script https://stopsopa.github.io/gitignore_to_find)

while true; do

    # choose
    echo do something even on start before even trying to detect change

    while true; do
        LIST="$(NODE_OPTIONS= node bash/fs/watch.ts . --debug | NODE_OPTIONS="" node gitignore.js dev.sh.ignore)"

        if [ "${LIST}" != "" ]; then
        cat <<EEE
bash/fs/watch.ts detected change: >${LIST}<
EEE
          break;
        fi
    done

    # choose
    echo do something only AFTER we detect change with watch.ts
    
done


 */

/**
 *
 * More sophisticated example would be :
 * https://github.com/stopsopa/telazekah/blob/04209a0c68aef9c9187db2f8c742843dbc34d535/dev.server.watch.sh
 * used in :
 *   https://github.com/stopsopa/telazekah/blob/04209a0c68aef9c9187db2f8c742843dbc34d535/dev.sh#L79
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(process.argv[2] ?? ".");

let __filename = fileURLToPath(import.meta.url);
const projectRoot = path.dirname(path.dirname(path.dirname(__filename)));
__filename = path.relative(projectRoot, __filename);

const debug = process.argv.includes("--debug");
if (debug) {
  console.log(`${__filename} watching: ${root}`);
}

const watcher = fs.watch(
  root,
  {
    recursive: true,
  },
  (_event, filename) => {
    if (!filename) {
      return;
    }

    console.log(filename.toString());

    watcher.close();
    process.exit(0);
  }
);

// allow Ctrl+C
process.on("SIGINT", () => {
  watcher.close();
  process.exit(130);
});
