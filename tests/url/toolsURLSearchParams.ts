/**
 * Merges multiple URLSearchParams instances. The first parameter acts as the base.
 * Subsequent parameters overwrite existing keys. If a string array is provided,
 * it acts as an allowlist, meaning only those keys will be merged from subsequent instances.
 * The final result is sorted alphabetically.
 */
export function mergeURLSearchParams(
  ...args: (URLSearchParams | string[])[]
): URLSearchParams {
  const result = new URLSearchParams();
  if (args.length === 0) return result;

  // Find the filter array if it exists
  const filterIndex = args.findIndex((arg) => Array.isArray(arg));
  const filterKeys = filterIndex !== -1 ? (args[filterIndex] as string[]) : null;
  const filterSet = filterKeys ? new Set(filterKeys) : null;

  for (let i = 0; i < args.length; i++) {
    const params = args[i];
    if (params instanceof URLSearchParams) {
      // The first URLSearchParams contributes all its keys.
      // Subsequent ones only contribute keys in the filterSet (if defined).
      const isFirstParams = i === args.findIndex(arg => arg instanceof URLSearchParams);
      
      const uniqueKeys = new Set<string>();
      params.forEach((_, key) => uniqueKeys.add(key));
      const keys = Array.from(uniqueKeys);
      const keysToProcess = (!isFirstParams && filterSet) 
        ? keys.filter(k => filterSet.has(k)) 
        : keys;

      for (const key of keysToProcess) {
        result.delete(key);
        params.getAll(key).forEach((value) => {
          result.append(key, value);
        });
      }
    }
  }

  result.sort();

  return result;
}

/**
 * Creates a deep, distinct copy of a URLSearchParams instance, preserving its data
 * but decoupling its object reference so mutations don't affect the original.
 */
export function cloneSearchParams(
  params: URLSearchParams
): URLSearchParams {
  return new URLSearchParams(params);
}

/**
 * Returns a new URLSearchParams instance with all keys sorted alphabetically.
 * Useful for ensuring consistent parameter ordering before serialization.
 */
export function normalizeSearchParams(
  params: URLSearchParams
): URLSearchParams {
  const result = new URLSearchParams(params);
  result.sort();
  return result;
}

/**
 * Compares two URLSearchParams instances for equality by normalizing and sorting them.
 * Returns true if they contain the exact same keys and values regardless of original order.
 */
export function compareNormalizedSearchParams(
  a: URLSearchParams,
  b: URLSearchParams
): boolean {
  const na = normalizeSearchParams(a);
  const nb = normalizeSearchParams(b);

  return na.toString() === nb.toString();
}

/**
 * Returns a new URLSearchParams instance sorted primarily by keys,
 * and secondarily by values if the keys are identical.
 */
export function sortSearchParamsByKeyThenValue(
  params: URLSearchParams
): URLSearchParams {
  const entries: [string, string][] = [];
  params.forEach((value, key) => {
    entries.push([key, value]);
  });

  return new URLSearchParams(
    entries.sort(([k1, v1], [k2, v2]) => {
      if (k1 === k2) return v1.localeCompare(v2);
      return k1.localeCompare(k2);
    })
  );
}