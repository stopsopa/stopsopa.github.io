
# use:
# PREFIX="${0}: " TIMEOUTSEC=3 /bin/bash bash/fs/waitForFiles.sh var/b.log var/k.txt
# 

PREFIX="${PREFIX:-""}"
TIMEOUTSEC="${TIMEOUTSEC:-5}" # default 5 seconds
FILES=("$@")

if [[ ${#FILES[@]} -eq 0 ]]; then
    echo "${0} error: Usage: [TIMEOUTSEC=...] [PREFIX=...] ${0} file1 [file2 ...]"
    exit 1
fi

I="0"
while true; do
    I="$(( ${I} + 1 ))"
    MISSING_FILES=()
    FOUND_IN_THIS_STEP=()
    
    NEW_FILES_TO_WAIT=()
    for f in "${FILES[@]}"; do
        if [[ -f "${f}" ]]; then
            FOUND_IN_THIS_STEP+=("${f}")
        else
            MISSING_FILES+=("${f}")
            NEW_FILES_TO_WAIT+=("${f}")
        fi
    done

    for f in "${FOUND_IN_THIS_STEP[@]}"; do
        echo "${PREFIX}waitForFiles.sh: ${I}s: Found file: ${f}"
    done

    FILES=("${NEW_FILES_TO_WAIT[@]}")

    if [[ ${#FILES[@]} -eq 0 ]]; then
        break
    fi

    # Check timeout
    if [[ "${TIMEOUTSEC}" -gt 0 ]]; then
        if [[ "${I}" -ge "${TIMEOUTSEC}" ]]; then
            echo "${0} error: Timeout of TIMEOUTSEC=>${TIMEOUTSEC}< reached waiting for: >${FILES[*]}<"
            exit 1
        fi
    fi

    echo "${PREFIX}waitForFiles.sh: ${I}s: Waiting for files to exist: ${FILES[*]} ..."
    sleep 1
done
