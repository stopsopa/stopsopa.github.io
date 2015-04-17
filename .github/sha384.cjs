/**
 * This script is for use from sha384.sh
 *
 * it works with just one file, but sha384.sh is responsible for finding all
 * and driving them through this script
 */
const fs = require("fs");

const crypto = require("crypto");

const file = process.argv[2];

const th = (msg) => new Error(`sha384.cjs error: ${msg}`);

if (typeof file !== "string") {
  throw th(`argument 1 given to this script doesn't seem to path to file`);
}

let dryrun = process.argv[3] || false;

if (dryrun) {
  if (dryrun !== "--dry-run") {
    throw th(`only --dry-run flag is accepted, >${dryrun}< provided`);
  } else {
    dryrun = true;
  }
}

const sha384 = (function () {
  // openssl dgst -sha384 -binary < test.sh | base64

  const th = (msg) => new Error(`sha384 error: ${msg}`);

  return async function sha384(file) {
    if (!fs.existsSync(file)) {
      throw th(`file >${file}< doesn't exist`);
    }

    const hash = crypto.createHash("sha384");

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(file);

      stream.on("data", (data) => {
        hash.update(data);
      });

      stream.on("end", () => {
        resolve(`sha384-${hash.digest("base64")}`);
      });

      stream.on("error", (error) => {
        reject(`Error reading file: ${error.message}`);
      });
    });
  };
})();

if (!fs.existsSync(file)) {
  throw th(`file >${file}< doesn't exist`);
}

let content = fs.readFileSync(file, "utf8").toString();

(async function () {
  try {
    const promises = [];

    content.replace(/sha384\.sh::([^"]+)/g, async function (wholematch, foundFilePath) {
      if (!fs.existsSync(foundFilePath)) {
        throw th(
          `foundFilePath >${foundFilePath}< found in match >${wholematch}< in file >${file}< is not valid path to file`
        );
      }

      promises.push(
        sha384(foundFilePath)
          .then((hash) => ({
            hash,
            wholematch,
            foundFilePath,
          }))
          .catch((error) =>
            Promise.reject({
              error,
              wholematch,
              foundFilePath,
            })
          )
      );
    });

    const parts = await Promise.all(promises);

    const dictionary = parts.reduce((acc, { hash, wholematch, foundFilePath }) => {
      acc[foundFilePath] = {
        wholematch,
        hash,
      };

      return acc;
    }, {});

    const transformedContent = content.replace(/sha384\.sh::([^"]+)/g, function (wholematch, foundFilePath) {
      return dictionary[foundFilePath].hash;
    });

    if (!dryrun) {
      fs.writeFileSync(file, transformedContent);
    }
  } catch (e) {
    throw th(`general file >${file}< processing error: ${e}`);
  }
})();
