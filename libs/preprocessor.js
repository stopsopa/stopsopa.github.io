const path = require("path");

const fs = require("fs");

const mkdirp = require("mkdirp");

const node = require("detect-node");

const stringToRegex = require("./stringToRegex");

const env = require("./env");

const th = (msg) => new Error(`preprocessor.js error: ${msg}`);

const targets = [path.resolve(__dirname, "..", "public", "preprocessed.js"), path.resolve(__dirname, "..", "build", "preprocessed.js")];

if (!node) {
  throw th(`${__dirname} script should not be ever included in browser code`);
}
const result = require("dotenv").config();

// example of variable:
// EXPOSE_EXTRA_ENV_VARIABLES="/(^PUBLIC_|^REACT_APP_|^(PROJECT_NAME|PORT)$)/"
const EXPOSE_EXTRA_ENV_VARIABLES = (function (e) {
  if (e.includes("$")) {
    throw new Error(`EXPOSE_EXTRA_ENV_VARIABLES env var should not containe '$' character, replace it with <dollar> instead`);
  }
  return stringToRegex(e.replace(/<dollar>/g, "$"));
})(env("EXPOSE_EXTRA_ENV_VARIABLES"));

const preprocessed = Object.keys(result.parsed).reduce((acc, key) => {
  if (EXPOSE_EXTRA_ENV_VARIABLES.test(key)) {
    acc[key] = env(key);
  }

  return acc;
}, {});

console.log("\nWeb exposed environment variables: \n");

const max = Object.keys(preprocessed).reduce((acc, val) => {
  const l = val.length;

  if (l > acc) {
    return l;
  }

  return acc;
}, 0);

Object.keys(preprocessed).map((key) => {
  const l = key.length;

  let k = key;

  if (l < max) {
    k += " ".repeat(max - l);
  }

  console.log("    ", k, ":", env(key));
});

targets.forEach((target) => {
  console.log("");

  console.log(`Saving ${target}`);

  const dir = path.dirname(target);

  if (!fs.existsSync(dir)) {
    mkdirp.sync(dir);
  }

  fs.writeFileSync(
    target,
    `window.log = (function () {
      try {
        return console.log;
      } catch (e) {
        return function () {};
      }
    })();
    
    window.env = (function (e) {
      return function (key, def) {
        if (typeof key === "undefined") {
          return Object.assign({}, e);
        }
    
        if (typeof key !== "string") {
          throw new Error(
            "preprocessed.js window.env() error: key is not a string"
          );
        }
    
        if (!key.trim()) {
          throw new Error(
            "preprocessed.js window.env() error: key is an empty string"
          );
        }
    
        var val = e[key];
    
        if (typeof val === "undefined") {
          return def;
        }
    
        return val;
      };
    })(${serialiseInPrettierCompatibleWay(preprocessed)});
    
    log("const env = window.env");
    `
  );

  if (!fs.existsSync(target)) {
    // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

    throw th(`File '${target}' creation failed`);
  }
});

function serialiseString(key, always) {
  if (key.includes('"') && key.includes("'")) {
    return `"${key.replace(/"/g, '\\"')}"`;
  }

  if (key.includes('"')) {
    return `'${key}'`;
  }

  if (key.includes("'")) {
    return `"${key}"`;
  }

  if (always) {
    return `"${key}"`;
  } else {
    return key;
  }
}

function serialiseInPrettierCompatibleWay(preprocessed) {
  let tmp = [];
  Object.entries(preprocessed).forEach(([key, value]) => {
    tmp.push(`  ${serialiseString(key)}: ${serialiseString(value, true)}`);
  });

  if (tmp.length > 0) {
    return `{
    ${tmp.join(",\n")},
    }`;
  } else {
    return `{}`;
  }
}
