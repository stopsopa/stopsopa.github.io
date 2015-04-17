

#
# WARNING
#
# The idea behind this function is to call commands and caputre it's stdout
# and if exit code is not 0 then stdout should be printed and exit code should be returned
# if exit code 0 then not return stdout
# 
# for proper functioning internally it need set +e
# but no worries, it will restore previus state of that flag 
#

# cat <<EEE > ttt.sh
# echo stdout data
# echo stderr data >&2
# if [ "${1}" != "" ] ; then
#   exit ${1}
# fi
# EEE
# cat <<EEE > testpsooe.sh
# set -e # comment this and uncomment
# source bash/print_stdout_only_on_error.sh

# # add digit at the end or not to see the difference
# print_stdout_only_on_error /bin/bash ttt.sh 6 

# echo "last exit code >${?}<"
# doesnt work
# echo continue

# EEE
# # and run
# /bin/bash testpsooe.sh
# echo ${?}

# NOTICE:
# after execution with exit code 0 you can still do something _STDOUT and _EXIT_STATUS

#
function print_stdout_only_on_error {
  if [[ ${-} == *e* ]]; then
    original_e_state=1
  else
    original_e_state=0
  fi

  set +e

  _STDOUT=$("${@}" 2>&1)
  _EXIT_STATUS=${?}

  if [ ${_EXIT_STATUS} -ne 0 ]; then
    echo "${_STDOUT}"
    if [ ${original_e_state} -eq 1 ]; then
      set -e
    fi

    # return will make it possible to capture outside exit code
    # like this 
    # echo "last exit code >${?}<"
    return ${_EXIT_STATUS}
  fi

  if [ ${original_e_state} -eq 1 ]; then
    set -e
  fi
}