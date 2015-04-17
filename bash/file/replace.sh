# # example
# /bin/bash bash/file/replace.sh bash/file/test.properties 'name=local-file-source
# connector.class=FileStreamSource' 'name=local-filed-source
# connector.class=FileStreamdSource'


FILE="${1}"
SEARCH="${2}"
REPLACE="${3}"

if [ -z "${FILE}" ]; then
  echo "${0} error: [FILE] argument is missing"
  exit 1
fi

if [ -z "${SEARCH}" ] || [ -z "${REPLACE}" ]; then
  cat <<EEE
${0} error: [SEARCH] or [REPLACE] argument is missing
Usage: /bin/bash ${0} [file] [search] [replace]
EEE
  exit 1
fi

if [ ! -f "${FILE}" ]; then
  echo "${0} error: file does not exist: FILE=>${FILE}<"
  exit 1
fi

# Use environment variables to pass strings to Perl safely.
# This avoids any issues with escaping special characters in the search/replace strings.
export SPRO_SEARCH="${SEARCH}"
export SPRO_REPLACE="${REPLACE}"

# Check if block exists and perform replacement
# \Q and \E in Perl regex mean "treat everything between them as a literal string"
if perl -0777 -e 'exit 1 unless index(<>, $ENV{SPRO_SEARCH}) != -1' "${FILE}"; then
  perl -0777 -i -pe 's/\Q$ENV{SPRO_SEARCH}\E/$ENV{SPRO_REPLACE}/sg' "${FILE}"
  cat <<EEE

  ${0}: Replaced occurrences of multi-line block in file:
    >${FILE}<

  from: 
    >${SEARCH}<

  to:
    >${REPLACE}<

  success

EEE
else
  cat <<EEE

  ${0}: SEARCH block not found in file:
    >${FILE}<

  search:
    >${SEARCH}<

  Nothing changed.

EEE
  exit 1
fi