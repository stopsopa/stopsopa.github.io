
# https://unix.stackexchange.com/a/79065

# script will properly export variables defined in .env file, where normally they are not prefixed with "export" keyword
#
# USAGE:

# override mode - false (default)
# eval "$(/bin/bash bash/exportsource.sh .env.test)"
#
# override mode - true
# eval "$(/bin/bash bash/exportsource.sh .env.test true)"

if [ "${2}" = "" ]; then

#https://stackoverflow.com/a/8574392
containsElement () {
    local e
    for e in "${@:2}"; do [[ "${e}" == "${1}" ]] && return 0; done
    return 1
}

#$ array=("something to search for" "a string" "test2000")
#$ containsElement "a string" "${array[@]}"
#$ echo ${?}
#0
#$ containsElement "blaha" "${array[@]}"
#$ echo ${?}
#1

__ENV_VAR_LIST_EXISTING=();

while read -r ___ENV
do
  if [ "${___ENV}" != "" ] && [ "${!___ENV}" != "" ]; then

    __ENV_VAR_LIST_EXISTING+=("${___ENV}")
  fi
done <<< "$(printenv | awk 'BEGIN {FS="="}{print ${1}}')"

#echo "existing >>${__ENV_VAR_LIST_EXISTING[@]}<<"

{
source "${1}"

cat <<EOF

#echo "override: false"

EOF

while read -r ___ENV
do
  if [ "${___ENV}" != "" ] && [ "${!___ENV}" != "" ]; then

    containsElement "${___ENV}" "${__ENV_VAR_LIST_EXISTING[@]}"

    if [ "${?}" != "0" ]; then

      echo "export ${___ENV}=\"${!___ENV}\""
    fi
  fi

done <<< "$(cut -d= -f1 "${1}" | grep -v -E "^#")"



}


else


cat <<EOF

#echo "override: true"

source "${1}"

export $(cut -d= -f1 "${1}" | grep -v -E "^#" | tr "\n" " ")

EOF


fi
