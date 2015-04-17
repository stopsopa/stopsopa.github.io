/**
 * Extract value of particular env var in particular env file
 * node bash/node/env/getter.js --env-file .env --var PHPMYADMIN_PORT
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

let envfile = args.get("env-file", ".env");

if (typeof envfile !== "string" || !envfile.trim()) {
  throw new Error(`getter.js error: --env-file is required`);
}

require("dotenv-up")(
  {
    override: false,
    deep: 4,
    envfile,
  },
  false,
  "react/webpack.config.js"
);

let extractVar = args.get("var");

if (typeof extractVar !== "string" || !extractVar.trim()) {
  throw new Error(`getter.js error: --var is required`);
}

console.log(process.env[extractVar]);
