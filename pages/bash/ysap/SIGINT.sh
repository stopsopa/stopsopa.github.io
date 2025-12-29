
func() {
    # hello world will be printed when you press Ctrl+C
    # but that will not stop the script
    # one have to press Ctrl+z to move to background
    # then see jobs
    # then call kill %1
    echo hello world
}

trap func SIGINT

while true; do
    sleep 1
    echo running...
done