# 
# This one is just first attempt on the way to understand tty/fd logic
# I would use these days simply -t 0 or -t 1
# https://stopsopa.github.io/pages/bash/index.html?admin:password#generate-stdout-with-color-no-matter-what-detect-interactive-detect-tty
# 

# /bin/bash pages/bash/ysap/is_a_terminal.sh
# /bin/bash pages/bash/ysap/is_a_terminal.sh | cat
if [[ -t 1 ]]; then
  echo "stdout is a terminal (is a tty)"
else
  echo "stdout is not a terminal (not a tty)"
fi