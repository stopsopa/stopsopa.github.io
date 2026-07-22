/*

echo '{"abc": "test", "abc2": {"test": [5,4]}}' | NODE_OPTIONS= node bash/node/json/human.mjs --space 0
echo '{"abc": "test", "abc2": {"test": [5,4]}}' | NODE_OPTIONS= node bash/node/json/human.mjs --space 4
echo '{"abc": "test", "abc2": {"test": [5,4]}}' | NODE_OPTIONS= node bash/node/json/human.mjs --space 8

*/

import { fileURLToPath } from "node:url";

export const humanJson = (function () {
  "use strict";

  function isObject(a) {
    return !!a && a.constructor === Object;
  }

  var rx_escapable =
    /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

  //   function this_value() {
  //     return this.valueOf();
  //   }

  //   if (typeof Date.prototype.toJSON !== "function") {
  //     Date.prototype.toJSON = function () {
  //       return isFinite(this.valueOf())
  //         ? this.getUTCFullYear() +
  //             "-" +
  //             f(this.getUTCMonth() + 1) +
  //             "-" +
  //             f(this.getUTCDate()) +
  //             "T" +
  //             f(this.getUTCHours()) +
  //             ":" +
  //             f(this.getUTCMinutes()) +
  //             ":" +
  //             f(this.getUTCSeconds()) +
  //             "Z"
  //         : null;
  //     };

  //     Boolean.prototype.toJSON = this_value;
  //     Number.prototype.toJSON = this_value;
  //     String.prototype.toJSON = this_value;
  //   }

  var gap;
  var indent;
  var meta;
  var rep;

  function quote(string) {
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.

    rx_escapable.lastIndex = 0;
    return rx_escapable.test(string)
      ? '"' +
          string.replace(rx_escapable, function (a) {
            var c = meta[a];
            return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
          }) +
          '"'
      : '"' + string + '"';
  }

  function testIfContainsOnlyPrimitives(obj) {
    if (Array.isArray(obj)) {
      return !obj.some((v) => Array.isArray(v) || isObject(v));
    }
    if (isObject(obj)) {
      return !Object.values(obj).some((v) => Array.isArray(v) || isObject(v));
    }
    return true;
  }

  function str(key, holder, space) {
    indent = "";

    let flat = testIfContainsOnlyPrimitives(holder[key]);

    // If the space parameter is a number, make an indent string containing that
    // many spaces.

    {
      var i;

      if (!flat) {
        if (typeof space === "number") {
          for (i = 0; i < space; i += 1) {
            indent += " ";
          }

          // If the space parameter is a string, it will be used as the indent string.
        } else if (typeof space === "string") {
          indent = space;
        }
      }
    }

    // Produce a string from holder[key].

    var i; // The loop counter.
    var k; // The member key.
    var v; // The member value.
    var length;
    var mind = gap;
    var partial;
    var value = holder[key];

    // If the value has a toJSON method, call it to obtain a replacement value.

    if (value && typeof value === "object" && typeof value.toJSON === "function") {
      value = value.toJSON(key);
    }

    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.

    if (typeof rep === "function") {
      value = rep.call(holder, key, value);
    }

    // What happens next depends on the value's type.

    switch (typeof value) {
      case "string":
        return quote(value);

      case "number":
        // JSON numbers must be finite. Encode non-finite numbers as null.

        return isFinite(value) ? String(value) : "null";

      case "boolean":
      case "null":
        // If the value is a boolean or null, convert it to a string. Note:
        // typeof null does not produce "null". The case is included here in
        // the remote chance that this gets fixed someday.

        return String(value);

      // If the type is "object", we might be dealing with an object or an array or
      // null.

      case "object":
        // Due to a specification blunder in ECMAScript, typeof null is "object",
        // so watch out for that case.

        if (!value) {
          return "null";
        }

        // Make an array to hold the partial results of stringifying this object value.

        gap += indent;
        partial = [];

        // Is the value an array?

        if (Object.prototype.toString.apply(value) === "[object Array]") {
          // The value is an array. Stringify every element. Use null as a placeholder
          // for non-JSON values.

          length = value.length;
          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value, space) || "null";
          }

          // Join all of the elements together, separated with commas, and wrap them in
          // brackets.

          v =
            partial.length === 0
              ? "[]"
              : gap && !flat
              ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]"
              : "[" + partial.join(",") + "]";
          gap = mind;
          return v;
        }

        // If the replacer is an array, use it to select the members to be stringified.

        if (rep && typeof rep === "object") {
          length = rep.length;
          for (i = 0; i < length; i += 1) {
            if (typeof rep[i] === "string") {
              k = rep[i];
              v = str(k, value, space);
              if (v) {
                partial.push(quote(k) + (flat ? ": " : ":") + v);
              }
            }
          }
        } else {
          // Otherwise, iterate through all of the keys in the object.

          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = str(k, value, space);
              if (v) {
                partial.push(quote(k) + (flat > 0 ? ": " : ":") + v);
              }
            }
          }
        }

        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v =
          partial.length === 0
            ? "{}"
            : gap && !flat
            ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
            : "{" + partial.join(",") + "}";
        gap = mind;
        return v;
    }
  }

  // If the JSON object does not yet have a stringify method, give it one.

  meta = {
    // table of character substitutions
    "\b": "\\b",
    "\t": "\\t",
    "\n": "\\n",
    "\f": "\\f",
    "\r": "\\r",
    '"': '\\"',
    "\\": "\\\\",
  };
  return function (value, replacer, space) {
    // The stringify method takes a value and an optional replacer, and an optional
    // space parameter, and returns a JSON text. The replacer can be a function
    // that can replace values, or an array of strings that will select the keys.
    // A default replacer method can be provided. Use of the space parameter can
    // produce text that is more easily readable.

    gap = "";

    // If there is a replacer, it must be a function or an array.
    // Otherwise, throw an error.

    rep = replacer;
    if (
      replacer &&
      typeof replacer !== "function" &&
      (typeof replacer !== "object" || typeof replacer.length !== "number")
    ) {
      throw new Error("JSON.stringify");
    }

    // Make a fake root object containing our value under the key of "".
    // Return the result of stringifying the value.

    return str("", { "": value }, space);
  };
})();

const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  let space;

  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--space") {
      const value = args[++i];

      if (!value || !/^\d+$/.test(value)) {
        console.error("Invalid --space value. Expected integer.");
        process.exit(1);
      }

      space = Number(value);
    }
  }

  if (space === undefined) {
    space = 2;
  }

  let input = "";

  process.stdin.setEncoding("utf8");

  process.stdin.on("data", (chunk) => {
    input += chunk;
  });

  process.stdin.on("end", () => {
    try {
      const value = JSON.parse(input);

      const output = humanJson(value, undefined, space);

      process.stdout.write(output + "\n");
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  });
}
