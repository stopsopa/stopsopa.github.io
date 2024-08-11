#
# run first:
#   export NODE_OPTIONS_TMP="${NODE_OPTIONS}"
#
# npm install -g chokidar
# npm install -g chokidar-cli
# NODE_OPTIONS="" chokidar bash/node/*.* --initial -c '/bin/bash bash/node/array_test.sh'
# 
# /bin/bash bash/node/array_test.sh
# NODE_OPTIONS="" /bin/bash bash/node/array_test.sh
# 

# 
# in case of this particular test run
# echo 'abcdefcghi' | node bash/node/array.js --split "/c/g" --count --save --group test --block iter --v 2
#    to see exactly where temporary files are created.
#    because what is interesting it seems os.tmpdir() when var directory is present in cwd() then it will prefer this directory
#    I can't see this in documentation: https://nodejs.org/api/os.html#ostmpdir


source bash/test.sh "${0}"

# export NODE_OPTIONS=""

COMMAND="echo 'abcdefcghi' | node bash/node/array.js --split \"/c/g\" --count"
EXPECTED_STDOUT="3"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "one";

COMMAND="echo 'abcdefcghi' | node bash/node/array.js --split \"/c/g\" --count --save --v"
EXPECTED_STDOUT="3array.js error: save: --group is required"
EXPECTED_STDERR=""
EXPECTED_CODE="1"
test "two";

COMMAND="echo 'abcdefcghi' | node bash/node/array.js --split \"/c/g\" --count --save --group test --v"
EXPECTED_STDOUT="3array.js error: save: --block is required"
EXPECTED_STDERR=""
EXPECTED_CODE="1"
test "three";

COMMAND="echo 'abcdefcghi' | node bash/node/array.js --split \"/c/g\" --count --save --group test --block basic --v"
EXPECTED_STDOUT="3Saved files >_array_test_basic.json< >_array_test_basic_index.json<"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "error1";


# testing iteration vvv
echo 'abcdefcghi' | node bash/node/array.js --split "/c/g" --save --group test --block iteration

COMMAND="node bash/node/array.js --group test --block iteration --index"
EXPECTED_STDOUT="0"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "first read index";

COMMAND="node bash/node/array.js --group test --block iteration --value"
EXPECTED_STDOUT="ab"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "four";

COMMAND="node bash/node/array.js --group test --block iteration --hasNext"
EXPECTED_STDOUT="true"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "siz";

COMMAND="node bash/node/array.js --group test --block iteration --increment --v"
EXPECTED_STDOUT="Saved files >_array_test_iteration_index.json<
1"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "seven";

COMMAND="node bash/node/array.js --group test --block iteration --value"
EXPECTED_STDOUT="def"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "eight";

COMMAND="node bash/node/array.js --group test --block iteration --hasNext"
EXPECTED_STDOUT="true"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "nine";

COMMAND="node bash/node/array.js --group test --block iteration --increment --v"
EXPECTED_STDOUT="Saved files >_array_test_iteration_index.json<
2"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "ten";

COMMAND="node bash/node/array.js --group test --block iteration --value"
EXPECTED_STDOUT="ghi"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "eleven";

COMMAND="node bash/node/array.js --group test --block iteration --hasNext"
EXPECTED_STDOUT="false"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "twelve";

COMMAND="node bash/node/array.js --group test --block iteration --increment --v"
EXPECTED_STDOUT="Saved files >_array_test_iteration_index.json<
3"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "thirteen";

COMMAND="node bash/node/array.js --group test --block iteration --value"
EXPECTED_STDOUT="array.js error: no value found at index >3<"
EXPECTED_STDERR=""
EXPECTED_CODE="1"
test "fourteen";

COMMAND="node bash/node/array.js --group test --block iteration --count"
EXPECTED_STDOUT="3"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "fifteen";

COMMAND="node bash/node/array.js --group test --block iteration --index"
EXPECTED_STDOUT="3"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "check index at the end";

COMMAND="node bash/node/array.js --group test --block iteration --home --v"
EXPECTED_STDOUT="Saved files >_array_test_iteration_index.json<
0"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "move to home";

COMMAND="node bash/node/array.js --group test --block iteration --index"
EXPECTED_STDOUT="0"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "check index after home";

COMMAND="node bash/node/array.js --group test --block iteration --value"
EXPECTED_STDOUT="ab"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "get value after home";


COMMAND="node bash/node/array.js --group test --block iteration --end --v"
EXPECTED_STDOUT="Saved files >_array_test_iteration_index.json<
2"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "move to end";

COMMAND="node bash/node/array.js --group test --block iteration --index"
EXPECTED_STDOUT="2"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "check index after end";

COMMAND="node bash/node/array.js --group test --block iteration --value"
EXPECTED_STDOUT="ghi"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "get value after end";


# testing iteration ^^^



# testing decrement vvv
echo 'abcdefcghi' | node bash/node/array.js --group test --block decrement --split "/c/g" --save

COMMAND="node bash/node/array.js --group test --block decrement  --value"
EXPECTED_STDOUT="ab"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "four";

COMMAND="node bash/node/array.js --group test --block decrement  --hasNext"
EXPECTED_STDOUT="true"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "siz";

COMMAND="node bash/node/array.js --group test --block decrement  --increment --v"
EXPECTED_STDOUT="Saved files >_array_test_decrement_index.json<
1"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "seven";

COMMAND="node bash/node/array.js --group test --block decrement  --value"
EXPECTED_STDOUT="def"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "decrement def";

COMMAND="node bash/node/array.js --group test --block decrement  --hasPrev"
EXPECTED_STDOUT="true"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "hasPrev expected true";

COMMAND="node bash/node/array.js --group test --block decrement  --decrement --v"
EXPECTED_STDOUT="Saved files >_array_test_decrement_index.json<
0"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "seven";

COMMAND="node bash/node/array.js --group test --block decrement  --value"
EXPECTED_STDOUT="ab"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "decrement ab again";

COMMAND="node bash/node/array.js --group test --block decrement  --decrement --v"
EXPECTED_STDOUT="array.js error: decrement >1< from index >0< will result in negative index >-1<"
EXPECTED_STDERR=""
EXPECTED_CODE="1"
test "seven";

COMMAND="node bash/node/array.js --group test --block decrement  --hasPrev"
EXPECTED_STDOUT="false"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "hasPrev expected false";


# testing decrement ^^^

GROUP="test"
BLOCK="iteration"
PARAMS="--group ${GROUP} --block ${BLOCK}"
I="0"
echo 'abcdefcghi' | node bash/node/array.js ${PARAMS} --split "/c/g" --save
while [ "$(node bash/node/array.js ${PARAMS} --has)" = "true" ]; do
    I=$((I+1))

    COMMAND="node bash/node/array.js ${PARAMS} --index"
    EXPECTED_STDOUT="$((I - 1))"
    EXPECTED_STDERR=""
    EXPECTED_CODE="0"
    test "index-${I}";

    COMMAND="node bash/node/array.js ${PARAMS} --value"
    EXPECTED_STDERR=""
    case $I in
        1)
            EXPECTED_STDOUT="ab"
            ;;
        2)
            EXPECTED_STDOUT="def"
            ;;
        *)
            EXPECTED_STDOUT="ghi"
            ;;
    esac   
    EXPECTED_STDERR="" 
    EXPECTED_CODE="0"
    test "iteration-${I}";

    node bash/node/array.js ${PARAMS} --increment
done


COMMAND="node bash/node/array.js --group test --block iteration --index"
EXPECTED_STDOUT="3"
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "index-after";

COMMAND="node bash/node/array.js --group test --block iteration --value"
EXPECTED_STDOUT="array.js error: no value found at index >3<"
EXPECTED_STDERR=""
EXPECTED_CODE="1"
test "value-after";




echo 'cab c def c ghi c' | node bash/node/array.js --split "/c/g" --save --group test --block dump
COMMAND="node bash/node/array.js --group test --block dump --jsonAll"
EXPECTED_STDOUT='{"array":["","ab "," def "," ghi ",""],"index":0}'
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "jsonAll test";

echo 'cab c def c ghi c' | node bash/node/array.js --split "/c/g" --save --group test --block dump
COMMAND="node bash/node/array.js --group test --block dump --jsonAll 2"
EXPECTED_STDOUT='{
  "array": [
    "",
    "ab ",
    " def ",
    " ghi ",
    ""
  ],
  "index": 0
}'
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "jsonAll 2 test";

echo 'cab c def c ghi c' | node bash/node/array.js --split "/c/g" --save --group test --block dump
COMMAND="node bash/node/array.js --group test --block dump --json"
EXPECTED_STDOUT='["","ab "," def "," ghi ",""]'
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "json test";

echo 'cab c def c ghi c' | node bash/node/array.js --split "/c/g" --save --group test --block dump
COMMAND="node bash/node/array.js --group test --block dump --json 2"
EXPECTED_STDOUT='[
  "",
  "ab ",
  " def ",
  " ghi ",
  ""
]'
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "json 2 test";


echo 'cabcdefcghic' | node bash/node/array.js --split "/c/g" --group test --block dump --save --boolfilter
COMMAND="node bash/node/array.js --group test --block dump --jsonAll"
EXPECTED_STDOUT='{"array":["ab","def","ghi"],"index":0}'
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "boolfilter on input";

echo 'cab c def c ghi c' | node bash/node/array.js --split "/c/g" --group test --block dump --save --trim 
COMMAND="node bash/node/array.js --group test --block dump --jsonAll"
EXPECTED_STDOUT='{"array":["","ab","def","ghi",""],"index":0}'
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "trim on input";

echo 'cab c def c ghi c' | node bash/node/array.js --split "/c/g" --group test --block dump --save 
COMMAND="node bash/node/array.js --group test --block dump --jsonAll --trim"
EXPECTED_STDOUT='{"array":["","ab","def","ghi",""],"index":0}'
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "jsonAll and trim on output";

echo 'cab c def c ghi c' | node bash/node/array.js --split "/c/g" --group test --block dump --save 
COMMAND="node bash/node/array.js --group test --block dump --json --trim"
EXPECTED_STDOUT='["","ab","def","ghi",""]'
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "json and trim on output";

echo 'cab c def c ghi c' | node bash/node/array.js --split "/c/g" --group test --block dump --save 
COMMAND="node bash/node/array.js --group test --block dump --json --trim --boolfilter"
EXPECTED_STDOUT='["ab","def","ghi"]'
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "json and trim and boolfilter on output";

cat <<EEE | node bash/node/array.js --split "/\n/g" --group test --block multiline --save 

abce
 def 

  zzz

EEE
COMMAND="node bash/node/array.js --group test --block multiline --jsonAll 2"
EXPECTED_STDOUT='{
  "array": [
    "abce",
    " def ",
    "",
    "  zzz",
    ""
  ],
  "index": 0
}'
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "multiline split by newline";

COMMAND="node bash/node/array.js --group test --block multiline --jsonAll 2 --boolfilter"
EXPECTED_STDOUT='{
  "array": [
    "abce",
    " def ",
    "  zzz"
  ],
  "index": 0
}'
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "multiline split by newline and boolfilter";

COMMAND="node bash/node/array.js --group test --block multiline --jsonAll 2 --trim --boolfilter"
EXPECTED_STDOUT='{
  "array": [
    "abce",
    "def",
    "zzz"
  ],
  "index": 0
}'
EXPECTED_STDERR=""
EXPECTED_CODE="0"
test "multiline split by newline trim and boolfilter";





