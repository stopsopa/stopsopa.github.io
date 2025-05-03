
# -P (Perl-compatible regular expressions) is not supported by standard
# grep (BSD grep, GNU compatible) 2.6.0-FreeBSD 
# from mac
# it works though in standard ubuntu linux used in GithubActions
# so for mac we have to install it with
# brew install grep
# and use it with
# ggrep --version

# this script serves as a bridge detecting that and using grep or ggrep and passing all arguments to it

# so now instead of calling 'grep [args]' call /bin/bash bash/grepP.sh [args]

if [ "$(/bin/bash bash/isMac.sh)" = "yes" ]; then
    ggrep --version > /dev/null 2>&1
    if [ "${?}" != "0" ]; then
        cat <<EEE
Install ggrep supporting -P for mac: 

brew install grep

after installing atm it is: 
------ vvv - from ggrep --version
ggrep (GNU grep) 3.12
Packaged by Homebrew
Copyright (C) 2025 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <https://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by Mike Haertel and others; see
<https://git.savannah.gnu.org/cgit/grep.git/tree/AUTHORS>.

grep -P uses PCRE2 10.45 2025-02-05
------ ^^^

native grep preinstalled on mac doesn't support -P option
------ vvv - from grep --version
grep (BSD grep, GNU compatible) 2.6.0-FreeBSD
------ ^^^
EEE

exit 1;
    fi

    set -e

    exec ggrep "${@}"
else
    set -e

    exec grep "${@}"
fi
