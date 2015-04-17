
# # example
# /bin/bash bash/file/append.sh bash/file/test.properties '
# add
# these
# lines
# '

FILE="${1}"
APPEND="${2}"

if [ -z "${FILE}" ]; then
  echo "${0} error: [FILE] argument is missing"
  exit 1
fi

if [ -z "${APPEND}" ]; then
  cat <<EEE
${0} error: [APPEND] argument is missing
Usage: /bin/bash ${0} [file] [append]
EEE
  exit 1
fi

if [ ! -f "${FILE}" ]; then
  echo "${0} error: file does not exist: FILE=>${FILE}<"
  exit 1
fi

# Check if block exists
if awk "
    BEGIN { while ((getline line < \"-\") > 0) block = block line \"\n\" }
    { buffer = buffer \$0 \"\n\" }
    END { exit index(buffer, block) ? 0 : 1 }
  " "${FILE}" <<< "${APPEND}"; then
  cat <<EEE

  ${0}: Block already exists in file

  file: >${FILE}<

  block: >${APPEND}<
  
EEE
else
  printf "%s\n" "${APPEND}" >> "${FILE}"
  cat <<EEE

  ${0}: Block added to file

  file: >${FILE}<

  block: >${APPEND}<

EEE
fi