
/**
 * Continuous SSH file synchronization
 * In other words:
 * I have watch on directory what is registered as create/update/delete is passed through gitignore.ts [ignorefile]
 * then what is ignored goes to it's stderr and what is not goes to stdout
 * then we pipe stdout to script sync.sh which is responsible by syncing via rsync to remote in batches
 *
 * Usage:
 *   export SSH_USER="administrator"
 *   export SSH_HOST="192.5.56.23"
 *   export SSH_DIR="/opt/dir/"
 *
 *   node test.ts | node scripts/sync/sync.ts
 *
 * assiming test.ts produces:
*
 *   update scripts/sync/filter-gitignored.ts
 *   update scripts/INTRODUCE.sh
 *   update scripts/INTRODUCE.sh
 *   update scripts/sync/package.json
 *   update scripts/sync/package.json
 *   create scripts/sync/log.log
 *   deleted scripts/sync/log.log
 *
 * 
 * How it works:
 *
 * 1. Reads filesystem events from stdin, produced by `node test.ts`.
 *    Expected format:
 *      update scripts/sync/filter-gitignored.ts
 *      create scripts/sync/log.log
 *      deleted scripts/sync/log.log
 *
 * 2. Batches incoming events for 300 ms to avoid starting a separate
 *    synchronization operation for every individual filesystem event.
 *
 * 3. Checks the current local filesystem state of each affected path:
 *    - Existing files are uploaded using rsync over SSH.
 *    - Missing files are deleted from the remote directory using SSH.
 *
 * 4. Remote destination:
 *      ${SSH_USER}@${SSH_HOST}:${SSH_DIR}
 *
 * SSH interaction:
 *
 * - rsync establishes an SSH connection to upload existing files.
 * - ssh runs a remote `rm` command for each deleted file.
 * - By default, these commands may establish separate SSH connections.
 * - Configure SSH ControlMaster/ControlPersist in ~/.ssh/config if you
 *   want to reuse a persistent SSH connection across commands.
 *
 * Important:
 *
 * - Paths emitted by the producer must be relative to the local project root.
 * - Run this script from that project root.
 * - This script synchronizes individual affected files, not entire directory
 *   trees. Directory creation, renames, and complex deletion cases may need
 *   additional handling.
 */


import { createInterface } from "node:readline";
import { spawn } from "node:child_process";
import { lstat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const sshUser = process.env.SSH_USER;
const sshHost = process.env.SSH_HOST;
const sshDir = process.env.SSH_DIR;

if (!sshUser || !sshHost || !sshDir) {
  console.error("Required env vars: SSH_USER, SSH_HOST, SSH_DIR");
  process.exit(1);
}

const remoteDir = sshDir.endsWith("/") ? sshDir : `${sshDir}/`;
const destination = `${sshUser}@${sshHost}:${remoteDir}`;

const debounceMs = 300;

const pending = new Set<string>();
let timer: ReturnType<typeof setTimeout> | undefined;
let running = false;

function schedule(file: string) {
  const absolute = path.resolve(root, file);

  if (absolute !== root && !absolute.startsWith(root + path.sep)) {
    console.error(`Ignoring path outside project: ${file}`);
    return;
  }

  pending.add(path.relative(root, absolute));
  clearTimeout(timer);
  timer = setTimeout(() => void sync(), debounceMs);
}

function run(command: string, args: string[]): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
    });

    child.on("error", (error) => {
      console.error(`${command} failed:`, error.message);
      resolve(1);
    });

    child.on("close", (code) => resolve(code ?? 1));
  });
}

async function sync() {
  if (running || pending.size === 0) return;

  running = true;

  const files = [...pending];
  pending.clear();

  const existing: string[] = [];
  const deleted: string[] = [];

  for (const file of files) {
    try {
      await lstat(path.resolve(root, file));
      existing.push(file);
    } catch {
      deleted.push(file);
    }
  }

  let failed = false;

  if (existing.length > 0) {
    const args = [
      "-az",
      "--relative",
      "--",
      ...existing.map((file) => `./${file}`),
      destination,
    ];

    if ((await run("rsync", args)) !== 0) {
      failed = true;
    }
  }

  for (const file of deleted) {
    const remotePath = `${remoteDir}${file}`;

    const status = await run("ssh", [
      `${sshUser}@${sshHost}`,
      "rm",
      "-f",
      "--",
      remotePath,
    ]);

    if (status !== 0) failed = true;
  }

  running = false;

  if (failed) {
    console.error("Sync failed. Change a file to retry.");
  }

  if (pending.size > 0) {
    void sync();
  }
}

const input = createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

input.on("line", (line) => {
  console.log(`\x1b[32m${line}\x1b[0m`);
  
  const match = /^(?:create|update|deleted)\s+(.+)$/.exec(line);

  if (match) {
    schedule(match[1]);
  }
});

input.on("close", () => {
  clearTimeout(timer);
  if (pending.size > 0) void sync();
});
