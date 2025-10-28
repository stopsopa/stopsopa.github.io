/**
 * this script is only responsible for generating
 * XX_GENERATED=".git/xx_generated.sh"
 * for script xx.sh which can be found right next to this file in this directory
 */

const path = require("path");

const fs = require("fs");

// import "core-js/actual/structured-clone";

/// look for [jkjlv8589448939ijhfdjzxfklds8934u89439u843u834u089345]
import { select, Separator } from "@inquirer/prompts";
import confirm from "@inquirer/confirm";
import range from "./lib/range.js";

/// look for [jkjlv8589448939ijhfdjzxfklds8934u89439u843u834u089345]
// const { default: select, Separator } = require("@inquirer/prompts");
// const { default: confirm } = require("@inquirer/confirm");
// const { default: range } = require("./lib/range.js");

function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}

const log = console.log;

const msg = (m) => `${__filename} error: ${m}`;

const th = (m) => new Error(msg(m));

const localSetup = path.resolve(process.argv[2]);

const XX_GENERATED = path.resolve(process.argv[3]);

if (fs.existsSync(XX_GENERATED)) {
  fs.unlinkSync(XX_GENERATED);
}

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
  const localSetupModule = require(localSetup);

  if (typeof localSetupModule !== "function") {
    throw th(`default export is not a function in module >${localSetup}<`);
  }

  setup = localSetupModule({});

  if (!isObject(setup)) {
    throw th(`object is not returned from default function module exported from >${localSetup}<`);
  }
} else {
  setup = {};

  log(msg(`file >${localSetup}< not found`));
}
// log({
//   a:  process.argv
// }) // { a: [ 'ab', 'cd ef' ] }

process.argv.shift();
process.argv.shift();
process.argv.shift();
process.argv.shift();

// // xx ab "cd ef" --wtf

// log({
//   b:  process.argv
// }) // { a: [ 'ab', 'cd ef' ] }

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

  // log({
  //   func,
  //   c:  process.argv
  // }) // { a: [ 'cd ef' ] }

  // process.exit(0);

  let command;

  if (typeof func === "undefined") {
    // log({
    //   setup,
    // });

    // process.exit(6);

    /**
     * preparing and ordering
     */
    let orderedEntries = Object.entries(setup);
    // log({
    //   orderedEntries: JSON.stringify(orderedEntries, null, 4)
    // })
    orderedEntries.sort(([_1, { order: o1 }], [_2, { order: o2 }]) => {
      // console.log(`o1 >${o1}<, o2 >${o2}<`)
      if (o1 === o2) {
        return 0;
      }

      if (!Number.isInteger(o1) || !Number.isInteger(o2)) {
        return 1;
      }

      return o1 < o2 ? -1 : 1;
    });
    // log({
    //   orderedEntries: JSON.stringify(orderedEntries, null, 4)
    // })
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
    // log({
    //   choices: JSON.stringify(choices, null, 4)
    // })
    // process.exit();

    // /**
    //  * https://github.com/SBoudrias/Inquirer.js#select
    //  */
    command = await select({
      message: "Select command to run",
      choices,
      theme: {
        style: {
          highlight: (text) => `${c.Reverse}${text}${c.reset}`, // inverse colors using your defined constants
        },
      },
      // choices: [
      //   {
      //     name: 'npm',
      //     value: 'npm',
      //     description: 'npm is the most popular package manager',
      //   },
      //   {
      //     name: 'yarn',
      //     value: 'yarn',
      //     description: 'yarn is an awesome package manager',
      //   },
      //   new Separator(),
      //   {
      //     name: 'jspm',
      //     value: 'jspm',
      //     disabled: true,
      //   },
      //   {
      //     name: 'pnpm',
      //     value: 'pnpm',
      //     disabled: '(pnpm is not available)',
      //   },
      // ],
    });
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
      run = await confirm({ message: `Run command?     ${c.r}${command.name}${c.reset}   ` });
    }
  }

  fs.writeFileSync(XX_GENERATED, command.command);

  if (!run) {
    process.exit(10);
  }

  if (command.source) {
    process.exit(55);
  }
})();
