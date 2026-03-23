# to find schema name in sql file
# /bin/bash bash/postgres/find_schema_name_in_sql.sh dump.sql

set -e
set -o pipefail

if [ -z "${1}" ]; then
    echo "${0} error: no input file provided" >&2
    exit 1
fi

INPUT_FILE="${1}"

if [ ! -f "${INPUT_FILE}" ]; then
    echo "${0} error: file not found: ${INPUT_FILE}" >&2
    exit 1
fi

# Search for the schema name in the first 60 lines
# The expected format is: CREATE SCHEMA schema_name;
# gsub(/[;"]/, "", $3) extracts the third word and removes semicolons and quotes
SCHEMA_NAME=$(head -n 60 "${INPUT_FILE}" | awk '/^CREATE SCHEMA / { gsub(/[;"]/, "", $3); print $3; exit }')

if [ -n "${SCHEMA_NAME}" ]; then
    echo -n "${SCHEMA_NAME}"
    exit 0
fi

echo "${0} error: didn't find schema name" >&2
exit 1
