import { fileURLToPath } from "node:url";
import { dirname, relative } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = __dirname;

export default root;

export function filenameRelative(import_meta_url: string) {
  const __filename = fileURLToPath(import_meta_url);

  return relative(root, __filename);
}
