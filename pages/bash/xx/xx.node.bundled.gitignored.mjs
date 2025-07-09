// pages/bash/xx/xx.node.mjs
import path from "path";
import fs from "fs";
var importModule = async (modulePath) => {
  try {
    return await import(modulePath);
  } catch (error) {
    console.error(`Error importing ${modulePath}:`, error);
    return { default: null };
  }
};
var selectModule = await importModule("@inquirer/select");
var confirmModule = await importModule("@inquirer/confirm");
var rangeModule = await importModule("./lib/range.js");
var select = selectModule.default || ((options) => {
  console.log("Select option:", options.message);
  return options.choices[0].value;
});
var { Separator } = selectModule;
var confirm = confirmModule.default || ((options) => {
  console.log("Confirm:", options.message);
  return true;
});
var range = rangeModule.default || ((options) => options.str);
process.on("SIGINT", () => {
  console.log("\nProcess terminated by user (Ctrl+C)");
  process.exit(130);
});
function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}
var log = console.log;
var msg = (m) => `${__filename} error: ${m}`;
var th = (m) => new Error(msg(m));
var localSetup = path.resolve(process.argv[2]);
var XX_GENERATED = path.resolve(process.argv[3]);
try {
  if (fs.existsSync(XX_GENERATED)) {
    fs.unlinkSync(XX_GENERATED);
  }
} catch (err) {
  console.error(`Error removing existing file ${XX_GENERATED}: ${err.message}`);
}
var c = {
  Bright: "\x1B[1m",
  Dim: "\x1B[2m",
  Underscore: "\x1B[4m",
  Blink: "\x1B[5m",
  Reverse: "\x1B[7m",
  Hidden: "\x1B[8m",
  FgBlack: "\x1B[30m",
  FgRed: "\x1B[31m",
  // red
  FgGreen: "\x1B[32m",
  // green
  FgYellow: "\x1B[33m",
  // yellow
  FgBlue: "\x1B[34m",
  FgMagenta: "\x1B[35m",
  // magenta
  FgCyan: "\x1B[36m",
  // cyan
  FgWhite: "\x1B[37m",
  BgBlack: "\x1B[40m",
  BgRed: "\x1B[41m",
  BgGreen: "\x1B[42m",
  BgYellow: "\x1B[43m",
  BgBlue: "\x1B[44m",
  BgMagenta: "\x1B[45m",
  BgCyan: "\x1B[46m",
  BgWhite: "\x1B[47m",
  r: "\x1B[31m",
  // red
  g: "\x1B[32m",
  // green
  y: "\x1B[33m",
  // yellow
  m: "\x1B[35m",
  // magenta
  c: "\x1B[36m",
  // cyan
  reset: "\x1B[0m"
};
var setup;
if (fs.existsSync(localSetup)) {
  try {
    const localSetupModule = await import(localSetup);
    if (typeof localSetupModule.default !== "function") {
      throw th(`default export is not a function in module >${localSetup}<`);
    }
    setup = localSetupModule.default({});
    if (!isObject(setup)) {
      throw th(`object is not returned from default function module exported from >${localSetup}<`);
    }
  } catch (err) {
    console.error(`Error importing or processing module ${localSetup}: ${err.message}`);
    setup = {};
  }
} else {
  setup = {};
  log(msg(`file >${localSetup}< not found`));
}
process.argv.shift();
process.argv.shift();
process.argv.shift();
process.argv.shift();
setup = Object.entries(setup).reduce((acc, [key, value]) => {
  if (!isObject(value)) {
    log(JSON.stringify(setup, null, 4));
    throw th(`value for key >${key}< in the setup is not an object`);
  }
  if (typeof value.command !== "string") {
    log(JSON.stringify(setup, null, 4));
    throw th(`value.command for key >${key}< in the setup is not a string`);
  }
  if (typeof value.description !== "string") {
    value.description = key;
  }
  value.description = value.description.replace(/<%\s*name\s*%>/g, key);
  value.command = value.command.replace(/<%\s*name\s*%>/g, key);
  value.name = key;
  acc[key] = value;
  return acc;
}, {});
(async function() {
  const func = process.argv.shift();
  let command;
  if (typeof func === "undefined") {
    let orderedEntries = Object.entries(setup);
    orderedEntries.sort(([_1, { order: o1 }], [_2, { order: o2 }]) => {
      if (o1 === o2) {
        return 0;
      }
      if (!Number.isInteger(o1) || !Number.isInteger(o2)) {
        return 1;
      }
      return o1 < o2 ? -1 : 1;
    });
    let choices = orderedEntries.reduce((acc, [k, v], i) => {
      acc.push({
        name: range({
          str: String(i + 1).padStart(3, " ") + " - " + k,
          zeroIndexed: i,
          length: orderedEntries.length,
          firstLengthWhenEnabled: 0
        }),
        value: v,
        description: v.description
      });
      return acc;
    }, []);
    try {
      command = await select({
        message: "Select command to run",
        choices
      });
    } catch (err) {
      if (err.message && err.message.includes("SIGINT")) {
        console.log("\nExiting without selecting a command");
        process.exit(130);
      }
      throw err;
    }
  } else {
    if (/^\d+$/.test(func)) {
      const cmd = Object.values(setup)[func - 1];
      if (cmd) {
        command = cmd;
      }
    }
    if (!command && setup[func]) {
      command = setup[func];
    }
    if (!command) {
      log(`    
      function >${func}< not defined in >${localSetup}< nor in global config      
  `);
      process.exit(1);
    }
  }
  let run = false;
  if (command.confirm === false) {
    run = true;
  }
  if (process.env.XXCONFIRM === "false") {
    run = true;
  } else {
    if (typeof command.confirm === "undefined" || command.confirm === true) {
      try {
        run = await confirm({ message: `Run command?     ${c.r}${command.name}${c.reset}   ` });
      } catch (err) {
        if (err.message && err.message.includes("SIGINT")) {
          console.log("\nExiting without running the command");
          process.exit(130);
        }
        throw err;
      }
    }
  }
  try {
    fs.writeFileSync(XX_GENERATED, command.command);
  } catch (err) {
    console.error(`Error writing to ${XX_GENERATED}: ${err.message}`);
    process.exit(1);
  }
  if (!run) {
    process.exit(10);
  }
  if (command.source) {
    process.exit(55);
  }
})();
