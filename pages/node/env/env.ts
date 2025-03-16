import isNode from "detect-node";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const window: any;

const th = (msg: string) => new Error(`env.ts: ${msg}`);

let env: Record<string, string>;
if (isNode) {
  env = process.env as Record<string, string>;
} else if (typeof window !== "undefined") {
  env = window.process.env as Record<string, string>;
} else {
  throw th("neither node.js nor browser context detected");
}

/**
 * For testing purposes, it is possible to substitute the object process.env with a custom object.
 */
export function mockEnv(map: Record<string, string>) {
  env = map;
}

export function has(key: string): boolean {
  if (typeof env[key] !== "string") {
    return false;
  }

  return true;
}

export function get(key: string): string | undefined {
  return env[key];
}

export function getDefault(
  key: string,
  defaultValue: string | number
): string | number {
  if (has(key)) {
    return env[key] as string;
  }

  return defaultValue;
}

/**
 * @throws {Error} If the environment variable is not defined.
 */
export function getThrow(key: string, msg?: string) {
  if (has(key)) {
    return env[key] as string;
  }

  throw th(msg || `env var ${key} is not defined`);
}

const intTest = /^-?\d+$/;
/**
 * Don't throw if env var not defined - in that case it will return undefined.
 * @throws {Error} If the environment is defined but after casting to int is not a number.
 */
export function getIntegerThrowInvalid(key: string): number | undefined {
  if (has(key)) {
    const value = get(key);

    if (typeof value === "string") {
      if (!intTest.test(value)) {
        throw th(
          `env var ${key} is not a number. value >${value}<, doesn't match regex >${intTest}<`
        );
      }

      const int = parseInt(value, 10);

      const strint = String(int);

      if (!intTest.test(strint)) {
        throw th(
          `parseInt(${value}, 10) returned ${strint}, doesn't match regex >${intTest}<`
        );
      }

      return int;
    }
  }

  return undefined;
}

/**
 * If not defined or not able to cast to int, return defaultValue.
 */
export function getIntegerDefault(key: string, defaultValue: number): number {
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
