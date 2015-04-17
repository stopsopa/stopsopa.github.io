// for internal use from injector.sh
// but can be used directly too
// this script processes one file
// to understad how read top of the file injector.sh
//
// node node_modules/.bin/chokidar '**/*.inject.js' --ignore '**/node_modules/**/*' --initial -c 'node injector.js {path}'
//

// const path = require("path");
import path from "path";

// const fs = require("fs");
import fs from "fs";

const log = console.log;

let file = process.argv[2];

const script = "injector.js";

const th = (msg) => new Error(`${script} error: ${msg}`);

if (typeof file !== "string" || !file.trim()) {
  throw th(`file script argument is not provided`);
}

file = path.resolve(file);

if (!fs.existsSync(file)) {
  throw th(`file >${file}< doesn't exist`);
}

const extension = path.extname(file).substring(1);

if (!extension) {
  throw th(`file >${file}< doesn't have extension, normally it should be .js file`);
}

const dirname = path.dirname(file);

let filename = path.basename(file, path.extname(file));

filename = path.basename(filename, path.extname(filename));

const newfile = `${dirname}/${filename}.injected.${extension}`;

const circular = {
  [file]: true, // true means processing has started but not finished yet
};

function replaceInFile(file, level) {
  log(`${script} processing: ${"  ".repeat(level)}${path.relative(process.cwd(), file)}`);

  const th_ = (msg) => th(`parsing >${file}< error: ${msg}`);

  const dir = path.dirname(file);

  const content = fs.readFileSync(file, "utf8").toString();

  return content.replace(/\/\/\/\s+injector:([^\n]*)/g, (match, group) => {
    let foundfile = group.trim();

    if (!foundfile) {
      log(`WARNING: in file >${file}< empty injector was found`);

      return match;
    }

    foundfile = path.resolve(dir, foundfile);

    if (circular[foundfile] === true) {
      throw th_(`file >${foundfile}< - circular reference`);
    }

    if (typeof circular[foundfile] === "string") {
      return circular[foundfile];
    }

    if (!fs.existsSync(foundfile)) {
      throw th_(`file >${foundfile}< doesn't exist`);
    }

    circular[foundfile] = true;

    const content = replaceInFile(foundfile, level + 1);

    return (circular[foundfile] = content);
  });
}

const newContent = replaceInFile(file, 0);

fs.writeFileSync(newfile, newContent);
