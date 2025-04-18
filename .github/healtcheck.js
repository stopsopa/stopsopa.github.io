/**
 * Simple script that can be executed at any time to check if both (vite & local api server) servers are working
 *
 * Just run:
 *    node .github/healtcheck.js
 *
 * Script have default timeout of 10 sec
 *
 * WARNING: if it comes to checking API server then server have to be
 *          running in process.env.NODE_ENV=production
 *          otherwise healtheck will fail in this script.
 *          But it doesn't mean that endpoint /healthcheck returned non 200 http status code
 *          It rather means it returned body:
 *            mode: >development< healthcheck ok
 *          instead of:
 *            mode: >production< healthcheck ok
 *
 *          In case of frontend server this script is checking just if endpoint /healthcheck
 *          return 200 status code, that's all
 *
 * you might also change timeout:
 *    TIMEOUT="500" node .github/healtcheck.js
 *
 * also tell the script to check just one server
 *
 *    TIMEOUT="500" node .github/healtcheck.js api
 *
 * or
 *
 *    TIMEOUT="500" node .github/healtcheck.js front
 *
 */
// const path = require("path");
import path from "path";

import fs from "fs";

import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

import lightFetch from "nlab/lightFetch.js";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const env = path.resolve(__dirname, "..", ".env");

// const fsPromises = require("node:fs/promises"); // not available in node v 15

const logger = (...args) => console.log(new Date().toISOString(), ...args);

const th = (msg) => new Error(`healtcheck.js error: ${msg}`);

let healthcheckTimeoutMilliseconds = 10 * 1000;

if (/^\d+$/.test(process.env.TIMEOUT)) {
  healthcheckTimeoutMilliseconds = parseInt(process.env.TIMEOUT, 10);
} else {
  throw th(`process.env.TIMEOUT is not defined`);
}

(async () => {
  try {
    if (!fs.existsSync(env)) {
      throw th(`file '${env}' doesn't exist (${nExist.message})`);
    }

    // require("dotenv").config({ path: env });
    dotenv.config({
      path: env,
    });

    const protMatch = /^https?$/;

    if (!protMatch.test(process.env.NODE_API_PROTOCOL)) {
      throw th(`process.env.NODE_API_PROTOCOL >${process.env.NODE_API_PROTOCOL}< doesn't match pattern ${protMatch}`);
    }

    if (typeof process.env.NODE_API_PORT_HTTPS !== "string") {
      throw th(`NODE_API_PORT_HTTPS is undefined`);
    }

    setTimeout(() => {
      logger(
        `healthcheck timeout error after ${healthcheckTimeoutMilliseconds} miliseconds (${parseFloat(
          healthcheckTimeoutMilliseconds / 1000
        ).toFixed(2)} sec)`
      );

      process.exit(1);
    }, healthcheckTimeoutMilliseconds);

    const server_front_endpoint = `${process.env.NODE_API_PROTOCOL}://0.0.0.0:${process.env.NODE_API_PORT_HTTPS}/healthcheck`;

    const promise = Promise.all([
      new Promise((resolve) => {
        (async function runner() {
          try {
            logger(`attempt to ping front healthcheck endpoint: ${server_front_endpoint}`);

            const res = await lightFetch(server_front_endpoint, {
              timeout: 900,
              rejectUnauthorized: false,
            });

            if (res.status !== 200) {
              throw new Error(`res.status !== 200`);
            }

            if (res.body !== "healtcheck-file") {
              throw new Error(`res.body !== 'ok'`);
            }

            logger(JSON.stringify(res, null, 4));

            logger(`attempt to ping front healthcheck endpoint: ${server_front_endpoint} success`);

            resolve();
          } catch (e) {
            logger(`attempt to ping front healthcheck endpoint: ${server_front_endpoint} failure ${e}`);

            setTimeout(runner, 1000);
          }
        })();
      }),
    ]);

    await promise;

    logger(`all tests passed - service healthy`);

    process.exit(0);
  } catch (e) {
    logger(`
    
Global catch:     
    
    `);

    throw e;
  }
})();
