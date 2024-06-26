
# other solution seems to work in zsh and bash: https://jcgoran.github.io/2021/02/07/bash-string-trimming.html
# trimstring(){
#     if [ $# -ne 1 ]
#     then
#         echo "USAGE: trimstring [STRING]"
#         return 1
#     fi
#     s="${1}"
#     size_before=${#s}
#     size_after=0
#     while [ ${size_before} -ne ${size_after} ]
#     do
#         size_before=${#s}
#         s="${s#[[:space:]]}"
#         s="${s%[[:space:]]}"
#         size_after=${#s}
#     done
#     echo "${s}"
#     return 0
# }

# source "${DIR}/../trim.sh"

# FLAG="$(trim "${FLAG}")"

trim() {
    local var="${*}"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "${var}"
}



# -----
# alternative to trim just from left but given character
# trimLeft() {
#   local str="$1"
#   local trim_char="$2"
#   while [[ $str == $trim_char* ]]; do
#     str="${str#$trim_char}"
#   done
#   echo "$str"
# }

# # Usage
# trimLeft "./config/sensitive/sensitive-config.json" "."
# trimLeft "./config/sensitive/sensitive-config.json" "/"
