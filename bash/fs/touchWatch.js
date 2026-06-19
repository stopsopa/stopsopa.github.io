var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) =>
  function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
import fs from "node:fs";
import * as fsp from "node:fs/promises";
var require_touchWatch = __commonJS({
  "bash/fs/touchWatch.ts"() {
    const file = process.argv[2];
    const th = (msg) => new Error(`watch.ts error: ${msg}`);
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
      async (_curr, _prev) => {
        if (doTouch) {
          doTouch = false;
          const time = /* @__PURE__ */ new Date();
          await fsp.utimes(file, time, time).catch(async (err) => {
            if (err.code !== "ENOENT") {
              throw err;
            }
          });
          setTimeout(() => {
            doTouch = true;
          }, 80);
        }
      }
    );
  },
});
export default require_touchWatch();
