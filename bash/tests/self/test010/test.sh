#
# script called through symlink (LIMITATIONS)
#
# /bin/bash bash/tests/self/test010/test.sh
#

source bash/tests/self/compare.sh "${0}"

D="bash/tests/self/test010"

# symlinks are created just for the time of the test
rm -rf "${D}/link.sh" "${D}/tmp"
mkdir -p "${D}/tmp"
ln -s script.sh "${D}/link.sh"
ln -s ../script.sh "${D}/tmp/link.sh"

# both: describe the symlink, not the real file
compare "symlink in the same directory" \
  "/bin/bash ${D}/link.sh" \
  SAME \
  "script: _SHELL=bash _DIR=<ROOT>/${D} _0=link.sh _SCRIPT=${D}/link.sh _BINARY=/bin/bash"

# old block: describes the symlink (_DIR is the directory of the symlink, not of the real file)
# self.sh:   REGRESSION - script looks for self.sh relatively to the directory of the symlink and can't find it,
#            old block was pasted into the script so it had nothing to look for
compare "symlink in different directory" \
  "/bin/bash ${D}/tmp/link.sh" \
  DIFFERENT \
  "script: _SHELL=bash _DIR=<ROOT>/${D}/tmp _0=link.sh _SCRIPT=${D}/tmp/link.sh _BINARY=/bin/bash" \
  "${D}/tmp/link.sh: line 28: ${D}/tmp/../../../self.sh: No such file or directory
script: _SHELL= _DIR= _0= _SCRIPT= _BINARY="

rm -rf "${D}/link.sh" "${D}/tmp"
