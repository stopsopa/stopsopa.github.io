
# /bin/bash pages/bash/ysap/loop_lines_from_file.sh
while IFS= read -r line || [[ -n $line ]]; do
    echo "FILE: >$line<"
done < pages/bash/ysap/lines.txt