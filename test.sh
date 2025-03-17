
exec 3<> /dev/null
function red {
    printf "\e[91m$1\e[0m\n"
}
function green {
    printf "\e[32m$1\e[0m\n"
}

if [ "$1" = "--help" ]; then

cat << EOF

    /bin/bash $0 --help
    /bin/bash $0 --watch                        ## this will run only changed test
    /bin/bash $0 --watchAll                     ## this will run all test on every change
    /bin/bash $0 [--watch|--watchAll] tests/... ## will run one test file or dir with tests 
    /bin/bash $0 -t 'filter test'               ## this will run only tests matching the provided string

EOF

    exit 0
fi

set -e
set -x

# --bail \
# --detectOpenHandles \
# --silent=false \
# --verbose false \
# --detectOpenHandles \

# TEST="$(cat <<END
# node \
# --experimental-vm-modules \
# node_modules/.bin/jest \
# $@ \
# --runInBand \
# --verbose
# END
# )";

TEST="$(cat <<END
node node_modules/.bin/vitest run --coverage $@
END
)";

TEST="$(cat <<END
node node_modules/.bin/vitest run $@
END
)";



TEST="$(cat <<END
node node_modules/.bin/vitest run --coverage $@
END
)";

TEST="$(cat <<END
node node_modules/.bin/vitest run $@
END
)";


{ green "\n\n    executing tests:\n        $TEST\n\n"; } 2>&3

$TEST

STATUS=$?

if [ "$STATUS" = "0" ]; then

    { green "\n    Tests passed\n"; } 2>&3
else

    { red "\n    Tests crashed\n"; } 2>&3

    exit $STATUS
fi
