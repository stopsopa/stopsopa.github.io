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
