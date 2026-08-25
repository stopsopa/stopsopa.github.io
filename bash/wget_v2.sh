
if command -v wget >/dev/null 2>&1; then
    wget_sh() {
        local URL="${1}"
        local DESTINATION="${2}"

        wget -O "${DESTINATION}" "${URL}"
    }
elif command -v curl >/dev/null 2>&1; then
    wget_sh() {
        local URL="${1}"
        local DESTINATION="${2}"

        curl -L -o "${DESTINATION}" "${URL}"
    }
else
    echo "${0} error: neither wget nor curl is installed" >&2
    exit 1
fi