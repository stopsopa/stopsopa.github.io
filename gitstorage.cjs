/**
 *   node "${_DIR}/gitstorage.cjs" "${_PWD}" "${_CONFIG}" "${LIST}"
 */
const fs = require("fs");

const path = require("path");

const log = console.log;

function explode(pwd, file, found) {
  const content = fs.readFileSync(file, "utf8").toString();

  // https://regex101.com/r/9xBjhi/1
  const [_, ...match] = [...content.match(/^(.*?GITSTORAGELIST=\(\n)(.*?)(\n\)(?:\n.*|$|\s*))$/s)];

  if (match.length !== 3) {
    throw new Error(`${__filename} error: match.length !== 3`);
  }

  const count = {};

  // https://regex101.com/r/oo3mHc/1
  // /^\s*"(.*?)::(\$[A-Z\d]+)(\/[^"]+)("\s*)$/
  const reg = /^(\s*")(.*?)(::)(\$\{?[A-Z\d]+\}?\/)([^"]+)("\s*)$/;

  const lines = match[1].split("\n").map((row) => {
    const rawMath = row.match(reg);

    if (rawMath === null) {
      return row;
    }

    const [_, ...match] = [...rawMath];

    if (!count[match[0]]) {
      count[match[0]] = 0;
    }

    count[match[0]] += 1;

    return match;
  });

  const countArray = Object.entries(count);

  countArray.sort(([_, a], [__, b]) => {
    if (a === b) {
      return 0;
    }

    return a > b ? -1 : 1;
  });

  const space = countArray?.[0]?.[0] || '    "';

  const bashVariable = countArray?.[0]?.[2] || "$GITSTORAGETARGETDIR/";

  // [
  //     [ '    "', '../.env', '$GITSTORAGETARGETDIR', '/.env', '"' ],
  //     '',
  //     [
  //       0'    "',
  //       1'gitstorage-config.sh',
  //       2'$GITSTORAGETARGETDIR',
  //       3'/gitstorage-config.sh',
  //       4'"'
  //     ],
  //     '    // test',
  //     '    "xx.cjs::${GITSTORAGETARGETDIR}/xx.cjs"'
  // ]

  const files = found.split("\n");

  const gitstorage_config_sh_absolute = path.resolve(pwd, file);

  const gitstorage_config_sh_absolute_dir = path.dirname(gitstorage_config_sh_absolute);

  function relative(file) {
    return path.relative(gitstorage_config_sh_absolute_dir, file);
  }

  const existing = lines
    .map((row) => {
      if (Array.isArray(row)) {
        return row[1];
      }

      return false;
    })
    .filter(Boolean);

  const added = [];

  files.forEach((row) => {
    const rel = relative(row);

    if (row !== "" && !existing.includes(rel)) {
      const line = [space, relative(row), "::", bashVariable, clean(row), '"'];
      lines.push(line);
      added.push(line);
    }
  });

  return {
    lines,
    added,
    file,
    match,
    bashVariable,
    space,
    relative,
  };
}

function implode(file, match, added, lines) {
  match[1] = lines
    .map((row) => {
      if (Array.isArray(row)) {
        return row.join("");
      }
      return row;
    })
    .join("\n");

  const final = match.join("");

  fs.writeFileSync(file, final);

  return `
  added lines:  ${added.length}
  to file ${file}
  
${added.map((r) => r.join("")).join("\n")}
  
  to inspect if any files should be gitignored:
  
  xx --lock
  
  `;
}

if (require.main === module) {
  const pwd = process.argv[2];

  const file = process.argv[3];

  const found = process.argv[4];

  {
    const { added, match, lines } = explode(pwd, file, found);

    const result = implode(file, match, added, lines);

    log(result);
  }
} else {
  module.exports = {
    explode,
    implode,
    trim,
    clean,
  };
}

// tools vvv

function trim(string, charlist, direction) {
  direction = direction || "rl";
  charlist = (charlist || "").replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
  charlist = charlist || " \\n";
  direction.indexOf("r") + 1 && (string = string.replace(new RegExp("^(.*?)[" + charlist + "]*$", "gm"), "$1"));
  direction.indexOf("l") + 1 && (string = string.replace(new RegExp("^[" + charlist + "]*(.*)$", "gm"), "$1"));
  return string;
}

function clean(file) {
  file = file.replace(/\.\.\//g, "");

  if (file.startsWith(".git/xxlockdir")) {
    return file.replace(/^\.git(.*)$/, "_git$1");
  }

  return file;
}
