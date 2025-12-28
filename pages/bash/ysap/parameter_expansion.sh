

S="dave eddy"
echo "${#S}" # prints >9< - works in all shells

# echo "${S^}" # Dave eddy - in bash:4.1 & bash:4.4 & bash:5.1
#     # throw in zsh       *.sh:6: bad substitution
#     # throw in bash:3.1  *.sh: line 6: ${S^}: bad substitution
#     # throw in sh:2      *.sh: 6: Bad substitution

# echo "${S^^}" # DAVE EDDY - in bash:4.1 & bash:4.4 & bash:5.1
#     # throw in zsh       *.sh:6: bad substitution
#     # throw in bash:3.1  *.sh: line 6: ${S^^}: bad substitution
#     # throw in sh:2      *.sh: 6: Bad substitution

# echo "${S^^d}" # Dave eDDy - in bash:4.1 & bash:4.4 & bash:5.1
#     # throw in zsh       *.sh:6: bad substitution
#     # throw in bash:3.1  *.sh: line 6: ${S^^d}: bad substitution
#     # throw in sh:2      *.sh: 6: Bad substitution

# echo "${S^^[da]}" # DAve eDDy - in bash:4.1 & bash:4.4 & bash:5.1
#     # throw in zsh       *.sh:6: bad substitution
#     # throw in bash:3.1  *.sh: line 6: ${S^^[da]}: bad substitution
#     # throw in sh:2      *.sh: 6: Bad substitution

# S="DAVE EDDY"    
# echo "${S,,}" # dave eddy - in bash:4.1 & bash:4.4 & bash:5.1
#     # throw in zsh       *.sh:6: bad substitution
#     # throw in bash:3.1  *.sh: line 6: ${S,,}: bad substitution
#     # throw in sh:2      *.sh: 6: Bad substitution

name=${1:-dave} # set to "dave" if ${1} is empty or unset
echo ">${name}<"

# bash pages/bash/ysap/parameter_expansion.sh test
# bash pages/bash/ysap/parameter_expansion.sh 
name=${1:-${HOSTNAME}} # set to "dave" if ${1} is empty or unset
echo "user >${name}<"


name=${1?"missing name"}
# name=${1:?"missing name"} # that will not even accept empty string. SURPRISINGLY IT WORKS THE SAME WHEN IT COMES TO SHELLS SUPPORT AS ${1?"missing name"} -> the same error behaviour
echo "user >${name}<"
# https://youtu.be/Sx9zG7wa4FA?t=16326
# when not specified arg: bash pages/bash/ysap/parameter_expansion.sh
# will print in bash 4.1:   pages/bash/ysap/parameter_expansion.sh: line 40: 1: missing name
# will print in bash 4.4:   pages/bash/ysap/parameter_expansion.sh: line 40: 1: missing name
# will print in bash 5.1:   pages/bash/ysap/parameter_expansion.sh: line 40: 1: missing name
# will print in zsh:5.8.1:  pages/bash/ysap/parameter_expansion.sh:41: 1: "missing name"
# will print in zsh:5.9:    pages/bash/ysap/parameter_expansion.sh:41: 1: "missing name"
# will print in bash 3.2:   pages/bash/ysap/parameter_expansion.sh: line 40: 1: missing name
# will print in sh:2:       pages/bash/ysap/parameter_expansion.sh: 41: 1: missing name

# REPLACEMENTS:

path='/home/dave/foo.txt'
echo "replace0: >${path}<"
# replace0: >/home/dave/foo.txt<
echo "replace1: >${path/a/oo}<" # replace first occurrence
# replace1: >/home/doove/foo.txt<
echo "replace2: >${path//o/xx}<" # replace all occurrences
# replace2: >/hxxme/dave/fxxxx.txt<
echo "replace3: >${path//o/\/xx}<" # backslash the slash
# replace3: >/h\/xxme/dave/f\/xx\/xx.txt<
echo "replace4: >${path#*/}<" # non greedy - starts cutting of from the left
# replace4: >home/dave/foo.txt<
echo "replace5: >${path##*/}<" # greedy - starts cutting of from the left
# replace5: >foo.txt<
echo "replace6: >${path%/*}<" # non greedy - start from the right and match all up until first slash - and delete that part
# replace6: >home/dave<
echo "replace7: >${path%%/*}<" # greedy - starts cutting of from the right
# replace7: >< # and that removes everything because our path started with /

echo "replace8: >${path//[ve]/__&__}<" # surround all occurrences with __ - on both sides
# replace8: >/hom__&__/dav__&__/foo.txt<
echo "$path" | sed 's/[ve]/__&__/g'

# CUTTING
echo "cut1: ${path:0:5}" # first 5 characters
# cut1: /home
echo "cut2: ${path:6}" # from position 6 to the end
# cut2: dave/foo.txt
echo "cut3: ${path: -6}" # last 6 characters - WARNING: SPACE IS IMPORTANT BEFORE -6
# cut3: oo.txt

# echo "cut4: ${path:1:-1}" # cut first and last character
# cut4: home/dave/foo.tx
# bash:4.1 throws:   pages/bash/ysap/parameter_expansion.sh: line 85: -1: substring expression < 0
# zsh:5.9 throws:    pages/bash/ysap/parameter_expansion.sh:85: substring expression: 0 < 1
# bash:3.2 throws:   pages/bash/ysap/parameter_expansion.sh: line 85: -1: substring expression < 0
# sh:2 throws:       pages/bash/ysap/parameter_expansion.sh: 59: Bad substitution
X=${path#?}
X=${X%?}
echo "cut5: ${X}" # cut first and last character
# cut5: home/dave/foo.tx

s="dave eddy"
len=${#s}
# len: 9
echo "len: $len"
for ((i=0; i<len; i++)); do
    c="${s:i:1}"
    echo "c: >$c<"
done
# c: >d<
# c: >a<
# c: >v<
# c: >e<
# c: > <
# c: >e<
# c: >d<
# c: >d<
# c: >y<
