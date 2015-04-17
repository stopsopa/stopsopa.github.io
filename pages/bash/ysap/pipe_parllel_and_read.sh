
if [ ! -p ../pipe ]; then mkfifo ../pipe; fi
exec {fd}<>../pipe
client() {
    local name=$1
    while true; do
        echo "[client $name] hello" >&$fd
        sleep 3
    done
}

client foo &
client bar &
client baz &    

while read -u $fd -r line || [[ -n $line ]]; do
    echo "[read line] $line"
done