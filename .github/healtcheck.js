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

(async () => {
  try {
    if (!fs.existsSync(env)) {
      throw th(`file '${env}' doesn't exist (${nExist.message})`);
    }

    // require("dotenv").config({ path: env });
    dotenv.config({
      path: env,
    });

    if (typeof process.env.NODE_PORT !== "string") {
      throw th(`NODE_PORT is undefined`);
    }

    await new Promise(async (resolve, reject) => {
      const server_front_endpoint = `http://0.0.0.0:${process.env.NODE_PORT}/healthcheck`;

      logger(`attempt to ping front healthcheck endpoint: ${server_front_endpoint}`);

      const res = await lightFetch(server_front_endpoint, {
        timeout: 900,
      });

      if (res.status !== 200) {
        throw new Error(`res.status !== 200`);
      }

      if (res.body !== "ok") {
        throw new Error(`res.body !== 'ok'`);
      }

      logger(JSON.stringify(res, null, 4));

      logger(`attempt to ping front healthcheck endpoint: ${server_front_endpoint} success`);
    });
  } catch (e) {
    logger(`
    
Global catch:     
    
    `);

    throw e;
  }
})();
