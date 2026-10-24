---
name: bash-scripting
description: Instructions in case if any bash (or any shell in general) script is needed.
---

When determining where script is if needed, always use

Version A
```sh

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    _0="$( basename "${(%):-%N}" )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    _PWD="$(pwd)"
    ;;
  sh)
    # be carefull this will not work when sourcing this file in sh shell
    # will though work when called /bin/sh my_script.sh from any shell
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _0="$( basename "${0}" )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    _PWD="$(pwd)"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _0="$( basename "${BASH_SOURCE[0]}" )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    _PWD="$(pwd)"
    ;;
esac

```

I was using in the past

Version B
```sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
```
but I have discovered that just using that will not work in zsh. 
So from now on everywhere you see Version B just replace it with Version A.

also rename DIR to _DIR everywhere you do that modification

if refering something from ROOT directory is needed then define ROOT based on DIR in relative manner from current script like:

```sh
ROOT="$(cd "${DIR}/.." && pwd)"
# or
_ROOT="$(cd "${_DIR}/.." && pwd)"
```

or

```sh
ROOT="$(cd "${DIR}/../.." && pwd)"
# or
_ROOT="$(cd "${_DIR}/../.." && pwd)"
```

... depends how many directories up we have to go and which version of dir you derriving it from _DIR or DIR.

But to be specific:

- _DIR (preferred) or DIR is to determine current script location
- _ROOT (preferred) or ROOT is to determine project root location

When you have to go up from current script location use ../ or ../../ but the general target is to reach root directory of the project and then from there somewhere else then define ROOT by rerriving it from DIR and from that point use ROOT to reach wherever you need to reach.

WARNING: if you have no intetnion to use DIR or ROOT in your script then don't define it at all.

# shebang

<shebang-and-permissions>

Don't use shebang at the top of the file.
also (VERY IMPORTANT) never bother EVER to add executable permissions to shell scripts because I will always call them like this:

/bin/bash ${DIR}/script.sh

and I would ask you to also call it this way when you will be designing formation of scripts calling each other.

so never bother caring about script permissions - just ignore this case.

</shebang-and-permissions>

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

# colors



When using colors use 

```

GRAY=$'\033[38;5;244m'
BLACK=$'\033[30m'
RED=$'\033[31m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
BLUE=$'\033[34m'
MAGENTA=$'\033[35m'
CYAN=$'\033[36m'
WHITE=$'\033[37m'
BOLD=$'\033[1m'
REVERSE=$'\033[7m'
RESET=$'\033[0m'

```

or if file enter_esc.sh exist use 

```

source bash/enter_esc.sh;

```

which have these env vars defined in it

# heredoc

It is absolutely very important to always use heredoc the moment we have to print just 2 lines to the stdout or stderr.

and avoid formatting for every line when color spans across multiple lines like

```

    cat <<EEE

${YELLOW}line one${RESET}
${YELLOW}line two${RESET}
${YELLOW}line three${RESET}

EEE

```

use rather

```

    cat <<EEE
${YELLOW}
line one
line two
line three
${RESET}
EEE

```

<produce_value_for_variable>

when producing value for variable

```sh
LOCAL_MSG=$(echo "${LOCAL_COMMIT}" | cut -d' ' -f2-)
```

always wrap in quotes, because when value with spaces will be produced it might cause issues.
So use rather:


```sh
LOCAL_MSG="$(echo "${LOCAL_COMMIT}" | cut -d' ' -f2-)"
```

</produce_value_for_variable>

