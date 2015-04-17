_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"

. "$_DIR/greetings.sh" || exit 1

hello "Tom"
goodbye "Bob"
name="Start"
echo "before name = ${name}"
testthesameshell
# (testthesameshell) # you could run it in subshell during call
echo "after testthesameshell name = ${name}"
testsubshell
echo "after testsubshell name = ${name}"
