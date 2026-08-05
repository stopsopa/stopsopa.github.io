
# The purpose of this command is to be able to run any command with special flag (string) that would allow you
# to filter this command with `ps aux | grep ${FLAG}`
# having this you can use /bin/bash bash/proc/kill.sh to kill this command by this flag
# this command killed will take care of killing all command that was executed in background
#
# /bin/bash "${_DIR}/bash/proc/run-with-flag-and-kill.sh" "${FLAG}" /bin/bash "${_DIR}/ttt.sh" a b "c d" &

# Then you can kill the bash script and it's child with:
# ps aux | grep "${FLAG}" | grep -v grep | awk '{print $2}' | xargs kill
# or more aggressively
# ps aux | grep "${FLAG}" | grep -v grep | awk '{print $2}' | xargs kill -9

# test
#
# Manual test scenario:
#
# The goal is to verify:
# - wrapper process can be found by its flag
# - child process is created under the wrapper
# - killing the wrapper triggers cleanup
# - child process is removed together with the wrapper
#
#
# 1. Start wrapper with a child process:
#
#    /bin/bash ./run-with-flag-and-kill.sh TEST_FLAG_parent  /bin/bash -c 'echo "child started pid=$$"; exec -a TEST_FLAG_child sleep 300' &
#
#
# 2. Find both parent and child processes:
#
#    ps aux | grep TEST_FLAG | grep -v grep
#
#    Expected output should contain:
#
#      ... run-with-flag-and-kill.sh TEST_FLAG_parent ...
#      ... TEST_FLAG_child 300 ...
#
#
# 3. Inspect parent/child relationship:
#
#    Linux:
#      ps -ef --forest | grep -A5 TEST_FLAG
#
#    macOS:
#      ps -axo pid,ppid,command | grep TEST_FLAG | grep -v grep
#
#
#    Expected relationship:
#
#      TEST_FLAG_parent
#        └── bash -c ...
#              └── TEST_FLAG_child
#
#
# 4. Kill only the wrapper process:
#
#    ps aux | grep TEST_FLAG_parent | grep -v grep | awk '{print $2}' | xargs kill
#
#
# 5. Verify that parent and child were cleaned up:
#
#    ps aux | grep TEST_FLAG | grep -v grep
#
#    Expected:
#
#      no output
#
#
# 6. Test force kill:  AVOID THAT
#
#    Start again:
#
#      /bin/bash ./run-with-flag-and-kill.sh TEST_FLAG_parent   /bin/bash -c 'exec -a TEST_FLAG_child sleep 300' &
#
#
#    Then:
#
#      ps aux | grep TEST_FLAG_parent | grep -v grep | awk '{print $2}' | xargs kill -9
#
#
#    Verify cleanup:
#
#      ps aux | grep TEST_FLAG | grep -v grep
#
#
# Notes:
#
# - TEST_FLAG_parent identifies the wrapper process.
# - TEST_FLAG_child identifies the spawned child process.
# - Killing TEST_FLAG_parent should execute the EXIT trap.
# - The EXIT trap should terminate child processes created by the wrapper.
# - This test verifies normal child processes. Processes that daemonize,
#   detach, or create a new session are outside the scope of this wrapper.
#

#    EXTENDED TESTING OF FORWARDING STDIN/STDOUT
#
# 7. Test stdin/stdout forwarding with a continuously running child:
#
# Terminal 1:
#
#    rm -f /tmp/TEST_FLAG_io.log
#
#    while true; do
#      echo "message from stdin $(date "+%H:%M:%S")"
#      sleep 1
#    done | \
#    /bin/bash ./run-with-flag-and-kill.sh TEST_FLAG_io_parent \
#      /bin/bash -c '
#        while IFS= read -r line; do
#          echo "$(date "+%H:%M:%S") child received: ${line}"
#        done
#      ' > /tmp/TEST_FLAG_io.log &
#
#
# 8. Terminal 2 - observe child stdout:
#
#    tail -f /tmp/TEST_FLAG_io.log
#
#
#    Expected:
#
#      15:30:01 child received: message from stdin 15:30:01
#      15:30:02 child received: message from stdin 15:30:02
#      15:30:03 child received: message from stdin 15:30:03
#
#
# 9. Kill the wrapper:
#
#    ps aux | grep TEST_FLAG_io_parent | grep -v grep | awk '{print $2}' | xargs kill
#
#
# 10. Verify cleanup:
#
#    ps aux | grep TEST_FLAG_io_parent | grep -v grep
#
#    Expected:
#
#      no output
#
#
# Notes:
#
# - The data producer writes to the wrapper stdin.
# - The wrapper passes stdin unchanged to the child.
# - The child writes stdout to the log file.
# - Killing the wrapper should trigger cleanup and stop the child.
#

# EXTENDED THEST TO SEE IF CHILD STDOUT IS FORWARDED TO WRAPPER STDOUT
#
# 7. Test stdin/stdout forwarding and visible parent-child relationship:
#
# The goal:
# - TEST_FLAG_io_parent is the wrapper process
# - TEST_FLAG_io_child is the child process started by the wrapper
# - stdin is forwarded from the wrapper to the child
# - stdout from the child is forwarded back through the wrapper
#
#
# Terminal 1:
#
# while true; do
#   echo "message from stdin $(date "+%H:%M:%S")"
#   sleep 1
# done | \
# /bin/bash ./run-with-flag-and-kill.sh TEST_FLAG_io_parent \
#   /bin/bash -c '
#     exec -a TEST_FLAG_io_child bash -c "
#       while IFS= read -r line; do
#         echo \"child stdout: \$line\"
#       done
#     "
#   '
#
#
# Expected output in Terminal 1:
#
#    child stdout: message from stdin 15:30:01
#    child stdout: message from stdin 15:30:02
#    child stdout: message from stdin 15:30:03
#
#
# 8. Terminal 2 - verify parent and child processes:
#
#    ps -axo pid,ppid,command | grep TEST_FLAG | grep -v grep
#
#
# Expected:
#
#    PID    PPID   COMMAND
#    80001  70001  /bin/bash ./run-with-flag-and-kill.sh TEST_FLAG_io_parent ...
#    80002  80001  TEST_FLAG_io_child ...
#
#
# This proves:
#
#    stdin producer
#          |
#          v
#    TEST_FLAG_io_parent
#          |
#          v
#    TEST_FLAG_io_child
#          |
#          v
#    terminal stdout
#
#
# 9. Kill only the wrapper:
#
#    ps aux | grep TEST_FLAG_io_parent | grep -v grep | awk '{print $2}' | xargs kill
#
#
# 10. Verify cleanup:
#
#    ps -axo pid,ppid,command | grep TEST_FLAG | grep -v grep
#
#
# Expected:
#
#    no output
#
#
# Notes:
#
# - The wrapper does not manually forward stdin/stdout.
# - "$@" keeps the original file descriptors unchanged.
# - Child stdin comes from wrapper stdin.
# - Child stdout goes to wrapper stdout.
# - Killing the wrapper triggers cleanup of the child.
#

set -e

FLAG="${1}"

shift

if [ -z "${FLAG}" ]; then
    echo "${0} error: FLAG is not defined"
    exit 1
fi

# Prevent silently doing nothing if no command was supplied.
if [ "$#" -eq 0 ]; then
    echo "${0} error: command is not defined"
    exit 1
fi

function cleanup {
    kill -9 $(pgrep -P $$) > /dev/null 2> /dev/null || :
}

trap cleanup EXIT

# Execute the command exactly as received, preserving all arguments.
"$@"