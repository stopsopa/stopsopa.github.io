import isNode from "detect-node";

const th = (msg) => new Error(`env.js: ${msg}`);

/**
 * @type {Record<string, string>}
 */
let env;

if (isNode) {
  env = process.env;
} else if (typeof window !== "undefined") {
  env = window.process.env;
} else {
  throw th("env.js: neither node.js nor browser context detected");
}

/**
 * For testing purposes, it is possible to substitute the object process.env with a custom object.
 * @param {Record<string, string>} map
 */
export function mockEnv(map) {
  env = map;
}

/**
 * @returns {Record<string, string>}
 */
export function all() {
  return env;
}

/**
 * @param {string} key
 * @returns {boolean}
 */
export function has(key) {
  return typeof env[key] === "string";
}

/**
 * @param {string} key
 * @returns {string | undefined}
 */
export function get(key) {
  return env[key];
}

/**
 * @param {string} key
 * @param {string | number} defaultValue
 * @returns {string | number}
 */
export function getDefault(key, defaultValue) {
  if (has(key)) {
    return env[key];
  }
  return defaultValue;
}

/**
 * @param {string} key
 * @param {string} [msg]
 * @returns {string}
 * @throws {Error} If the environment variable is not defined.
 */
export function getThrow(key, msg) {
  if (has(key)) {
    return env[key];
  }
  throw th(msg || `env var ${key} is not defined`);
}

const intTest = /^-?\d+$/;

/**
 * Don't throw if env var not defined - in that case it will return undefined.
 * @param {string} key
 * @returns {number | undefined}
 * @throws {Error} If the environment is defined but after casting to int is not a number.
 */
export function getIntegerThrowInvalid(key) {
  if (has(key)) {
    const value = get(key);

    if (typeof value === "string") {
      if (!intTest.test(value)) {
        throw th(`env var ${key} is not a number. value >${value}<, doesn't match regex >${intTest}<`);
      }

      const int = parseInt(value, 10);

      const strint = String(int);

      if (!intTest.test(strint)) {
        throw th(`parseInt(${value}, 10) returned ${strint}, doesn't match regex >${intTest}<`);
      }

      return int;
    }
  }

  return undefined;
}

/**
 * If not defined or not able to cast to int, return defaultValue.
 * @param {string} key
 * @param {number} defaultValue
 * @returns {number}
 */
export function getIntegerDefault(key, defaultValue) {
  try {
    const val = getIntegerThrowInvalid(key);

    if (typeof val === "number") {
      return val;
    }

    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * get env var cast to integer and throw if anything during casting to int fail or env var is not defined
 * @param {string} key
 * @returns {string | number}
 * @throws {Error} If the environment variable is not defined or is not a number.
 */
export function getIntegerThrow(key) {
  const val = getIntegerThrowInvalid(key);

  if (typeof val === "number") {
    return val;
  }

  throw th(`env var ${key} is not defined or is not a number`);
}
