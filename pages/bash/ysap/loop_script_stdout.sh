
while IFS= read -r line; do
    echo "loop_script_stdout: >$line<"
done < <(STOP=10 bash bash/out.sh 0.1)