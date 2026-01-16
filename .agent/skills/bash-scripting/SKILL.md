---
name: bash-scripting
description: Instructions in case if any bash (or any shell in general) script is needed.
---

When determining where script is if needed, always use

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

Don't use shebang at the top of the file.

Call script like this:

/bin/bash ${DIR}/script.sh

When using variables always surround them with ${}.

never $DIR, always ${DIR}
