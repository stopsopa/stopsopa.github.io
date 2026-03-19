/**
 * Downloaded from wget https://stopsopa.github.io/gitignore_to_find/gitignore.js
 * Downloaded from wget https://stopsopa.github.io/gitignore_to_find/gitignore.js
 * Downloaded from wget https://stopsopa.github.io/gitignore_to_find/gitignore.js
 * Downloaded from wget https://stopsopa.github.io/gitignore_to_find/gitignore.js
 * Downloaded from wget https://stopsopa.github.io/gitignore_to_find/gitignore.js
 * Downloaded from wget https://stopsopa.github.io/gitignore_to_find/gitignore.js
 * Downloaded from wget https://stopsopa.github.io/gitignore_to_find/gitignore.js
 * Downloaded from wget https://stopsopa.github.io/gitignore_to_find/gitignore.js
 * Downloaded from wget https://stopsopa.github.io/gitignore_to_find/gitignore.js
 * Downloaded from wget https://stopsopa.github.io/gitignore_to_find/gitignore.js
 * Just exist here to spare us the effort - it's not a source of truth for this module/tool
 */
/*!
 * @homepage https://github.com/stopsopa/gitignore_to_find
 */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/gitignore-parser/lib/index.js
var require_lib = __commonJS({
  "node_modules/gitignore-parser/lib/index.js"(exports) {
    exports.compile = function(content) {
      var parsed = exports.parse(content), positives = parsed[0], negatives = parsed[1];
      return {
        accepts: function(input) {
          if (input[0] === "/") input = input.slice(1);
          return negatives[0].test(input) || !positives[0].test(input);
        },
        denies: function(input) {
          if (input[0] === "/") input = input.slice(1);
          return !(negatives[0].test(input) || !positives[0].test(input));
        },
        maybe: function(input) {
          if (input[0] === "/") input = input.slice(1);
          return negatives[1].test(input) || !positives[1].test(input);
        }
      };
    };
    exports.parse = function(content) {
      return content.split("\n").map(function(line) {
        line = line.trim();
        return line;
      }).filter(function(line) {
        return line && line[0] !== "#";
      }).reduce(function(lists, line) {
        var isNegative = line[0] === "!";
        if (isNegative) {
          line = line.slice(1);
        }
        if (line[0] === "/")
          line = line.slice(1);
        if (isNegative) {
          lists[1].push(line);
        } else {
          lists[0].push(line);
        }
        return lists;
      }, [[], []]).map(function(list) {
        return list.sort().map(prepareRegexes).reduce(function(list2, prepared) {
          list2[0].push(prepared[0]);
          list2[1].push(prepared[1]);
          return list2;
        }, [[], [], []]);
      }).map(function(item) {
        return [
          item[0].length > 0 ? new RegExp("^((" + item[0].join(")|(") + "))") : new RegExp("$^"),
          item[1].length > 0 ? new RegExp("^((" + item[1].join(")|(") + "))") : new RegExp("$^")
        ];
      });
    };
    function prepareRegexes(pattern) {
      return [
        // exact regex
        prepareRegexPattern(pattern),
        // partial regex
        preparePartialRegex(pattern)
      ];
    }
    function prepareRegexPattern(pattern) {
      return escapeRegex(pattern).replace("**", "(.+)").replace("*", "([^\\/]+)");
    }
    function preparePartialRegex(pattern) {
      return pattern.split("/").map(function(item, index) {
        if (index)
          return "([\\/]?(" + prepareRegexPattern(item) + "\\b|$))";
        else
          return "(" + prepareRegexPattern(item) + "\\b)";
      }).join("");
    }
    function escapeRegex(pattern) {
      return pattern.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&");
    }
  }
});

// gitignore.ts
var import_gitignore_parser = __toESM(require_lib(), 1);
import fs from "fs";
import readline from "readline";
var gitignorePath = process.argv[2];
process.stdout.on("error", (err) => {
  if (err.code === "EPIPE") process.exit(0);
});
if (!gitignorePath || process.stdin.isTTY) {
  console.error(
    `Usage: find . -type f | /bin/bash ts.sh gitignore.ts <path_to_gitignore>`
  );
  process.exit(1);
}
if (!fs.existsSync(gitignorePath)) {
  console.error(
    `gitignore.ts error: .gitignore file not found: ${gitignorePath}`
  );
  process.exit(1);
}
var ig;
try {
  const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
  ig = import_gitignore_parser.default.compile(gitignoreContent);
} catch (e) {
  console.error(
    `gitignore.ts error: failed to read or parse gitignore file: ${e.message}`
  );
  process.exit(1);
}
var rl = readline.createInterface({
  input: process.stdin,
  terminal: false
});
rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  const cleanPath = trimmed.replace(/^\.\//, "");
  if (ig.accepts(cleanPath)) {
    process.stdout.write(cleanPath + "\n");
  }
});
rl.on("close", () => {
  process.exit(0);
});
/*!
 * @homepage https://github.com/stopsopa/gitignore_to_find
 */
