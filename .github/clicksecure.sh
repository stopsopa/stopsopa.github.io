#
# add to the page url ?disableclicksecure get argument to disable it (just key no need to specify value)
#
# /bin/bash .github/clicksecure.sh
#   above will run only in dry-run mode
#
# to run it for real:
#   CI=true /bin/bash .github/clicksecure.sh
# or
#   /bin/bash .github/clicksecure.sh --run
# 
# stript to inject special blocking code
#
# to get original script to inject go to /pages/js/clicksecure.html
#

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    ;;
esac

ROOT="${_DIR}/.."

cd "${ROOT}"

ROOT="$(pwd)"

# it is actually not needed because in CI it will generate additional noise like:
#           Debugger listening on ws://127.0.0.1:35133/beec5c79-0b8f-43c1-b83a-f9ebc185d9a9
#           For help, see: https://nodejs.org/en/docs/inspector
# but for local machine node part will not be called normally, unless forced. 
# I don't necessarily care about forced cases locally
# export NODE_OPTIONS="" 

set -e

#
# to get original script to inject go to /pages/js/clicksecure.html
#
REPLACEMENT=$(cat <<END
<script>var s=document.createElement("script");s.innerHTML=atob('e3ZhciBjPXt3OigpPT57dmFyIGQ9bmV3IERhdGUoKTtkLnNldEZ1bGxZZWFyKGQuZ2V0RnVsbFllYXIoKSsxKTtkb2N1bWVudC5jb29raWU9YGNsaWNrc2VjdXJlX2Nvb2tpZT14OyBleHBpcmVzPSR7ZC5nZXREYXRlKCl9ICR7IkphbiBGZWIgTWFyIEFwciBNYXkgSnVuIEp1bCBBdWcgU2VwIE9jdCBOb3YgRGVjIi5zcGxpdCgiICIpW2QuZ2V0TW9udGgoKV19ICR7ZC5nZXRGdWxsWWVhcigpfSAwMDowMDowMCBVVEM7IHBhdGg9L2B9LHI6KCk9PmRvY3VtZW50LmNvb2tpZS5yZXBsYWNlKC8oPzooPzpefC4qO1xzKiljbGlja3NlY3VyZV9jb29raWVccypcPVxzKihbXjtdKikuKiQpfF4uKiQvLCIkMSIpfTtmdW5jdGlvbiBwYXNzd29yZChjaGVjaywgY2FsbGJhY2spIHtsZXQgeCA9ICIiO2Z1bmN0aW9uIGV2ZW50KHtrZXl9KSB7aWYgKGtleSA9PT0gIkVudGVyIikge3JldHVybiAoeCA9ICIiKTt9eCArPSBrZXk7aWYgKGNoZWNrKHgpKSB7ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigia2V5cHJlc3MiLCBldmVudCk7Y2FsbGJhY2soKTt9fWRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoImtleXByZXNzIiwgZXZlbnQpO31pZighYy5yKCkgJiYgKHR5cGVvZiAobmV3IFVSTFNlYXJjaFBhcmFtcyhsb2NhdGlvbi5zZWFyY2gpKS5nZXQoJ2NsaWNrc2VjdXJlJykgIT09ICdzdHJpbmcnIHx8ICFsb2NhdGlvbi5wYXRobmFtZS5zdGFydHNXaXRoKCcvLycpKSApe2RvY3VtZW50LmJvZHkuaW5uZXJIVE1MPSc8aW5wdXQgdHlwZT0idGV4dCIgLz4nO3ZhciBzPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoInN0eWxlIik7ZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoImhlYWQiKVswXS5hcHBlbmRDaGlsZChzKTtzLnR5cGU9InRleHQvY3NzIjtzLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGBpe3Bvc2l0aW9uOmZpeGVkO2JvdHRvbTowO2xlZnQ6MzAlO3dpZHRoOjIwcHg7aGVpZ2h0OjIwcHg7Y3Vyc29yOnBvaW50ZXI7Y29udGVudDonICc7fWApKTt2YXIgaT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJyk7ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpKTt2YXIgdDtpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge2lmKHQmJihuZXcgRGF0ZSgpKS10PDEzMCl7Yy53KCk7bG9jYXRpb24uaHJlZj1sb2NhdGlvbi5ocmVmfTt0PW5ldyBEYXRlKCk7fSk7cGFzc3dvcmQoKHgpID0+IHtjb25zdCBrID0gWyJvcGVuIiwgInN0YXJ0IiwgInJ1biJdO2NvbnN0IHkgPSBrLmluY2x1ZGVzKHgudG9Mb3dlckNhc2UoKSk7aWYgKHkpIHtjb25zb2xlICYmIGNvbnNvbGUubG9nICYmIGNvbnNvbGUubG9nKGspO31yZXR1cm4geTt9LCgpID0+IHtjLncoKTtsb2NhdGlvbi5ocmVmPWxvY2F0aW9uLmhyZWZ9KTt9fQ==');document.getElementsByTagName("head")[0].appendChild(s);</script>
END
)

set +e

S="\\"
FIND="$(cat <<EOF
find "pages" -type f -name "*.html"
EOF
)"

printf "\n$FIND\n\n"

FIND="${FIND//\\$'\n'/}"

# or capture result
LIST="$(eval "${FIND}")" 

LIST=$(cat <<END
${LIST}
index.html
END
)

cat <<EEE

${0}: found for processing:

EEE

while read -r FILE
do
echo "${0}: found: ${FILE}"
done <<< "${LIST}"

MATCHING=()

MATCH="<body[^>]*>"

while read -r FILE
do
    if grep -Eq "${MATCH}" "$FILE"; then

        # add to the end of array
        MATCHING+=("${FILE}") 
    fi
done <<< "${LIST}"

# to new line separated list
MATCHING=$(printf "%s\n" "${MATCHING[@]}")

cat <<EEE

${0}: list of files where match >${MATCH}< was found FOUND:

EEE

while read -r FILE
do
echo "${0} match: ${FILE}"
done <<< "${MATCHING}"

if [ "${CI}" != "" ] || [ "${1}" = "--run" ]; then

    if [ "${CI}" != "" ]; then
        cat <<EEE

${0}: env var CI="${CI}" found, processing on...

EEE
    fi

    if [ "${1}" = "--run" ]; then
        cat <<EEE

${0}: --run argument was given, processing on...

EEE
    fi

    if [ "${MATCHING}" = "" ]; then

  cat <<EEE

  ${0}: nothing to process

EEE
    else

        while read -r MATCHINGFILE
        do
            if [ "${MATCHINGFILE}" != "" ]; then
                echo "${0}: processing ${MATCHINGFILE}"    

                # this still replaces all <body> elements not just first despite the fact that I've removed g swtich ///g
                # perl -pi -e "s/${MATCH}/${REPLACEMENT}/" "${MATCHINGFILE}"

                node "${_DIR}/clicksecure.mjs" "${MATCHINGFILE}" "${REPLACEMENT}"                
            fi        
        done <<< "${MATCHING}"

        cat <<EEE

${0}: finished

EEE

    fi

else
    cat <<EEE

    WARNING:

    ${0}: will not process matching files because CI env var is not present
        nor --run argumet was passed

EEE

fi

