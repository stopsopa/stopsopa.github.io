import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");

const th = (msg: string) => new Error(`${path.relative(root, __filename)} error: ${msg}`);

export default function template(inputfile: string): string {
  const inputfiledir = path.dirname(inputfile);

  if (typeof inputfile !== "string") {
    throw th(`input file not specified`);
  }

  if (!fs.existsSync(inputfile)) {
    // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

    throw th(`file '${inputfile}' doesn't exist`);
  }

  const content = fs.readFileSync(inputfile, "utf8").toString();

  let data = content;

  data = data.replace(/([ \t]*)<%([a-z]+)\s*(.*?)\s*%>/g, (_: string, space: string, type: string, file: string) => {
    const normalizedSpace = space.replace(/\t/g, "  ");
    const prefix = " ".repeat(normalizedSpace.length);

    let resolvedFile: string;
    if (file.startsWith("/")) {
      resolvedFile = path.resolve(root, file.slice(1));
    } else {
      resolvedFile = path.resolve(inputfiledir, file);
    }

    if (!fs.existsSync(resolvedFile)) {
      // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

      throw th(`file '${resolvedFile}' doesn't exist`);
    }

    const fileContent = fs
      .readFileSync(resolvedFile, "utf8")
      .split(/\n/g)
      .map((line) => `${prefix}${line}`)
      .join("\n");

    if (type === "url") {
      return fileContent.replace(/"/g, "%22");
    }

    if (type === "inject") {
      return fileContent;
    }

    if (type === "script") {
      return fileContent.replace(/<\/script>/gi, "&lt;/script>");
    }

    throw th(
      `Template file '${inputfile}' contains unsupported <%${type} ... %> placeholder, supported are <%url ... %>, <%inject ... %> and <%script ... %>`
    );
  });

  const warning = `<!--

WARNING: 
File was created by /bin/bash scripts/template.ts template engine.
Edit template instead of this file
WARNING: 

WARNING: 
File was created by /bin/bash scripts/template.ts template engine.
Edit template instead of this file
WARNING: 

WARNING: 
File was created by /bin/bash scripts/template.ts template engine.
Edit template instead of this file
WARNING: 

WARNING: 
File was created by /bin/bash scripts/template.ts template engine.
Edit template instead of this file
WARNING: 

-->`;

  return `${warning}${data}`;
}

export function templateToFile(inputfile: string, output: string): void {
  if (typeof inputfile !== "string") {
    throw th(`input file not specified`);
  }

  if (typeof output !== "string") {
    throw th(`output file not specified`);
  }

  if (fs.existsSync(output)) {
    // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

    fs.unlinkSync(output);
  }

  const content = template(inputfile);

  fs.writeFileSync(output, content);
}

export function templateToDeterminedFile(inputfile: string): string {
  // check if file ends with .template.html
  if (!inputfile.endsWith(".template.html")) {
    throw th(`file '${inputfile}' doesn't end with .template.html`);
  }

  const output = inputfile.replace(/\.template\.html$/, ".rendered.html");

  templateToFile(inputfile, output);

  return output;
}
