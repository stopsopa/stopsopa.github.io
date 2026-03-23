# 
# /bin/bash bash/postgres/rename_schema_in_sql_file.sh new_schema dump.sql | do some other stuff
# /bin/bash bash/postgres/rename_schema_in_sql_file.sh new_schema dump.sql > renamed.sql
# 
# part of solution for :
# “pg_dump restore to different schema”
# “PostgreSQL schema rename during restore”
# “cross-schema cloning PostgreSQL”
# “schema migration vs schema cloning”
# “logical dump schema rewrite Postgres”
# 

set -e 

NEW="${1}"

if [ "${NEW}" = "" ]; then
    echo "${0} error: new schema name is empty"
    exit 1
fi

FILE_IN_PLACE="${2}"

if [ ! -f "${FILE_IN_PLACE}" ]; then
    echo "${0} error: file ${FILE_IN_PLACE} does not exist"
    exit 1
fi

OLD=$(/bin/bash bash/postgres/find_schema_name_in_sql.sh "${FILE_IN_PLACE}")

sed "s/${OLD}/${NEW}/g" "${FILE_IN_PLACE}"
