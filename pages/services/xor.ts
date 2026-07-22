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

const PASSWORD =
  "JQ2$!R&#8r01Z#55icY!*q0dAEDZkUBu61k&uBHAeRf*rr#Q9R%7yliBYV6BJ7^^soTz88&8gWH$O*Ex*v2nRQHCrOON4jzoHhKNAkOIOp38T%O%mMs%6fHW$vZy2&ov";

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
