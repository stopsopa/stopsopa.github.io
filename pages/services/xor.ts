/** @es.ts 
{
   mode: "bundle",
  "target": "esnext",
  "loader": "ts",
  "format": "esm",
  "charset": "utf8",
  "minify": false,
  "extension": ".js"
}
@es.ts */

import * as LZString from "lz-string";

const PASSWORD = "my-super-long-random-password-change-this-to-something-very-long-8d5a9b74d3c1e2f";

function xor(data: string, key: string): string {
  let result = "";

  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }

  return result;
}

export function encode(text: string): string {
  return LZString.compressToEncodedURIComponent(xor(text, PASSWORD));
}

export function decode(encoded: string): string {
  const compressed = LZString.decompressFromEncodedURIComponent(encoded);

  if (compressed === null) {
    throw new Error("Invalid encoded string");
  }

  return xor(compressed, PASSWORD);
}
