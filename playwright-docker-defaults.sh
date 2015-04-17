
S="\\"

MYSQL_DB_CHANGE_DEFAULT=""
if [ "${MYSQL_DB_CHANGE}" != "" ]; then
    MYSQL_DB_CHANGE_DEFAULT="--env MYSQL_DB_CHANGE"
fi  

MYSQL_HOST_PASS=""
if [ "${1}" != "--nohost" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        MYSQL_HOST_PASS="--env MYSQL_HOST=host.docker.internal"
    # else # this case if uncommented then in some cases might double passing --net host which wouldn't make much sense, so let's prevent it
    #     _HOSTHANDLER="--net host"
    fi
fi

cat <<EOF
-w "/code" $S
${MYSQL_DB_CHANGE_DEFAULT} $S
${MYSQL_HOST_PASS} $S
-v "\$(pwd)/pages:/code/pages" $S
-v "\$(pwd)/lib:/code/lib" $S
-v "\$(pwd)/package.json:/code/package.json" $S
-v "\$(pwd)/node_modules:/code/node_modules" $S
-v "\$(pwd)/playwright-async.config.js:/code/playwright-async.config.js" $S
-v "\$(pwd)/playwright.config.js:/code/playwright.config.js"
EOF

