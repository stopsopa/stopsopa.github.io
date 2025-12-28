_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"

. "$_DIR/greetings.sh" || exit 1

hello "Tom"
goodbye "Bob"
