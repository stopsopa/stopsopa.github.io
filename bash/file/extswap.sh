# cat <<EEE | IN=ts OUT=js /bin/bash bash/file/extswap.sh
# 
# 
# abc.ts
# dir/ttt/file.ts
# another/stuff.ts
# 
# 
# EEE
#
# bash slow line producer:
# (echo "abc.ts"; sleep 0.5; echo ""; sleep 1; echo "dir/ttt/file.ts"; sleep 0.3; echo "another/stuff.ts") | IN=ts OUT=js /bin/bash bash/file/extswap.sh
#
# python slow line producer:
# python3 -c 'import time, sys; [ (sys.stdout.write(l + "\n"), sys.stdout.flush(), time.sleep(d)) for l, d in [("abc.ts", 0.5), ("", 0.2), ("dir/ttt/file.ts", 1.0), ("another/stuff.ts", 0.4)] ]' | IN=ts OUT=js /bin/bash bash/file/extswap.sh

export IN="${IN:-ts}"
export OUT="${OUT:-js}"

while IFS= read -r line || [ -n "$line" ]; do
  trimmed="$(echo "$line" | xargs)"
  if [ -z "$trimmed" ]; then
    continue
  fi
  echo "$line" | sed "s/\.${IN}$/\.${OUT}/"
done