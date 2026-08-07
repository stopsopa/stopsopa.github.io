// Centralized error factory for this module.
function th(msg: string) {
  return new Error("regex error: " + msg);
}

export const stringToRegex = (function () {
  /**
   * Converts a string pattern into a RegExp instance.
   * Supports plain patterns (e.g. "^open") and JS-style notation (e.g. "/^open$/i").
   *
   * @param {string} v Raw pattern string
   */
  return (v: string): RegExp => {
    try {
      const vv = v.match(/(\\.|[^/])+/g);

      if (!vv || vv.length > 2) {
        throw th(`stringToRegex: param '${v}' should split to one or two segments`);
      }

      return new RegExp(vv[0], vv[1]);
    } catch (e: any) {
      throw th(`stringToRegex: string '${v}' error: ${e?.message ?? e}`);
    }
  };
})();

/**
 * Parses --regex CLI argument into a RegExp instance using stringToRegex.
 * Returns null if --regex arg is absent or empty.
 * Exits process with error if pattern is invalid.
 */
export function getRegexArg(): RegExp | null {
  const index = process.argv.indexOf("--regex");
  if (index !== -1 && index + 1 < process.argv.length) {
    const rawPattern = process.argv[index + 1].trim();
    if (!rawPattern) {
      return null;
    }

    try {
      return stringToRegex(rawPattern);
    } catch (err: any) {
      console.error(`error: Invalid regex pattern provided to --regex: ${err?.message ?? err}`);
      process.exit(1);
    }
  }
  return null;
}
