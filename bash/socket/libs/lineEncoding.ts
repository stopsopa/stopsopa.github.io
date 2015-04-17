/**
 * Encodes arbitrary text so it can be transmitted through a line-based
 * message transport that does not support newline characters.
 *
 * Newlines are encoded as `\n`, while backslashes are escaped so that
 * existing `\n` sequences in the original text are preserved literally.
 *
 * The encoding is fully reversible: decode(encode(str)) === str.
 */
export function encode(str: string): string {
  return str.replaceAll("\\", "\\\\").replaceAll("\n", "\\n");
}

export function decode(str: string): string {
  let result = "";

  for (let i = 0; i < str.length; i++) {
    if (str[i] !== "\\") {
      result += str[i];
      continue;
    }

    if (str[i + 1] === "\\") {
      result += "\\";
      i++;
    } else if (str[i + 1] === "n") {
      result += "\n";
      i++;
    } else {
      result += "\\";
    }
  }

  return result;
}
