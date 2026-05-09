#!/bin/bash

# /bin/bash ___check.sh | tee ___check.log

# see TRANSPILATION.md

LIST="$(find pages/bash/xx -type f | sort)"

for FILE in $LIST; do
    if [ -f "$FILE" ]; then
        cat <<EEE
--------------------------------------------------------------------------------
FILE: $FILE
SIZE: $(stat -f%z "$FILE") bytes
--------------------------------------------------------------------------------
$(head -n 20 "$FILE")


EEE
    fi
done
