
# bash bash/out.sh
# bash bash/out.sh 0.5
# STOP=10 bash bash/out.sh 0.1
i=0
while true; do
  # if env var STOP is defined, break
  # but stop have to be a number and after that number of lines break
  if [ -n "$STOP" ] && [ "$STOP" -eq "$i" ]; then
    echo "Line $i - last"
    break;
  else
    echo "Line $i"
    sleep ${1:1}
  fi
  ((i++))
done