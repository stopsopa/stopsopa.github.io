# /bin/bash pages/bash/ysap/is_a_terminal.sh
# /bin/bash pages/bash/ysap/is_a_terminal.sh | cat
if [[ -t 1 ]]; then
  echo "stdout is a terminal (is a tty)"
else
  echo "stdout is not a terminal (not a tty)"
fi