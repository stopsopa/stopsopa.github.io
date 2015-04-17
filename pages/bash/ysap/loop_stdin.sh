
# STOP=10 bash bash/out.sh 0.2 | /bin/bash pages/bash/ysap/loop_stdin.sh
while IFS= read -r line; do
    echo "loop_stdin: >$line<"
done
