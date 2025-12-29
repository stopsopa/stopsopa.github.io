
TXT="$(cat <<EEE
fun family party - 2022-12-29.jpg
not fun enemy party - 2022-12-29.jpg
EEE
)"

regex='^(.*) - ([0-9]{4}-[0-9]{2}-[0-9]{2})\..*$'


while IFS= read -r line; do
    # echo "line: >$line<"
    # continue;
    if ! [[ $line =~ $regex ]]; then
        echo "${0} error: >$line< does not match regex >${regex}<"
    fi

    name=${BASH_REMATCH[1]}
    date=${BASH_REMATCH[2]}
    echo "name: >$name<, date: >$date<"
done <<< "$TXT"

