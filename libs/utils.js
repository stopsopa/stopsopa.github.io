/**
 * @author Szymon Działowski
 * @license MIT License (c) copyright 2017-present original author or authors
 * @homepage https://github.com/stopsopa/roderic
 */

import { glob } from "node:fs/promises";

import path from "path";

import "colors";

const th = (msg) => new Error(`utils.js error: ${msg}`);

function json(data) {
  return JSON.stringify(data, null, "    ").replace(/\\\\/g, "\\");
}

async function findentries(root, mask) {
  if (typeof mask === "undefined") {
    mask = "/**/*.entry.{js,jsx}";
  }

  const iterator = await glob(root + mask);

  const list = [];
  for await (const entry of iterator) {
    list.push(entry);
  }

  let tmp,
    entries = {};

  for (let i = 0, l = list.length; i < l; i += 1) {
    tmp = path.parse(list[i]);

    tmp = path.basename(tmp.name, path.extname(tmp.name));

    if (entries[tmp]) {
      throw th("There are two entry files with the same name: '" + path.basename(entries[tmp]) + "'");
    }

    entries[tmp] = list[i];
  }

  return entries;
}

var utils = {
  config: false,
  setup: function (config) {
    if (!this.config && config) {
      this.config = config;
    }

    // console && console.log && console.log('env: '.yellow + process.env.NODE_ENV.red + "\n");
    //
    // return process.env.NODE_ENV;
  },
  entries: async function (mask, suppressNotFoundError) {
    var t,
      i,
      tmp = {},
      root = this.config.js.entries;

    if (!root) {
      throw th("First specify root path for entry");
    }

    if (Object.prototype.toString.call(root) !== "[object Array]") {
      root = [root];
    }

    for (const r of root) {
      t = await findentries(r, mask);

      for (i in t) {
        if (tmp[i]) {
          throw th("There are two entry files with the same name: '" + path.basename(t[i]) + "'");
        }

        tmp[i] = t[i];
      }
    }

    if (!suppressNotFoundError && !Object.keys(tmp).length) {
      throw th("Not found *.entry.js files in directories : \n" + json(root, null, "    "));
    }

    return tmp;
  },
};

export default utils;
