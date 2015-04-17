#!/usr/bin/env bash

if ! declare -A arr 2>/dev/null; then
    echo "${0} error: associative arrays are not supported"
    exit 1
fi

echo all good

declare -A arr
arr=(
    [key1]=value1
    [key2]=value2
)
arr[key3]=value3
declare -p arr  
# will print: declare -A arr=([key2]="value2" [key3]="value3" [key1]="value1" )
echo ${arr[key2]}
echo ${arr["key3"]}
echo ${arr["fake"]}
echo ---loop
for key in "${!arr[@]}"; do
    echo "element $key=${arr[$key]}"
done
# unset key2
unset arr[key2]
declare -p arr
echo ----use IFS \(Internal Field Separator\) # https://youtu.be/Sx9zG7wa4FA?t=8896
echo "IFS=>${IFS}< ${arr[*]} keys >${!arr[*]}<"
IFS=","
echo "IFS=>${IFS}< ${arr[*]} keys >${!arr[*]}<"
unset IFS
echo "IFS after unset=>${IFS}< ${arr[*]} keys >${!arr[*]}<"
echo or use subshell
(IFS=";"; echo "IFS=>${IFS}< ${arr[*]} and keys >${!arr[*]}<")
echo "and after subshell IFS=>${IFS}< ${arr[*]} keys >${!arr[*]}<"
# will print: declare -A arr=([key3]="value3" [key1]="value1")

