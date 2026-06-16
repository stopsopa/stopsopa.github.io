/**
 * Fluentbit seems to have problems with filesystem watch capabilities if its executed in docker container
 * because it have access to server output log file via volumes.
 * For some reason mounting directories from host machine to docker container does not
 * trigger watch event for processess watching files from inside container
 *
 * Therefore we are using this script to watch file on the host machine and "touching" it
 * it seems to solve the problem for process inside docker container.
 *
 * Process inside container (In this case fluentbit) is able to immediately detect change on server log file
 */
import fs, { type Stats } from "node:fs";
import * as fsp from "node:fs/promises";

const file = process.argv[2];

const th = (msg: string): Error => new Error(`watch.ts error: ${msg}`);

if (typeof file !== "string") {
  throw th("file to watch not specified");
}

if (!fs.lstatSync(file).isFile()) {
  throw th(`target '${file}' is not a file`);
}

let doTouch = true;

fs.watchFile(
  file,
  {
    interval: 50,
  },
  async (_curr: Stats, _prev: Stats): Promise<void> => {
    if (doTouch) {
      doTouch = false;

      const time = new Date();

      await fsp.utimes(file, time, time).catch(async (err: NodeJS.ErrnoException): Promise<void> => {
        // https://remarkablemark.org/blog/2017/12/17/touch-file-nodejs/#touch-file
        if (err.code !== "ENOENT") {
          throw err;
        }
      });

      setTimeout((): void => {
        doTouch = true;
      }, 80);
    }
  },
);
