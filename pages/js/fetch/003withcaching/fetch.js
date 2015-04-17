// remember to:
//    yarn add detect-node cross-fetch
import { TARGET_ENV_HEADER, DEV, TEST, PROD } from "../constants";

import isObject from "../isObject";

import crossFetch from "cross-fetch";

import isNode from "detect-node";

import md5FetchArguments from "../md5FetchArguments";

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

let cache = {};

function freeExpiredFromCache() {
  const now = new Date();

  cache = Object.entries(cache).reduce((acc, [hash, value]) => {
    // eslint-disable-next-line no-unused-vars
    const [createdDateObject, cacheSec, promise] = value;

    const diffInSeconds = (now.getTime() - createdDateObject.getTime()) / 1000;

    // if elemnt in cache didn't expire yet then leave it in place
    if (diffInSeconds < cacheSec) {
      acc[hash] = value;
    }

    return acc;
  }, {});
}

export const clearCache = () => (cache = {});

export const inspectCache = () => cache;

// type fetchDataOptionsType = {
//   env: "test" | "dev" | "prod",
//   cacheSec: number,
// } & Record<string, any>;

// env      - handles env parameter 'dev', 'prod', 'test' to control server proxy target
// cacheSec - cache for given number of seconds
export const fetchData = async (path, options) => {
  const th = (msg) => new Error(`fetch.ts fetchData error: ${msg}`);

  const { env, cacheSec, ...rest } = {
    ...options,
  };

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

  if (typeof cacheSec !== "undefined") {
    if (typeof cacheSec !== "number" || cacheSec < 0) {
      throw th(
        `cacheSec value >${cacheSec}< seems not right, should be number of seconds for how long promise should be held in the cache, path parem: >${path}<`
      );
    }
  }

  rest.headers = {
    ...rest.headers,
    [TARGET_ENV_HEADER]: env,
  };

  freeExpiredFromCache();

  // creating fingerprint from arguments passed to fetch
  // when another request will be made with anything different then we will cache it separately
  const hash = md5FetchArguments(path, rest);

  if (cache[hash]) {
    return cache[hash][2];
  }

  let promise;

  if (process?.env?.NEXT_PUBLIC_AJAX_FETCH === "true") {
    promise = fetchInstances.polyfill(path, rest);
  } else {
    promise = fetchInstances.native(path, rest);
  }

  if (cacheSec) {
    cache[hash] = [new Date(), cacheSec, promise];
  }

  return promise;
};

// type fetchJsonOptionsType = fetchDataOptionsType & {
//   raw: boolean, // return raw fetch response, don't reach for next promise with res.json()
// };

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
