function gitignoreToFindArgs(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("!"));

  const args = [];

  for (const rule of lines) {
    if (rule.endsWith("/")) {
      const dir = rule.slice(0, -1);
      args.push(`-not -path "*/${dir}/*"`);
    } else if (rule.includes("/")) {
      args.push(`-not -path "*/${rule}"`);
    } else {
      args.push(`-not -name "${rule}"`);
    }
  }

  return args.join(" ");
}

import fs from "fs";

const ignore = fs.readFileSync(".myignore", "utf8");

console.log(gitignoreToFindArgs(ignore));
