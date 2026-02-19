

# cat <<EEE > stuff.sh

# echo do something
# /bin/bash bash/countdown.sh 5 test
# echo a

# EEE
# /bin/bash stuff.sh

secs="$1"
msg="$2"

# Default message if not provided
: "${msg:=Sleeping}"

for ((i=secs; i>0; i--)); do
    printf '%s %d\r' "$msg" "$i"
    sleep 1
done

# Clear the line after finishing
printf '\r%*s\r' "$(( ${#msg} + ${#secs} + 1 ))" ""

exit 0