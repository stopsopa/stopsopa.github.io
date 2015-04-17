# /bin/bash pages/bash/ysap/write_pipe.sh
name=$1
if [ ! -p ../pipe ]; then mkdifo ../pipe; fi
while true; do
    echo "[client $name] hello" > ../pipe
    sleep 3
done