"use strict";

const URL = require("url").URL;

const https = require("https");

const http = require("http");

// npm WARN deprecated querystring@0.2.0: The querystring API is considered Legacy. new code should use the URLSearchParams API instead.
const querystring_lib = require("querystring");

const name = "curl";

const emsg = (msg) => `${name}: ${msg}`;

const th = (msg) => new Error(emsg(msg));

const log = (...args) => console.log(JSON.stringify(args, null, 4));

const def = {
  method: "GET",
  timeout: 30 * 1000,
  query: {},
  headers: {},
  debug: false,
  body: undefined,
  noBody: false,
  decodeJson: false,
  isResPromiseResolvable: async (res) => {
    return (await res.statusCode) >= 200 && res.statusCode < 300;
  },
};

const defKeys = Object.keys(def);

process.argv.shift();

process.argv.shift();

const methods = "GET POST CONNECT DELETE HEAD OPTIONS PATCH PUT TRACE";

const methods_array = methods.split(" ");

/**
 * Processing input arguments
 */
const args = (function (obj) {
  const copy = [...process.argv];

  // log({
  //   copyInit: copy
  // })

  const regHeader = /^([^:]+):\s*(.+?)$/;

  let tmp;

  while ((tmp = copy.shift()) !== undefined) {
    // log(`tmp>${tmp}<`)

    switch (true) {
      case /^-+help$/i.test(tmp):
        obj.help = true;

        break;

      case /^-+(v|verbose)$/.test(tmp):
        obj.debug = true;

        break;

      case /^-+V$/.test(tmp):
        obj.debug = "body";

        break;

      case tmp === "-I":
        obj.I = true;

        break;

      case tmp === "-H":
        const header = copy.shift();

        if (typeof header !== "string") {
          throw th(`value (header) for argument -H is not specified`);
        }

        const parts = header.match(regHeader);

        if (!Array.isArray(parts) || parts.length !== 3) {
          throw th(`value (header) for argument -H '${header}' don't match regex ${regHeader}`);
        }

        if (!parts[2].trim()) {
          throw th(`value (header) for argument -H '${header}' header value part can't be empty`);
        }

        obj.headers[parts[1].trim()] = parts[2].trim();

        break;

      case tmp === "-d":
        obj.body = copy.shift();

        if (typeof obj.body !== "string") {
          throw th(`value (body) for argument -d is not specified`);
        }

        break;

      case /^-X[a-zA-Z]+$/.test(tmp):
        obj.method = tmp.replace(/^-X([a-zA-Z]+)$/, "$1");

        if (!methods_array.includes(obj.method)) {
          throw new Error(`method (-X argument) can be one of ${methods} but it is '${obj.method}'`);
        }

        break;
      default:
        let url = tmp;

        if (typeof url !== "string") {
          throw th(`url is not specified`);
        }

        url = url.trim();

        if (!url) {
          throw th(`url is an empty string`);
        }

        obj.url = url;

        break;
    }
  }

  if (obj.url === undefined) {
    throw th(`url is not specified`);
  }

  return obj;
})({
  url: undefined,
  debug: false,
  I: false,
  body: undefined,
  method: "GET",
  help: false,
  headers: {},
  isResPromiseResolvable: async (res) => {
    return await true;
  },
});

// log({
//   final: args
// });

/**
 * Handling help page before handling the main logic
 */
if (args.help) {
  process.stdout.write(` 

Supported arguments: 

-I
-H 'headername: headervalue'
-v (alternatively non standard -V - it will dump also request body)
-d '...any data'
-X'${methods_array.join(" | ")}'
  
`);

  process.exit(1);
}

/**
 * Executing the main logic
 */
(async function () {
  try {
    const { url, I, help, ...rest } = args;

    const res = await transport(url, rest);

    if (I) {
      console.log(
        JSON.stringify(
          {
            status: res.status,
            headers: res.headers,
          },
          null,
          4
        )
      );

      process.exit(0);
    }

    process.stdout.write(res.body);
  } catch (e) {
    log({
      general_error: {
        code: e.code,
        message: e.message,
        inputArguments: args,
      },
    });
  }
})();

/**
 * Local toolbox
 */

function unique(pattern) {
  // node.js require('crypto').randomBytes(16).toString('hex');

  pattern || (pattern = "xyxyxy");

  return pattern.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function transport(url, opt = {}) {
  Object.keys(opt || {}).forEach((key) => {
    if (!defKeys.includes(key)) {
      throw th(`key '${key}' is not on the list of allowed parameters ${defKeys.join(", ")}`);
    }
  });

  let { uniq, method, timeout, query, headers, debug, body, noBody, decodeJson, isResPromiseResolvable } = {
    ...def,
    ...opt,
  };

  if (debug) {
    uniq = `---${unique("xyxyxyxyxyxyxyxyxy")}---`;
  }

  if (typeof method !== "string") {
    throw th(`method is not a string`);
  }

  method = method.toUpperCase();

  return new Promise((resolve, reject) => {
    try {
      const uri = new URL(url);

      const lib = uri.protocol === "https:" ? https : http;

      const querystring = querystring_lib.stringify(query);

      let rawBody = body;

      if (body !== undefined && method === "GET") {
        throw th(`since you have specified the body for request probably method shouldn't be GET`);
      }

      // body is not a string, so probably it need to be sent as a json
      if (isObject(body) || Array.isArray(body)) {
        try {
          body = JSON.stringify(body);
        } catch (e) {
          return reject(th(`JSON.stringify error: ${e}`));
        }

        headers["Content-Type"] = "application/json; charset=utf-8";
      }

      const rq = {
        hostname: uri.hostname,
        port: uri.port || (uri.protocol === "https:" ? "443" : "80"),
        path: uri.pathname + uri.search + (querystring ? (uri.search.includes("?") ? "&" : "?") + querystring : ""),
        method,
        headers,
      };

      if (debug === "body") {
        rq.body = body;

        rq.rawBody = rawBody;
      }

      if (debug) {
        console.log(uniq);
        console.log(`>>>`);
        console.log(JSON.stringify(rq, null, 4));
      }

      var req = lib.request(rq, (res) => {
        try {
          res.setEncoding("utf8");

          let body = "";

          res.on("data", (chunk) => {
            body += chunk;
          });

          res.on("end", async () => {
            if (decodeJson) {
              try {
                body = JSON.parse(body);
              } catch (e) {
                return reject(th(`JSON.parse(response body) error: ${e}`));
              }
            }

            try {
              const passed = await isResPromiseResolvable(res, body);

              if (!passed) {
                return reject(th(`Not resolving response (param function 'isResPromiseResolvable')`));
              }
            } catch (e) {
              return reject(th(`Not resolving response (param function 'isResPromiseResolvable'), catch: ${e}`));
            }

            const payload = {
              status: res.statusCode,
              headers: res.headers,
            };

            if (debug) {
              console.log("<<<");
              console.log(JSON.stringify(payload, null, 4));
              console.log(uniq);
            }

            if (noBody === false) {
              payload.body = body;
            }

            resolve(payload);
          });
        } catch (e) {
          reject(th(`lib.request error: ${e}`));
        }
      });

      req.on("socket", function (socket) {
        try {
          socket.setTimeout(timeout);

          socket.on("timeout", () => {
            // https://stackoverflow.com/a/9910413

            try {
              req.destroy();
            } catch (e) {
              try {
                req.abort(); // since node v14.1.0 Use request.destroy() instead
              } catch (e) {}
            }

            reject(th(`timeout (${timeout}ms)`));
          });
        } catch (e) {
          reject(th(`socket timeout error: ${e}`));
        }
      });

      req.on("error", (e) => reject(th(`on error: ${e}`)));

      body && req.write(body);

      req.end();
    } catch (e) {
      reject(th(`general error: ${e}`));
    }
  });
}

function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}
