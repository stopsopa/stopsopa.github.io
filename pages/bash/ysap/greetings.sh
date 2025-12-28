

goodbye() {
    echo "Goodbye, $1"
}

hello() {
    echo "Hello, $1"
}
# https://youtu.be/Sx9zG7wa4FA?t=15240
testthesameshell() {
    name="Bob"
    echo "Hello, $name"
}
testsubshell() (
    name="John"
    echo "Hello, $name"
)

if ! (return 2>/dev/null); then
    # that works only in bash (no zsh, nor sh)
    goodbye "Test"
    hello "Test"
    testthesameshell
    testsubshell
fi