function mergeURLSearchParams(...args) {
  const result = new URLSearchParams();
  if (args.length === 0) return result;
  const filterIndex = args.findIndex((arg) => Array.isArray(arg));
  const filterKeys = filterIndex !== -1 ? args[filterIndex] : null;
  const filterSet = filterKeys ? new Set(filterKeys) : null;
  for (let i = 0; i < args.length; i++) {
    const params = args[i];
    if (params instanceof URLSearchParams) {
      const isFirstParams = i === args.findIndex((arg) => arg instanceof URLSearchParams);
      const uniqueKeys = /* @__PURE__ */ new Set();
      params.forEach((_, key) => uniqueKeys.add(key));
      const keys = Array.from(uniqueKeys);
      const keysToProcess = !isFirstParams && filterSet ? keys.filter((k) => filterSet.has(k)) : keys;
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
function cloneSearchParams(params) {
  return new URLSearchParams(params);
}
function normalizeSearchParams(params) {
  const result = new URLSearchParams(params);
  result.sort();
  return result;
}
function compareNormalizedSearchParams(a, b) {
  const na = normalizeSearchParams(a);
  const nb = normalizeSearchParams(b);
  return na.toString() === nb.toString();
}
function sortSearchParamsByKeyThenValue(params) {
  const entries = [];
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
function syncURLSearchParams(base, governedKeys, ...sources) {
  const result = new URLSearchParams(base);
  const keys = Array.isArray(governedKeys) ? governedKeys : Array.from(governedKeys);
  for (const source of sources) {
    for (const key of keys) {
      if (source.has(key)) {
        result.delete(key);
        source.getAll(key).forEach((value) => {
          result.append(key, value);
        });
      } else {
        result.delete(key);
      }
    }
  }
  result.sort();
  return result;
}
export {
  cloneSearchParams,
  compareNormalizedSearchParams,
  mergeURLSearchParams,
  normalizeSearchParams,
  sortSearchParamsByKeyThenValue,
  syncURLSearchParams,
};
