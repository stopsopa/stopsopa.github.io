

# LINES="$(printf 'one\ntwo\nthree\n')"
LINES="$(printf 'one\ntwo\nthree')"
while IFS= read -r line || [[ -n $line ]]; do
    echo "LINE: >$line<"
done <<< "$LINES"