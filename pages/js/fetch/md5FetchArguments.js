import sortObjectNested from "./sortObjectNested";

import md5 from "md5";

// the idea here is to generate some uniqe key from data passed to fetch
// in order to store it's response promises in cache under this key
export default function md5FetchArguments(url, opt) {
  const sorted = sortObjectNested([url, opt]);

  let method = opt?.method || "GET";

  method = method.toUpperCase();

  // normalizing method field to uppercase and setting it to GET if not defined
  if (typeof sorted?.[1]?.method === "string") {
    sorted[1].method = method;
  }

  const json = JSON.stringify(sorted);

  return `${url}:${method}:${md5(json)}`;
}
