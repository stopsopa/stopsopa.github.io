
# Script to safely checkout to different branch
# /bin/bash change-branch.sh master

target="$1"


_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

source "$_DIR/../colours.sh";

if [ "$#" -lt 1 ] ; then

    { red "\n[error] At least one argument expected, like: \n\n    /bin/bash $0 \"branch-to-merge\" \n"; } 2>&3

    exit 1;
fi

git merge $target --no-edit

if [[ $? != 0 ]]; then

    { red "[error] merging branch '$target' - failure"; } 2>&3

    exit 1;
fi

{ green "[ok] merging branch '$target' - success"; } 2>&3