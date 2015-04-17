
# cli native realpath seems to not always resolve paths where path is pointing to non existing dir or file
# node version of this utility seems to be working in this scenario
#
# weird thig is that I remember that it was working before
# but at this stage I can't be 100% sure
#
# ... hence this ponyfill

# this will transform path:
# ~/test/myfile.txt
# into
# /home/mysuer/test/myfile.txt
# it's here mainly to handle resolving ~
# no matter if feeded into script this way:
# bin/bash bash/realpath.sh ~/test/myfile.txt
# or this way:
# bin/bash bash/realpath.sh "~/test/myfile.txt"
eval RESOLVED="${1}"

python --version 1> /dev/null 2> /dev/null

if [ "${?}" = "0" ]; then

    python -c "import os,sys; sys.stdout.write(os.path.abspath(sys.argv[1]))" "${RESOLVED}"

    exit 0
fi

node --version 1> /dev/null 2> /dev/null

if [ "${?}" = "0" ]; then

    node -e "process.stdout.write(require('path').resolve(process.cwd(), \"${RESOLVED}\" || '.'))"

    exit 0
fi

echo -n "${0} error: neither python nor node is installed"

exit 1