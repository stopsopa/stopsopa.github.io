# Description: Randomly flips bits in a given file.
# The number of bits to flip and the file path are required arguments.
# By default, a backup of the file is created with the .bck extension.
# You can append the --dangerous flag to skip creating the backup.
#
# Usage:
#   /bin/bash bash/fs/break-file.sh [NUM_BITS] [file-path] [--dangerous]
#
# Examples:
#   /bin/bash bash/fs/break-file.sh 3 broken
#   /bin/bash bash/fs/break-file.sh 5 my-file.txt --dangerous

NUM_BITS="${1}"
FILE="${2}"
DANGEROUS=0

if [[ ! "${NUM_BITS}" =~ ^[0-9]+$ ]]; then
  echo "${0} error: first argument must be a number, got >${NUM_BITS}<"
  exit 1
fi

if [[ ! -f "${FILE}" ]]; then
  echo "${0} error: file >${FILE}< does not exist"
  exit 1
fi

shift 2
while [[ $# -gt 0 ]]; do
  case "${1}" in
    --dangerous)
      DANGEROUS=1
      shift
      ;;
    *)
      echo "${0} error: unknown parameter >${1}<"
      exit 1
      ;;
  esac
done

if [[ "${DANGEROUS}" == "0" ]]; then
  cp "${FILE}" "${FILE}.bck"
fi

SIZE=$(stat -f%z "${FILE}")

for ((i=0; i<NUM_BITS; i++)); do
  POS=$(jot -r 1 0 "$((SIZE - 1))")
  BYTE=$(dd if="${FILE}" bs=1 skip="${POS}" count=1 2>/dev/null | od -An -t u1)
  BIT_POS=$(jot -r 1 0 7)
  NEW_BYTE=$((BYTE ^ (1 << BIT_POS)))
  echo "i: ${i} POS: ${POS} BYTE: ${BYTE} NEW_BYTE: ${NEW_BYTE}"
  printf "\\$(printf '%03o' "${NEW_BYTE}")" | dd of="${FILE}" bs=1 seek="${POS}" count=1 conv=notrunc &> /dev/null
done
