

while true; do

    # choose
    echo do something even on start before even trying to detect change

    while true; do
        WATCH_IGNORED="$(NODE_OPTIONS= node bash/fs/watch.ts . --debug | NODE_OPTIONS="" node gitignore.js dev.sh.ignore)"

        if [ "${WATCH_IGNORED}" != "" ]; then
        cat <<EEE
bash/fs/watch.ts detected change: >${WATCH_IGNORED}<
EEE
          break;
        fi
    done

    # choose
    echo do something only AFTER we detect change with watch.ts
    
done

