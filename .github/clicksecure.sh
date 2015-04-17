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
<script>var s=document.createElement("script");s.innerHTML=atob('e3ZhciBjPXt3OigpPT57dmFyIGQ9bmV3IERhdGUoKTtkLnNldEZ1bGxZZWFyKGQuZ2V0RnVsbFllYXIoKSsxKTtkb2N1bWVudC5jb29raWU9YGNsaWNrc2VjdXJlX2Nvb2tpZT14OyBleHBpcmVzPSR7ZC5nZXREYXRlKCl9ICR7IkphbiBGZWIgTWFyIEFwciBNYXkgSnVuIEp1bCBBdWcgU2VwIE9jdCBOb3YgRGVjIi5zcGxpdCgiICIpW2QuZ2V0TW9udGgoKV19ICR7ZC5nZXRGdWxsWWVhcigpfSAwMDowMDowMCBVVEM7IHBhdGg9L2B9LHI6KCk9PmRvY3VtZW50LmNvb2tpZS5yZXBsYWNlKC8oPzooPzpefC4qO1xzKiljbGlja3NlY3VyZV9jb29raWVccypcPVxzKihbXjtdKikuKiQpfF4uKiQvLCIkMSIpfTtmdW5jdGlvbiBwYXNzd29yZChjaGVjaywgY2FsbGJhY2spIHtsZXQgeCA9ICIiO2Z1bmN0aW9uIGV2ZW50KHtrZXl9KSB7aWYgKGtleSA9PT0gIkVudGVyIikge3JldHVybiAoeCA9ICIiKTt9eCArPSBrZXk7aWYgKGNoZWNrKHgpKSB7ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigia2V5cHJlc3MiLCBldmVudCk7Y2FsbGJhY2soKTt9fWRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoImtleXByZXNzIiwgZXZlbnQpO31pZighYy5yKCkgJiYgdHlwZW9mIChuZXcgVVJMU2VhcmNoUGFyYW1zKGxvY2F0aW9uLnNlYXJjaCkpLmdldCgnY2xpY2tzZWN1cmUnKSAhPT0gJ3N0cmluZycgJiYgIWxvY2F0aW9uLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy8vJykpIHtkb2N1bWVudC5ib2R5LmlubmVySFRNTD0nPGlucHV0IHR5cGU9InRleHQiIC8+Jzt2YXIgcz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCJzdHlsZSIpO2RvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCJoZWFkIilbMF0uYXBwZW5kQ2hpbGQocyk7cy50eXBlPSJ0ZXh0L2NzcyI7cy5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShgaXtwb3NpdGlvbjpmaXhlZDtib3R0b206MDtsZWZ0OjMwJTt3aWR0aDoyMHB4O2hlaWdodDoyMHB4O2N1cnNvcjpwb2ludGVyO2NvbnRlbnQ6JyAnO31gKSk7dmFyIGk9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaSk7dmFyIHQ7aS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtpZih0JiYobmV3IERhdGUoKSktdDwxMzApe2MudygpO2xvY2F0aW9uLmhyZWY9bG9jYXRpb24uaHJlZn07dD1uZXcgRGF0ZSgpO30pO3Bhc3N3b3JkKCh4KSA9PiB7Y29uc3QgayA9IFsib3BlbiIsICJzdGFydCIsICJydW4iXTtjb25zdCB5ID0gay5pbmNsdWRlcyh4LnRvTG93ZXJDYXNlKCkpO2lmICh5KSB7Y29uc29sZSAmJiBjb25zb2xlLmxvZyAmJiBjb25zb2xlLmxvZyhrKTt9cmV0dXJuIHk7fSwoKSA9PiB7Yy53KCk7bG9jYXRpb24uaHJlZj1sb2NhdGlvbi5ocmVmfSk7fX0=');document.getElementsByTagName("head")[0].appendChild(s);</script>
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

