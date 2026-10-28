/**
 * 
 * regular use of fswatch like:
 *  fswatch -r -x --event-flag-separator=, .
 * 
 * produces
    /Users/szdz/Workspace/STOPSOPA__telazekah-machines/STOPSOPA__telazekah-machines/scripts/sync/transform.ts AttributeModified,IsFile,Updated
    /Users/szdz/Workspace/STOPSOPA__telazekah-machines/STOPSOPA__telazekah-machines/lab/ui/types.sh AttributeModified,IsFile,Updated
    /Users/szdz/Workspace/STOPSOPA__telazekah-machines/STOPSOPA__telazekah-machines/lab/ui/pnpm-lock.yaml AttributeModified,IsFile,Updated
    /Users/szdz/Workspace/STOPSOPA__telazekah-machines/STOPSOPA__telazekah-machines/lab/ui/log.log Created,IsFile
    /Users/szdz/Workspace/STOPSOPA__telazekah-machines/STOPSOPA__telazekah-machines/lab/ui/log.log Created,IsFile,Renamed

    and we pipe it to this script
    and we get
 
 fswatch -r -x --event-flag-separator=, . |  NODE_OPTIONS= node scripts/sync/transform.ts
update scripts/sync/transform.ts
update lab/ui/types.sh
update lab/ui/pnpm-lock.yaml
create lab/ui/log.log
deleted lab/ui/log.log
 *
 */
import { createInterface } from "node:readline";
import { lstat } from "node:fs/promises";
import path from "node:path";

const input = createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});


async function exists(file: string): Promise<boolean> {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

for await (const line of input) {
  // Split off the comma-separated flags at the end.
  // Greedy path matching also supports spaces in filenames.
  const match = /^(.*?)\s+([A-Za-z][A-Za-z,]*)$/.exec(line);

  if (!match) {
    console.error(`Unrecognized fswatch output: ${line}`);
    continue;
  }

  const [, rawPath, rawFlags] = match;
  const file = path.resolve(rawPath);
  const flags = new Set(rawFlags.split(","));

  try {
    let action: string;

    if (!(await exists(file))) {
      action = "deleted";
    } else if (flags.has("Created")) {
      action = "create";
    } else {
      action = "update";
    }

    const relativePath = path.relative(process.cwd(), file);

    console.log(`${action} ${relativePath}`);
  } catch (error) {
    console.error(`Failed to inspect ${rawPath}:`, error);
  }
}
