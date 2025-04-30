/**
 * It's node.js helper for scripts/template.sh
 */

import path from "path";

import fs from "fs";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");

const cp = [...process.argv];

const output = cp.pop();

const inpufile = cp.pop();

const inputfiledir = path.dirname(inpufile);

if (typeof inpufile !== "string") {
  throw new Error(`input file not specified`);
}

if (typeof output !== "string") {
  throw new Error(`output file not specified`);
}

if (!fs.existsSync(inpufile)) {
  // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

  throw new Error(`file '${inpufile}' doesn't exist`);
}

if (fs.existsSync(output)) {
  // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

  fs.unlinkSync(output);
}

const content = fs.readFileSync(inpufile, "utf8").toString();

let data = content;

data = data.replace(/([ \t]*)<%([a-z]+)\s*(.*?)\s*%>/g, (_, space, type, file) => {
  space = space.replace(/\t/g, "  ");

  const prefix = " ".repeat(space.length);

  if (file.substr(0, 1) === "/") {
    file = path.resolve(root, file.substr(1));
  } else {
    file = path.resolve(inputfiledir, file);
  }

  if (!fs.existsSync(file)) {
    // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

    throw new Error(`file '${file}' doesn't exist`);
  }

  const data = fs
    .readFileSync(file, "utf8")
    .toString()
    .split(/\n/g)
    .map((line) => `${prefix}${line}`)
    .join("\n");

  if (type === "url") {
    return data.replace(/"/g, "%22");
  }

  if (type === "inject") {
    return data;
  }

  throw new Error(
    `Template file '${inpufile}' contains unsupported <%${type} ... %> placelholder, supported are <%url ... %> and <%inject ... %>`
  );
});

fs.writeFileSync(
  output,
  `<!--

WARNING: 
File was created by /bin/bash scripts/template.sh template engine.
Edit template instead of this file
WARNING: 

WARNING: 
File was created by /bin/bash template.sh template engine.
Edit template instead of this file
WARNING: 

WARNING: 
File was created by /bin/bash scripts/template.sh template engine.
Edit template instead of this file
WARNING: 

WARNING: 
File was created by /bin/bash template.sh template engine.
Edit template instead of this file
WARNING: 

-->${data}`
);

console.log(`node: generated  "${output}"`);
