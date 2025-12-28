

goodbye() {
    echo "Goodbye, $1"
}

hello() {
    echo "Hello, $1"
}

if ! (return 2>/dev/null); then
    # that works only in bash (no zsh, nor sh)
    goodbye "Test"
    hello "Test"
fi