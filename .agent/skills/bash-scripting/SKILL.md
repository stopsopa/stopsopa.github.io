---
name: bash-scripting
description: Instructions in case if any bash (or any shell in general) script is needed.
---

When determining where script is if needed, always use

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if refering something from ROOT directory is needed then define ROOT based on DIR in relative manner from current script like:

ROOT="$(cd "${DIR}/.." && pwd)"

or

ROOT="$(cd "${DIR}/../.." && pwd)"

... depends how many directories up we have to go

But to be specific:

- DIR is to determine current script location
- ROOT is to determine project root location
  Depending from where you refer to the files use this or that

When you have to go up from current script location use ../ or ../../ but the general target is to reach root directory of the project and then from there somewhere else then define ROOT by rerriving it from DIR and from that point use ROOT to reach wherever you need to reach.

WARNING: if you have no intetnion to use DIR or ROOT in your script then don't define it at all.

# shebang

Don't use shebang at the top of the file.

Call script like this:

/bin/bash ${DIR}/script.sh

When using variables always surround them with ${}.

never $DIR, always ${DIR}

# types of conditions

always prefer these more modern double square bracket syntax for conditions:

if [[...]]; then

over

if [ ... ]; then

# error handling

Before exit with non zero exit code from script in case of error always print the message what's happened like so:

echo "${0} error: [and then message here]"

this way we will spit out information about origin of the error - when it comes to which script is it.

Add to the message any relevent parameters values like so

"name of env var MY_ENV_VAR=>${MY_ENV_VAR}<"

(surround with ><, this way I will see any whitespaces at the beginning or end of the value)

Use `npm run lint:bash` (requires `shellcheck`) to verify script quality.

# print to stdout

if using echo to print multiple lines to the stdout then prefer heredoc notation like

```
cat <<EEE

  my multiline message

EEE

```
