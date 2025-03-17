import restricttonode from "./libs/restrict-to-node.js";

import fs from "fs";

import path from "path";

import env from "./libs/dotenv.js";

import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

restricttonode(__filename);

const root = path.resolve(__dirname);

const vardir = path.resolve(root, "var");

// relative path to public server directory
const output = path.resolve(root, "public", "dist");

const node_modules = path.join(root, "node_modules");

const app = path.resolve(root, "pages");

const override = path.resolve(root, "override");

const envfile = path.resolve(".", ".env");

if (!fs.existsSync(envfile)) {
  throw new Error(`File ${envfile} doesn't exist`);
}

dotenv.config({
  path: envfile,
});

export default (mode) => ({
  // just name for this project, it's gonna show up in some places
  name: env("PROJECT_NAME"),
  root,
  app,
  node_modules,
  vardir,
  output,
  resolve: [
    // where to search by require and files to watch

    app,

    override,

    "node_modules", // https://github.com/ReactTraining/react-router/issues/6201#issuecomment-403291934
  ],
  js: {
    entries: [
      // looks for *.entry.{js|jsx} - watch only on files *.entry.{js|jsx}
      app,
      // ...
    ],
  },
});
