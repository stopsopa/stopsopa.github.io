/**
 * this script is only responsible for generating
 * XX_GENERATED=".git/xx_generated.sh"
 * for script xx.sh which can be found right next to this file in this directory
 */

import path from "path";
import fs from "fs";

// Handle dynamic imports gracefully
const importModule = async (modulePath) => {
  try {
    return await import(modulePath);
  } catch (error) {
    console.error(`Error importing ${modulePath}:`, error);
    return { default: null };
  }
};

// Import the dependencies
const selectModule = await importModule("@inquirer/select");
const confirmModule = await importModule("@inquirer/confirm");
const rangeModule = await importModule("./lib/range.js");

// Get the functions with fallbacks if imports fail
const select =
  selectModule.default ||
  ((options) => {
    console.log("Select option:", options.message);
    return options.choices[0].value;
  });
const { Separator } = selectModule;
const confirm =
  confirmModule.default ||
  ((options) => {
    console.log("Confirm:", options.message);
    return true;
  });
const range = rangeModule.default || ((options) => options.str);

// Handle SIGINT (Ctrl+C) gracefully
process.on("SIGINT", () => {
  console.log("\nProcess terminated by user (Ctrl+C)");
  process.exit(130); // Standard exit code for SIGINT
});

function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}

const log = console.log;

const msg = (m) => `${__filename} error: ${m}`;

const th = (m) => new Error(msg(m));

const localSetup = path.resolve(process.argv[2]);

const XX_GENERATED = path.resolve(process.argv[3]);

try {
  if (fs.existsSync(XX_GENERATED)) {
    fs.unlinkSync(XX_GENERATED);
  }
} catch (err) {
  console.error(`Error removing existing file ${XX_GENERATED}: ${err.message}`);
  // Continue execution, as this is not critical
}

// Simple ANSI color implementation that doesn't rely on external packages
const c = {
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",
  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m", // red
  FgGreen: "\x1b[32m", // green
  FgYellow: "\x1b[33m", // yellow
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m", // magenta
  FgCyan: "\x1b[36m", // cyan
  FgWhite: "\x1b[37m",
  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m",
  r: "\x1b[31m", // red
  g: "\x1b[32m", // green
  y: "\x1b[33m", // yellow
  m: "\x1b[35m", // magenta
  c: "\x1b[36m", // cyan
  reset: "\x1b[0m",
};

let setup;

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

/**
 * processing <% name %>
 */

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

/**
 * Here starts processing
 */

(async function () {
  const func = process.argv.shift();

  let command;

  if (typeof func === "undefined") {
    /**
     * preparing and ordering
     */
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
          firstLengthWhenEnabled: 0,
        }),
        value: v,
        description: v.description,
      });
      return acc;
    }, []);

    try {
      command = await select({
        message: "Select command to run",
        choices,
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

  let run = false; // by default confirmation needed

  if (command.confirm === false) {
    // if no need for confirmation
    run = true;
  }

  if (process.env.XXCONFIRM === "false") {
    run = true;
  } else {
    /**
     * if flag confirm not specified or specified with value "true"
     * then we ask for permission to run
     */
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
