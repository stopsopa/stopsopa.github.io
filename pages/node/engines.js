const log = console.log;

const error = (msg) => {
  log(`general error: ${msg}`);

  process.exit(1);
};

const cmd = (function () {
  const { spawn } = require("child_process");

  const th = (msg) => new Error(`${__filename} error: ${msg}`);

  return (cmd, opt) =>
    new Promise((resolve, reject) => {
      if (typeof cmd === "string") {
        cmd = cmd.trim();

        if (!cmd) {
          throw th(`cmd is an empty string`);
        }

        cmd = cmd.split(/\s+/);
      }

      if (!Array.isArray(cmd)) {
        throw th(`cmd is not an array`);
      }

      if (!cmd.length) {
        throw th(`cmd is an empty array`);
      }

      const { verbose = false } = { ...opt };

      verbose && console.log(`executing command ${cmd.join(" ")}`);

      const [command, ...args] = cmd;

      const process = spawn(command, args);

      let stdout = "";

      let stderr = "";

      process.stdout.on("data", (data) => {
        stdout += String(data);
      });

      process.stderr.on("data", (data) => {
        stderr += String(data);
      });

      process.on("error", (e) => {
        verbose && console.log(`error: ${e.message}`);

        reject({
          cmd,
          stdout,
          stderr,
          e,
        });
      });

      process.on("close", (code) => {
        verbose && console.log(`child process ${cmd.join(" ")} exited with code ${code}`);

        if (code === 0) {
          resolve({
            cmd,
            stdout,
            stderr,
            code,
          });
        }

        reject({
          cmd,
          stdout,
          stderr,
          code,
        });
      });
    });
})();

if (typeof process.argv[2] !== "string") {
  throw new Error(`Please specify name of library to check in first argument`);
}

const name = process.argv[2].trim();

if (!name) {
  throw new Error(`Name of library can't be an empty string`);
}

async function getEngine(ver) {
  let res;

  try {
    res = await cmd(["yarn", "info", `${name}@${ver}`, "--json"]);

    if (res.code !== 0) {
      return "exec error 1";
    }
  } catch (e) {
    return "exec error 2";
  }

  try {
    return JSON.parse(res.stdout).data.engines.node;
  } catch (e) {
    return "! engines.node";
  }
}

(async function () {
  let res;

  try {
    res = await cmd(["yarn", "--version"]);

    if (res.code !== 0) {
      error("Yarn is not installed");
    }
  } catch (e) {
    error("Yarn is not installed");
  }

  try {
    res = await cmd(["yarn", "info", name, "--json"]);

    if (res.code !== 0) {
      error(`Can't fetch versions of the library '${name}': yarn info ${name}`);
    }
  } catch (e) {
    error(`Can't fetch versions of the library '${name}': yarn info ${name}`);
  }

  let versions;

  try {
    versions = JSON.parse(res.stdout).data.versions;
  } catch (e) {
    error(`Can't extract versions from command: yarn info ${name}, ${e}`);
  }

  const engines = {};

  log(versions);

  const len = versions.length;

  log(`number of versions: ${len}`);
  log("");

  let ver, engine;
  let i = 0;
  while ((ver = versions.pop())) {
    i += 1;

    engine = await getEngine(ver);

    log(String(i).padEnd(5, " "), String(ver).padEnd(20, " "), engine);
  }

  log("");
  log("end");
})();
