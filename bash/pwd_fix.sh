# Example usage:
#
# find . \( \
#   -type d -name node_modules -prune -o \
#   -type d -name .git -prune -o \
#   -type d -name coverage -prune \
# \) \
# -o \
# -type f \( \
#   -name '*.sh' \
# \) \
# -print | NODE_OPTIONS= /bin/bash ./bash/pwd_fix.sh

# Read file paths line by line from stdin
while IFS= read -r file; do
  # Skip empty lines or if file does not exist
  if [[ -z "${file}" || ! -f "${file}" ]]; then
    continue
  fi

  # Check if file contains _PWD="$(pwd)"
  if grep -q '_PWD="$(pwd)"' "${file}"; then
    node -e '
      const fs = require("fs");
      const file = process.argv[1];
      let content = fs.readFileSync(file, "utf8");

      // Match the case statement that defines _DIR/_0/_SCRIPT/_BINARY/_PWD across zsh, sh, and *)
      // Replaces _PWD="$(pwd)" inside each case branch and appends _PWD="$(pwd)" after esac
      const caseRegex = /(case\s+["\x27]?\$\{?_SHELL\}?["\x27]?\s+in[\s\S]*?esac)/g;

      let replaced = false;
      const newContent = content.replace(caseRegex, (match) => {
        if (!match.includes("_PWD=\"$(pwd)\"")) {
          return match;
        }

        // Remove lines with _PWD="$(pwd)" and preceding whitespace inside the case block
        let updatedBlock = match.replace(/^[ \t]*_PWD="?\$\(pwd\)"?[ \t]*\r?\n?/gm, "");

        // Append _PWD="$(pwd)" after esac
        updatedBlock = updatedBlock + "\n_PWD=\"$(pwd)\"";
        replaced = true;
        return updatedBlock;
      });

      if (replaced && newContent !== content) {
        fs.writeFileSync(file, newContent, "utf8");
        console.log("Updated: " + file);
      }
    ' "${file}"
  fi
done
