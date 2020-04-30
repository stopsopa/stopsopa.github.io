
trim() {
    local var="$*"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "$var"
}

_CMD="doctl kubernetes cluster list --format \"Name\" --no-header"

_LIST="$(eval "$_CMD")"

_CODE="$?"

_LIST="$(trim "$_LIST")"

if [ "$_CODE" != "0" ]; then

    echo ""
    echo "$0 error:"
    echo -e "command:\n    $_CMD"
    echo "has crushed with status code: >>$_CODE<<"
    echo ""

    exit $_CODE;
fi

_LINES="$(echo "$_LIST" | wc -l)"

_LINES="$(trim "$_LINES")"

if [ "$_LIST" = "" ] || [ "$_LINES" -lt "1" ]; then

    echo "No clusters found"

    exit 1
fi

echo "Choose from available DigitalOcean clusters:"

i="1"
for name in $_LIST
do
    echo "$i) ${name}"

    i=$(($i + 1))
done

CLUSTER=""

TEST="^[0-9]+$"

while : ; do

    printf ">"

    read i

    if ! [[ $i =~ $TEST ]]; then

        echo "given value ($i) be an integer"

        echo "try again:"

        continue;
    fi

    if [[ "$i" -lt "1" ]] || [ "$i" -gt "$_LINES" ]; then

        echo "given value ($i) should be an integer > 0 but <= than $_LINES"

        echo "try again:"

        continue;
    fi

    CLUSTER="$(echo "$_LIST" | sed -n "$i p")"

    break;
done

_CMD="doctl kubernetes cluster kubeconfig save \"$CLUSTER\""

_LIST="$(eval "$_CMD")"

_CODE="$?"

_LIST="$(trim "$_LIST")"

if [ "$_CODE" != "0" ]; then

    echo ""
    echo "$0 error:"
    echo -e "command:\n    $_CMD"
    echo "has crushed with status code: >>$_CODE<<"
    echo ""

    exit $_CODE;
fi

kubectl get no

echo -e "\n    all good switched to cluster $CLUSTER\n"