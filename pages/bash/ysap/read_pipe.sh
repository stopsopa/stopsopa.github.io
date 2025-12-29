# /bin/bash pages/bash/ysap/read_pipe.sh
if [ ! -p ../pipe ]; then mkfifo ../pipe; fi
while true; do
    # while read -r line; do 
    # that will not work with >printf '%s' hello > ../pipe<

    while read -r line || [[ -n $line ]]; do 
    # adding  || [[ -n $line ]] helps to handle >printf '%s' hello > ../pipe<
    # pay attention that we are not sending \n into the printf 

        echo "[read line] $line"
    done < ../pipe    
done