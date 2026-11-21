#
# evaluates output of the command given in arguments and prints variables from special.env
# to see what really lands in the environment
#
# /bin/bash bash/tests/exportsource/test001/print.sh /bin/bash bash/exportsource.sh bash/tests/exportsource/test001/special.env
#

eval "$("${@}")"

echo "ES_DOLLAR=>${ES_DOLLAR}<"
echo "ES_QUOTE=>${ES_QUOTE}<"
echo "ES_BACKTICK=>${ES_BACKTICK}<"
echo "ES_SUBSHELL=>${ES_SUBSHELL}<"
echo "ES_BACKSLASH=>${ES_BACKSLASH}<"
echo "ES_SINGLE=>${ES_SINGLE}<"
echo "ES_MULTI=>${ES_MULTI}<"
