// remember to:
//    yarn add detect-node cross-fetch
import { TARGET_ENV_HEADER, DEV, TEST, PROD } from "../constants";

import isObject from "../isObject";

import crossFetch from "cross-fetch";

import isNode from "detect-node";

let fetchInstances = {
  native: global?.fetch,
  polyfill: crossFetch,
};

export const mockFetch = (fetch) => {
  fetchInstances = {
    native: fetch,
    polyfill: fetch,
  };
};

const envOptions = [DEV, TEST, PROD];

// env      - handles env parameter 'dev', 'prod', 'test' to control server proxy target
export const fetchData = async (path, options) => {
  const th = (msg) => new Error(`fetch.ts fetchData error: ${msg}`);

  const { env, ...rest } = { ...options };

  if (typeof path !== "string" || !path.trim()) {
    throw th(`path parameter should be a string`);
  }

  if (typeof env !== "string") {
    throw th(`env parameter not provided, should be one of >${envOptions.join(",")}<, path parem: >${path}<`);
  }

  if (!envOptions.includes(env)) {
    throw th(
      `env value >${env}< is not on the list of allowed values >${envOptions.join(",")}<, path parem: >${path}<`
    );
  }

  rest.headers = {
    ...rest.headers,
    [TARGET_ENV_HEADER]: env,
  };

  let promise;

  if (process?.env?.NEXT_PUBLIC_AJAX_FETCH === "true") {
    promise = fetchInstances.polyfill(path, rest);
  } else {
    promise = fetchInstances.native(path, rest);
  }

  return promise;
};

// fetchJson is using internally fetchData and automatically do few things
//
// 1) adds
//        "Conten-type": 'application/json; charset=utf-8'
//        Accept: 'application/json'
//    headers
//
// 2) Additionally serializes request body to json if array or object given
//
// 3) if body is object or array then it sets method "POST" automatically
//    (but you can set it explicitly too)
//
// 4) unwraps response.json() untless raw: true param given
export const fetchJson = async (path, options) => {
  options = {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
      ...options?.headers,
    },
    ...options,
  };

  if (isObject(options.body) || Array.isArray(options.body)) {
    options.body = JSON.stringify(options.body, null, 4);

    options.method = options.method || "POST";
  }

  const { raw, ...rest } = options;

  const res = await fetchData(path, rest);

  if (raw) {
    return res;
  }

  return await res.json();
};

if (!isNode) {
  /**
   * Mount to global scope for manual testing in the browser
   */
  window.fetchData = fetchData;

  window.fetchJson = fetchJson;
}
