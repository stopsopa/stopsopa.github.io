/**
 * Extracting particular data piece from json given on stdin
 *
 * echo "... json" | node bash/node/json/get_from_stream.js format.tags.creation_time
 */

const path = require("path");

function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}

const get = function (source, key) {
  if (!key) {
    return source;
  }

  if (typeof key === "string" && key.indexOf(".") > -1) {
    key = key.split(/(?<!\\)\./);
  }

  if (!Array.isArray(key)) {
    key = [key];
  }

  key = key.map((s) => s.replace(/\\\./g, "."));

  let tmp = source,
    k;

  while ((k = key.shift())) {
    try {
      if (key.length) {
        tmp = tmp[k];

        const t = tmp;
      } else {
        if (typeof tmp[k] === "undefined") {
          return arguments[2];
        }

        return tmp[k];
      }
    } catch (e) {
      return arguments[2];
    }
  }
};

const err = (msg) => {
  console.log(`get_from_stream.js error: ${msg}`);
  process.exit(1);
};

if (typeof process.argv[2] !== "string") err(`process.argv[2] is not a string`);

if (typeof process.argv[3] !== "string") err(`process.argv[3] is not a string`);

const file = process.argv[3].split(path.sep).pop();

const readline = require("readline");

const error = (msg) => console.log(`${path.basename(__filename)} used in ${file} error: ${msg}`);

function promiseStdin() {
  return new Promise((resolve, reject) => {
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    let buff = "";

    rl.on("line", (line) => (buff += line));

    rl.on("close", () => {
      resolve(buff);
    });
  });
}

(async function () {
  let stdin;

  try {
    stdin = await promiseStdin();

    try {
      stdin = JSON.parse(stdin);
    } catch (e) {
      error(trim(stdin, "\n {}"));

      process.exit(1);
    }

    const data = get(stdin, process.argv[2]);

    switch (true) {
      case isObject(data):
        process.stdout.write(JSON.stringify(data, null, 4));
        break;
      case typeof data === "string":
        process.stdout.write(data);
        break;
      default:
        console.log("unhandled type", data);
        process.exit(1);
    }
  } catch (e) {
    error(trim(String(e), "\n {}"));

    process.exit(1);
  }
})();

function trim(string, charlist, direction) {
  direction = direction || "rl";
  charlist = (charlist || "").replace(/[|\\{}()[\]^$+*?.-]/g, "\\$&");
  charlist = charlist || " \\n";
  direction.indexOf("r") + 1 && (string = string.replace(new RegExp("^(.*?)[" + charlist + "]*$", "gm"), "$1"));
  direction.indexOf("l") + 1 && (string = string.replace(new RegExp("^[" + charlist + "]*(.*)$", "gm"), "$1"));
  return string;
}
