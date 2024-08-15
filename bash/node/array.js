/**
 * echo "my data" | node bash/node/array.js --split "/c/g" --jsonAll
 * echo "my data" | node bash/node/array.js --split "/c/g" --save --group test --block iteration --jsonAll
 */

const os = require("os");

const fs = require("fs");

const readline = require("readline");

const path = require("path");

const reg = /[^a-zA-Z0-9]/g;

const tmp_file_prefix = "_array_";

const Storage = {
  filename: function (group, block, origin, thw = false) {
    const block_processed = block.replace(reg, "_");

    if (!block_processed.trim()) {
      error(`${origin}: group >${group}< after processing turns to empty string`, thw);

      process.exit(1);
    }

    const group_processed = group.replace(reg, "_");

    if (!group_processed.trim()) {
      error(`${origin}: group >${group}< after processing turns to empty string`, thw);

      process.exit(1);
    }

    const dir = path.join(os.tmpdir(), "array");

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    return path.join(dir, `${tmp_file_prefix}${group}_${block}.json`);
  },
  getIndex: function (group, block) {},
};

const getInput = (function () {
  let tmp;
  return async function (origin) {
    if (tmp) {
      return tmp;
    }

    let e;
    try {
      tmp = await getStdInDelimitedToArray(origin, true);

      return tmp;
    } catch (er1) {
      e = er1;
    }

    try {
      tmp = getJson(origin, true);

      return tmp;
    } catch (er2) {
      error(
        `${origin}: no stdin and no json file: 
        error1: >>${e}<< 
        error2: >>${er2}<<`
      );
    }
  };
})();
/**
 * Attempts to first read from file, but if failed then from stdin
 */

const args = (function (obj, tmp) {
  process.argv.slice(2).map((a) => {
    if (a.indexOf("--") === 0) {
      tmp = a.substring(2).replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");

      if (tmp) {
        obj[tmp] = typeof obj[tmp] === "undefined" ? true : obj[tmp];
      }

      return;
    }

    if (a === "true") {
      a = true;
    }

    if (a === "false") {
      a = false;
    }

    if (tmp !== null) {
      if (obj[tmp] === true) {
        return (obj[tmp] = [a]);
      }

      try {
        obj[tmp].push(a);
      } catch (e) {}
    }
  });

  Object.keys(obj).map((k) => {
    obj[k] !== true && obj[k].length === 1 && (obj[k] = obj[k][0]);
    obj[k] === "false" && (obj[k] = false);
  });

  return {
    count: () => Object.keys(obj).length,
    all: () => JSON.parse(JSON.stringify(obj)),
    get: (key, def) => {
      var t = JSON.parse(JSON.stringify(obj));

      if (typeof def === "undefined") return t[key];

      return typeof t[key] === "undefined" ? def : t[key];
    },
    getThrow: (key) => {
      if (typeof key !== "string" || !key.trim()) {
        throw new Error(`args.js error: argument --${key} is required`);
      }

      var t = JSON.parse(JSON.stringify(obj));

      if (typeof t[key] === "undefined") {
        throw new Error(`args.js error: argument --${key} is not provided`);
      }

      return t[key];
    },
    string: (key, def) => {
      var t = JSON.parse(JSON.stringify(obj));

      return typeof t[key] === "string" ? t[key] : def;
    },
  };
})({});

const all = args.all();

async function getStdInDelimitedToArray(origin, thw = false) {
  const reg = getRegexDelimiter(origin, thw);

  const stdin = await promiseStdin();

  const array = stdin.split(reg);

  if (!Array.isArray(array)) {
    error(`getStdInDelimitedToArray: stdin is not a valid array`, thw);
  }

  return { array, index: 0 };
}

const getJsonFromFile = (function () {
  const cache = {};

  return function (file, origin, thw = false) {
    if (cache[file]) {
      return cache[file];
    }

    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch (e) {
      error(`getJsonFromFile: ${origin}: file >${file}< error: ${e}`, thw);
    }

    let json;

    try {
      json = JSON.parse(content);
    } catch (e) {
      error(`getJsonFromFile: ${origin}: file >${file}< is not a valid JSON: ${e}`, thw);
    }

    return (cache[file] = json);
  };
})();

// verbose
let out = args.get("v")
  ? function (...args) {
      console.log(...args);
    }
  : function () {};

(async function () {
  if (Object.keys(args.all()).length === 0) {
    console.log(`

Warning: 
  Since pipes are used use:
  set -o pipefail

Usage:       
      cat [data] | node bash/node/array.js -v --split "/\\n/" --count
 
I="0"
echo 'abcdefcghi' | node bash/node/array.js --split "/c/g" --save --group test --block iteration
while [ "$(node bash/node/array.js --group test --block iteration --has)" = "true" ]; do
    I=$((I+1))
    VALUE="$(node bash/node/array.js --group test --block iteration --value)"
    node bash/node/array.js --group test --block iteration --increment
    echo "VALUE>\${VALUE}<"
done    

Other options:

--split <delimiter>: Specifies the delimiter to split the input string. The input string will be split into an array based on this delimiter.
Example: --split "/c/g"  or --split "/\\n/g"

--has: Checks if there is a value under current index
Example: --has

--count: Counts the number of elements in the array.
Example: --count

--save: Saves the array to temporary files.
Example: --save

--group <name>: Specifies the name of the group for the saved files.
Example: --group test

--block <name>: Specifies the name of the block for the saved files.
Example: --block iter

--v: Enables verbose mode, which provides additional output during execution.
Example: --v

--jsonAll: Outputs the array and index as a JSON object.
Example: --jsonAll [space:def 0]

--json: Outputs the array as a JSON array.
Example: --json [space:def 0]

--trim: Trims leading and trailing whitespace from each element of the array.
Example: --trim

--boolfilter: Filters out empty elements from the array.
Example: --boolfilter

--hasNext: Checks if there is a next element in the iteration block.
Example: --hasNext

--hasPrev: Checks if there is a previous element in the iteration block.
Example: --hasPrev

--increment: Moves to the next element in the iteration block.
Example: --increment [inc:def 1]

--decrement: Moves to the previous element in the iteration block.
Example: --decrement [inc:def 1]

--index: Outputs the current index in the iteration block.
Example: --index

--value: Outputs the current value in the iteration block.
Example: --value
            
`);

    JSON.stringify(args.all(), null, 4);
    process.exit(1);
  }

  if (args.get("jsonAll")) {
    const { array, index } = await getInput("json");

    let inc = argInt("jsonAll", 0, "jsonAll");

    process.stdout.write(JSON.stringify({ array: filtered(array, "jsonAll"), index }, null, inc));
  }

  if (args.get("json")) {
    const { array, index } = await getInput("json");

    let inc = argInt("json", 0, "json");

    process.stdout.write(JSON.stringify(filtered(array, "json"), null, inc));
  }

  if (args.get("count")) {
    const { array, index } = await getInput("count");

    process.stdout.write(String(array.length));
  }

  if (args.get("save")) {
    const { array, index } = await getInput("save");

    save(filtered(array), index, 0);
  }

  if (args.get("has")) {
    const { array, index } = await getInput("has");

    if (array[index]) {
      process.stdout.write("true");
    } else {
      process.stdout.write("false");
    }
  }

  if (args.get("hasNext")) {
    const { array, index } = await getInput("hasNext");

    const next = index + 1;

    if (array[next]) {
      process.stdout.write("true");
    } else {
      process.stdout.write("false");
    }
  }

  if (args.get("hasPrev")) {
    const { array, index } = await getInput("hasPrev");

    const next = index - 1;

    if (array[next]) {
      process.stdout.write("true");
    } else {
      process.stdout.write("false");
    }
  }

  if (args.get("value")) {
    const { array, index } = await getInput("value");

    if (index < array.length) {
      process.stdout.write(String(array[index]));
    } else {
      error(`no value found at index >${index}<`);
    }
  }

  if (args.get("index")) {
    const { array, index } = await getInput("index");

    process.stdout.write(String(index));
  }

  if (args.get("increment")) {
    const { index } = await getInput("increment");

    let increment = argInt("increment", 1, "increment");

    const next = index + increment;

    saveIndex(next);

    if (args.get("v")) {
      process.stdout.write(String(next));
    }
  }

  if (args.get("decrement")) {
    const { index } = await getInput("decrement");

    let decrement = argInt("decrement", 1, "decrement");

    const prev = index - decrement;

    if (prev >= 0) {
      saveIndex(prev);

      if (args.get("v")) {
        process.stdout.write(String(prev));
      }
    } else {
      error(`decrement >${decrement}< from index >${index}< will result in negative index >${prev}<`);
    }
  }

  if (args.get("home")) {
    const { index } = await getInput("home");

    saveIndex(0);

    if (args.get("v")) {
      process.stdout.write(String(0));
    }
  }

  if (args.get("end")) {
    const { array } = await getInput("end");

    const index = array.length - 1;

    saveIndex(index);

    if (args.get("v")) {
      process.stdout.write(String(index));
    }
  }
})();

function getRegexDelimiter(origin, thw = false) {
  const raw = args.get("split");

  if (typeof raw !== "string" || !raw.trim()) {
    error(`${origin}: --split is required`, thw);
  }

  return stringToRegex(raw);
}

function getRequiredArg(name, origin, thw = false) {
  const arg = args.get(name);

  if (typeof arg !== "string" || !arg.trim()) {
    error(`${origin}: --${name} is required`, thw);
  }

  return arg;
}

function getFilenames(origin, thw = false) {
  const group = getRequiredArg("group", origin, thw);

  const block = getRequiredArg("block", origin, thw);

  let main = Storage.filename(group, block, origin, thw);

  let index = Storage.filename(group, `${block}_index`, origin, thw);

  return { index, main };
}

function getJson(origin, thw = false) {
  const { main, index } = getFilenames(origin, thw);

  const array = getJsonFromFile(main, origin, thw);

  if (!Array.isArray(array)) {
    error(`getJson: ${origin} : json in file >${main}< is not an array`, thw);
  }

  const { index: i } = getJsonFromFile(index, origin, thw);

  if (typeof i !== "number") {
    error(`getJson: ${origin} : index in file >${index}< is not a number`, thw);
  }

  return { array, index: i };
}

function saveIndex(indexValue) {
  const { index } = getFilenames("save");

  fs.writeFileSync(index, JSON.stringify({ index: indexValue }, null, 4));

  if (args.get("v") == 2) {
    out(`Saved files >${index}<`);
  } else {
    out(`Saved files >${path.basename(index)}<`);
  }
}

function save(array, indexValue) {
  const { main, index } = getFilenames("save");

  fs.writeFileSync(main, JSON.stringify(array, null, 4));

  fs.writeFileSync(index, JSON.stringify({ index: indexValue }, null, 4));

  if (args.get("v") == 2) {
    out(`Saved files >${main}< >${index}<`);
  } else {
    out(`Saved files >${path.basename(main)}< >${path.basename(index)}<`);
  }
}

function stringToRegex(v) {
  try {
    const vv = v.match(/(\\.|[^/])+/g);

    if (vv.length > 2) {
      error(`param '${v}' splits to more than 2 segments`);
    }

    return new RegExp(vv[0], vv[1]);
  } catch (e) {
    error(`general error: string '${v}' error: ${e}`);
  }
}

function promiseStdin() {
  return new Promise((resolve, reject) => {
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    let buff = "";

    rl.on("line", (line) => {
      if (buff !== "") {
        buff += "\n";
      }
      buff += line; // Append a newline character to each line
    });

    rl.on("close", () => {
      resolve(buff);
    });
  });
}

function error(msg, thw = false) {
  const message = `array.js error: ${msg}`;

  if (thw) {
    throw new Error(message);
  }

  process.stdout.write(`array.js error: ${msg}`);

  process.exit(1);
}

function filtered(array, index) {
  if (args.get("trim")) {
    array = array.map((v) => v.trim());
  }

  if (args.get("boolfilter")) {
    array = array.filter(Boolean);
  }

  return array;
}

function argInt(name, def, origin) {
  let inc = args.get(name);

  if (inc !== true) {
    const tmp = parseInt(inc, 10);

    if (isNaN(inc)) {
      error(`argInt ${origin}: value >${inc}< is not a number`);
    }

    inc = tmp;
  } else {
    inc = def;
  }

  return inc;
}
