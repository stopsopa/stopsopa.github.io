#!/usr/bin/env bash

# for this one use: 
#  cp /usr/share/dict/web2 ../words && docker run -it -v "$(pwd):/opt"  -v "$(pwd)/../words:/usr/share/dict/words" -w /opt ubuntu:22.04 bash

a=2
b=3
(( c = a + b ))
echo "c is $c" 
    # will print c is 5

echo ---in if
a=10

# https://youtu.be/Sx9zG7wa4FA?t=10122
# if ((a % 2)); then # WARNING: DON'T DO THAT, THAT WILL BE odd
if ((a % 2 == 0)); then # be specific and use comparison operator
    echo "a is even"
else
    echo "a is odd"
fi

echo ---while
# set -e # WARNING: that will stop after first iteration, SO DON'T USE set -e with this syntax
i=0
while ((i < 10)); do
    echo "i is $i"
    ((i++))
done

echo ---octal pitfall
# a=07 # this is fine because 7 is max value in octal
# a=08 # but that is not ok
a=010 # this will yield 8
echo "${a}"
echo "$(( a ))"
echo "$(( 10#$a ))" # we are forcing to print it as decimal

echo ---while from file via variable # https://youtu.be/Sx9zG7wa4FA?t=10727
words="$(grep thunderw /usr/share/dict/words)" # this is not ideal because we are holding the value in memory

i=0
while read -r word; do
    echo "word is $word"
    ((i++))
# done < /usr/share/dict/words  # [PLACE 1]
done <<< "${words}"
echo "found $i words"

# better way is to use pipe https://youtu.be/Sx9zG7wa4FA?t=10813
# but there is a problem with incrementing i variable
i=0
grep thunderw /usr/share/dict/words | while read -r word; do
    echo "word is $word"
    ((i++))
done
echo "found $i words" # found 0 words <-- AND HERE IS A PROBLEM

echo ---lets use process substitution # https://youtu.be/Sx9zG7wa4FA?t=10960
i=0
while read -r word; do
    echo "word is $word"
    ((i++))
done < <(grep thunderw /usr/share/dict/words) # THIS IS IDENTICAL TO [PLACE 1] BUT WE ARE FAKING FILE with <()
echo "found $i words"
# WARNING: the problem with this approach is that we can't easily detect error from grep
# so run some checks before - like if file exists

echo ---unique words # https://youtu.be/Sx9zG7wa4FA?t=11438
declare -A unique
for item in "${@}"; do
  unique[$item]=1
done
declare -p unique
echo "found ${#unique[@]} unique words"
