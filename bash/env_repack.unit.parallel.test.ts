import assert from "node:assert";
import { describe, it } from "node:test";

import { iterateOverEnv, setEnvVar, unsetEnvVar, editEnvVar } from "./env_repack.ts";

/**
 * /bin/bash ts.sh --test bash/env_repack.unit.parallel.test.ts
 * node --test bash/env_repack.unit.parallel.test.ts
 */

describe("iterateOverEnv", () => {
  it("should extract env keys from body", () => {
    const body = `
# comment
DATABASE_URL=postgres://localhost
PORT=3000
# some more stuff
_SPECIAL = "some \" fsdds" # fdsfds
EMPTY=
`;

    assert.deepStrictEqual(iterateOverEnv(body), ["DATABASE_URL", "PORT", "_SPECIAL", "EMPTY"]);
  });

  it("should ignore comments and empty lines", () => {
    const body = `
# hello

KEY=value

JFSDDS= " ddf \" jfkdslfj "# fdjsafds
# another comment
SECOND=value
`;

    assert.deepStrictEqual(iterateOverEnv(body), ["KEY", "JFSDDS", "SECOND"]);
  });

  it("should support spaces before equals sign", () => {
    const body = `
KEY = value
OTHER=value
`;

    assert.deepStrictEqual(iterateOverEnv(body), ["KEY", "OTHER"]);
  });
});

describe("setEnvVar", () => {
  it("should update existing env variable", () => {
    const body = `
KEY="old"
OTHER="value"
`;

    const result = setEnvVar(body, "KEY", "new");

    assert.strictEqual(
      result,
      `
KEY="new"
OTHER="value"
`,
    );
  });

  it("should preserve inline comments when updating", () => {
    const body = `
ABC=d
PASSWORD="old" # keep this comment
CBA=2323
`;

    const result = setEnvVar(body, "PASSWORD", "new");

    assert.strictEqual(
      result.trim(),
      `ABC=d
PASSWORD="new" # keep this comment
CBA=2323`,
    );
  });

  it("no value", () => {
    const body = `
ABC=
PASSWORD="old" # keep this comment
CBA=2323
`;

    const result = setEnvVar(body, "PASSWORD", "new");

    assert.strictEqual(
      result.trim(),
      `ABC=
PASSWORD="new" # keep this comment
CBA=2323`,
    );
  });

  it("should escape quotes in value", () => {
    const body = "";

    const result = setEnvVar(body, "MESSAGE", 'hello "world"');

    assert.strictEqual(result.trim(), `MESSAGE="hello \\"world\\""`);
  });

  it("should append variable when it does not exist", () => {
    const body = `
KEY="value"
`;

    const result = setEnvVar(body, "NEW_KEY", "new value");

    assert.strictEqual(
      result,
      `
KEY="value"
NEW_KEY="new value"`,
    );
  });

  it("should append variable when env file has no trailing newline", () => {
    const body = 'KEY="value"';

    const result = setEnvVar(body, "NEW_KEY", "new value");

    assert.strictEqual(result, 'KEY="value"\nNEW_KEY="new value"');
  });

  it("should append variable when key is commented out", () => {
    const body = `
# NEW_KEY="old"
KEY="value"`;

    const result = setEnvVar(body, "NEW_KEY", "new value");

    assert.strictEqual(
      result,
      `
# NEW_KEY="old"
KEY="value"
NEW_KEY="new value"`,
    );
  });
});

describe("unsetEnvVar", () => {
  it("should remove existing env variable", () => {
    const body = `
FIRST="one"
REMOVE_ME="two"
LAST="three"
`;

    const result = unsetEnvVar(body, "REMOVE_ME");

    assert.strictEqual(
      result,
      `
FIRST="one"
LAST="three"
`,
    );
  });

  it("should do nothing when variable does not exist", () => {
    const body = `
FIRST="one"
`;

    const result = unsetEnvVar(body, "MISSING");

    assert.strictEqual(result, body);
  });

  it("should remove only matching variable", () => {
    const body = `
APP_KEY="one"
APP_KEY_SECOND="two"
`;

    const result = unsetEnvVar(body, "APP_KEY");

    assert.strictEqual(
      result,
      `
APP_KEY_SECOND="two"
`,
    );
  });
});

describe("editEnvVar", () => {
  it("should extract set and unset instructions", () => {
    const instructions = `
ENVVAR=value
TEST="val"
-TODELETE
-SOMETHINGELSE="DFDSA"
`;

    assert.deepStrictEqual(editEnvVar("", instructions), {
      set: {
        ENVVAR: "value",
        TEST: "val",
      },
      unset: ["TODELETE", "SOMETHINGELSE"],
    });
  });

  it("should handle spaces around equals", () => {
    const instructions = `
KEY = value
SECOND    =    "hello world"
`;

    assert.deepStrictEqual(editEnvVar("", instructions), {
      set: {
        KEY: "value",
        SECOND: "hello world",
      },
      unset: [],
    });
  });

  it("should unescape quotes inside quoted values", () => {
    const instructions = `
MESSAGE="hello \\"world\\""
`;

    assert.deepStrictEqual(editEnvVar("", instructions), {
      set: {
        MESSAGE: 'hello "world"',
      },
      unset: [],
    });
  });

  it("should ignore empty lines and comments", () => {
    const instructions = `
# comment

KEY=value

# another comment
`;

    assert.deepStrictEqual(editEnvVar("", instructions), {
      set: {
        KEY: "value",
      },
      unset: [],
    });
  });

  it("should ignore unset values", () => {
    const instructions = `
-REMOVE_ME="whatever"
`;

    assert.deepStrictEqual(editEnvVar("", instructions), {
      set: {},
      unset: ["REMOVE_ME"],
    });
  });

  it("should overwrite duplicated set keys with last value", () => {
    const instructions = `
KEY=first
KEY=second
`;

    assert.deepStrictEqual(editEnvVar("", instructions), {
      set: {
        KEY: "second",
      },
      unset: [],
    });
  });
});
