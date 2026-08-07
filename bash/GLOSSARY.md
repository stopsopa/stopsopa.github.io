# Bash Utility Scripts Index

This document provides a directory of bash utility scripts available in this directory, along with brief descriptions of their purpose.

## Featured: Running Processes with Custom Flags and Automatic Child Process Cleanup

- **`proc/run-with-flag-and-kill.sh`**:
  Designed specifically to launch a command with a unique flag (identifier string) so it can easily be filtered and killed via `ps aux | grep ${FLAG}`.
  It sets an `EXIT` trap (`trap 'kill -9 $(pgrep -P $$)' EXIT`) so that when the parent wrapper script is killed/exits, it automatically terminates all of its child processes.

---

## Script Index by Directory

### Core Root Utility Scripts (`/`)

- `ansi.sh`: Utility for formatting text output with ANSI color codes.
- `args.sh`: Argument parsing utility/helper for bash scripts.
- `basicauth.sh`: Generates Basic Authentication header strings.
- `colours.sh`: Terminal text coloring functions (red, green, yellow, cyan, etc.).
- `countdown.sh`: Displays a visual countdown timer in the terminal.
- `cptmp.sh`: Copies files/directories to temporary locations safely.
- `cutter.sh`: String cutter/manipulation helper tool.
- `divideInTwo.sh`: Splits input strings or content into two parts based on a delimiter.
- `dlogger.sh`: Debug logging helper function with timestamps/levels.
- `env.sh`: Environment variables loader and exporter helper.
- `envrender.sh`: Renders environment variable templates into configuration files.
- `exist-in-file.sh`: Checks if a specific string or pattern exists in a file.
- `exportsource.ts`: Helper script (Node.js) for exporting environment sources.
- `exportsource.sh`: Exports shell variables from `.env` files into current shell environment.
- `grepP.sh`: Wrapper for grep with Perl-compatible regular expressions (`grep -P`).
- `hardlink.sh`: Helper tool to manage or create hardlinks.
- `headtail.sh`: Displays beginning and ending lines of files or stream output.
- `inarray.sh`: Checks if an item exists within a bash array.
- `isMac.sh`: Checks if current operating system is macOS.
- `negotiatePort.sh`: Checks and allocates an available TCP network port.
- `out.sh`: Output formatting helper script.
- `platform.sh`: Detects OS platform and architecture details.
- `preg_quote.sh`: Escapes regular expression special characters in strings (similar to PHP `preg_quote`).
- `print_stdout_only_on_error.sh`: Runs a command quietly, printing stdout/stderr only if the command fails.
- `realpath.sh`: Polyfill/helper to resolve full absolute path of files or directories.
- `require_cmd.sh`: Asserts that specific CLI commands exist on system before proceeding.
- `require_non_empty_var.sh`: Asserts that required environment variables are set and non-empty.
- `sed.sh`: Helper wrappers for `sed` search and replace across files.
- `semver.sh`: Utility functions for parsing and comparing semantic versions (semver).
- `strip-colors-from-stdin.sh`: Removes ANSI color/escape codes from standard input stream.
- `substitute-variables-bash.sh`: Replaces `${VAR}` placeholders in files using bash environment variables.
- `swap-files.sh`: Swaps the filenames/locations of two specified files.
- `swap-files-v2.sh`: Swapped files helper script (version 2 with improved safety).
- `tee.ts`: TypeScript stream utility for piping and logging outputs.
- `test.sh`: Suite runner for bash script unit tests within the repository.
- `time-format.sh`: Formats seconds into human-readable duration strings (HH:MM:SS).
- `trim.sh`: String trimming utility (removes leading and trailing whitespace).
- `wget.sh`: Helper wrapper around `wget` or `curl` for downloading files.

---

### Process Management (`/proc`)

- `proc/run-with-flag-and-kill.sh`: Executes a command wrapped with a custom identification flag and traps exit to kill child processes.
- `proc/kill.sh`: Kills running processes matched by an environment flag string loaded from `.env`.
- `proc/killv2.sh`: Alias entry point importing `proc/reaper.sh` to terminate processes.
- `proc/reaper.sh`: Advanced process terminator script reading process lists from `ps aux` stdin or arguments to kill matched PIDs.
- `proc/keep-running-for-at-least.sh`: Executes a command and ensures execution time lasts at least N seconds (sleeping remaining duration).
- `proc/lock.sh`: Ensures exclusive process execution using OS-level lock files (`flock` on Linux / `lockf` on macOS).
- `proc/pid-is-running.sh`: Checks whether a process with a given PID is currently active.
- `proc/start.sh`: Starts background processes managed via `forever` using flag-based environment configurations.
- `proc/status.sh`: Checks running status of a background process by searching `ps aux` for flag identifiers.
- `proc/watchServer.sh`: Watches file changes and automatically restarts background processes.

---

### File System Utilities (`/fs`)

- `fs/break-file.sh`: Helper to break down or truncate files.
- `fs/can-write-to-file.sh`: Checks write permissions on target file paths.
- `fs/dev-tail.mjs`: Log file tailing script with enhanced output formatting.
- `fs/relative.mjs` / `fs/relative.ts`: Computes relative path between two target directories/files.
- `fs/rmdirrec.sh`: Recursive directory removal helper with safety checks.
- `fs/stat.js`: Retrieves file metadata and statistics (Node.js).
- `fs/touchWatch.js` / `fs/touchWatch.ts`: Triggers file touch events upon modifications.
- `fs/waitForFiles.sh`: Pauses execution until specified target files exist on disk.
- `fs/watch.cjs` / `fs/watch.js` / `fs/watch.ts`: File watcher utilities.
- `fs/watch_dir_and_rsync.sh`: Monitors directory for file changes and syncs via `rsync`.
- `fs/watch_files_in_dir.sh`: Monitors specific file extensions inside a directory for updates.

---

### File Editing (`/file`)

- `file/append.sh`: Appends content to target files safely.
- `file/replace.sh`: Replaces text inside target files using string or regex substitution.

---

### Deployment Scripts (`/deploy`)

- `deploy/relink.sh`: Re-creates symlinks for deployment releases.
- `deploy/version.sh` / `deploy/version-regular.sh`: Increments or updates release version numbers.

---

### Git Helpers (`/git` & `/gitwormhole`)

- `git/change-branch-to.sh`: Switches git branch safely.
- `git/get-tag-on-current-commit.sh`: Returns git tag associated with `HEAD`.
- `git/get-tags-of-current-branch.sh`: Lists git tags present on current active branch.
- `git/get-tags-remote.sh`: Fetches and lists tags from remote git repository.
- `git/is-commited.sh`: Checks whether current git workspace has uncommitted changes.
- `git/is-this-branch.sh`: Verifies if current branch matches expected branch name.
- `git/list-relative-branches.sh`: Lists git branches relative to main/master branch.
- `git/merge.sh`: Automates git branch merging operations.
- `git/pull-and-push-branch.sh`: Pulls latest changes, merges/rebases, and pushes to remote branch.
- `git/remove-remote-tags-not-matching-pattern.sh`: Deletes remote git tags not matching specified pattern.
- `git/semver-filter-tags.sh`: Filters git tags using semver comparison logic.
- `gitwormhole/pull.sh` / `gitwormhole/push.sh`: Scripts for syncing changes across git worktrees or branches.

---

### Docker & Kubernetes (`/docker-registry` & `/kuber`)

- `docker-registry/common.sh`: Common variables and authentication functions for Docker registry interaction.
- `docker-registry/list-image-tags.sh`: Queries Docker registry API to list tags for an image.
- `docker-registry/list-images.sh`: Queries Docker registry API to list available images.
- `kuber/auth-init-DO.sh`: Authenticates kubectl with DigitalOcean Kubernetes clusters.
- `kuber/create-secret-with-files-inside.sh`: Creates Kubernetes secret objects containing file contents.
- `kuber/determine-latest-tag.js`: Evaluates latest container image tag in repository.
- `kuber/extract-tag-from-running-deployment.sh`: Reads current container image tag from live Kubernetes deployment.
- `kuber/get-name-of-n-pod-of-the-deployment.sh`: Fetches N-th pod identifier string for a deployment.
- `kuber/switch-cluster.sh`: Helper to switch kubectl contexts between Kubernetes clusters.

---

### Node.js & Package Management (`/node` & `/pnpm`)

- `node/array.js` / `node/array_test.sh`: Array manipulation helpers in Node.js and shell.
- `node/coverage-badge-clean.sh` / `node/coverage-badge.js`: Generates test coverage badges.
- `node/env-var-inspect-node.sh`: Debugs environment variables inside Node.js processes.
- `node/esm.sh`: Runs Node.js with ES Module support flags.
- `node/is-port-free.js` / `node/is-port-free.ts`: Checks if specific TCP port is free.
- `node/keypress.cjs`: Terminal keypress listener utility.
- `node/sortsemver.js`: Sorts semver versions in JSON / array inputs.
- `node/versioncheck.js` / `node/versioncheck.ts`: Checks Node/npm engine versions.
- `node/yarn-install-one-by-one-separately.sh`: Installs yarn dependencies one by one to diagnose build failures.
- `pnpm/minimumReleaseAge.ts`: Checks package release age for pnpm dependencies.

---

### Database Helpers (`/mysql` & `/postgres`)

- `mysql/cleardb.sh`: Drops and recreates MySQL database schemas.
- `mysql/copytablesbetweendatabases.sh`: Copies tables across MySQL databases.
- `mysql/export.sh`: Dumps MySQL database to SQL file.
- `mysql/import.sh`: Imports SQL file into target MySQL database.
- `postgres/find_schema_name_in_sql.sh`: Finds schema names inside PostgreSQL dump files.
- `postgres/rename_schema_in_sql_file.sh`: Renames PostgreSQL schema references within SQL files.

---

### CI & Tooling (`/jenkins` & `/java`)

- `jenkins/checksum-built-already.sh`: Checks if build artifact matching commit checksum exists.
- `jenkins/clear_cache_step.sh`: Cleans Jenkins workspace and dependency caches.
- `jenkins/get-last-build-for-this-commit.sh`: Retrieves last Jenkins build status for git commit.
- `jenkins/run_as_root.sh`: Executes Jenkins pipeline steps with root privileges.
- `java/gjf.sh`: Formats Java source files using Google Java Format (`google-java-format`).
