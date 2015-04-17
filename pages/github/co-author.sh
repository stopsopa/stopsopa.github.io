
#
# Run:
#   /bin/bash pages/github/co-author.sh  https://github.com/gemini-cli
#   /bin/bash pages/github/co-author.sh  https://github.com/claude
#

# Check if jq is installed
if ! command -v jq >/dev/null 2>&1; then
    echo "${0} error: jq is not installed. Please install it to use this script." >&2
    exit 1
fi

# Check if the URL argument is provided
if [[ -z "${1}" ]]; then
    cat <<EEE
Usage: /bin/bash ${0} <github-account-url>
Example: /bin/bash ${0} https://github.com/gemini-cli
EEE
    exit 1
fi

GITHUB_URL="${1}"

# Extract username from URL (removes trailing slash if present, then gets last part)
USERNAME=$(echo "${GITHUB_URL}" | sed 's|/*$||; s|.*/||')

if [[ -z "${USERNAME}" ]]; then
    echo "${0} error: Could not extract username from URL GITHUB_URL=>${GITHUB_URL}<" >&2
    exit 1
fi

# Fetch user data from GitHub API
API_URL="https://api.github.com/users/${USERNAME}"
USER_DATA=$(curl -s "${API_URL}")

# Extract ID using jq
USER_ID=$(echo "${USER_DATA}" | jq -r '.id // empty')

# Check if we got a valid ID
if [[ -z "${USER_ID}" || "${USER_ID}" == "null" ]]; then
    MESSAGE=$(echo "${USER_DATA}" | jq -r '.message // "Unknown error"')
    echo "${0} error: Could not fetch user ID for USERNAME=>${USERNAME}<. GitHub API says: ${MESSAGE}" >&2
    exit 1
fi

# Extract Type using jq
USER_TYPE=$(echo "${USER_DATA}" | jq -r '.type // empty')

echo "${0} info: Detected account type: ${USER_TYPE}"

if [[ "${USER_TYPE}" != "User" ]]; then
    echo "${0} error: Refusing to generate co-author footer for account type \"${USER_TYPE}\". Only \"User\" accounts are supported." >&2
    exit 1
fi

# Generate the Co-authored-by line
echo ""
echo '```'
echo "comment"
echo ""
echo "Co-authored-by: ${USERNAME} <${USER_ID}+${USERNAME}@users.noreply.github.com>"
echo '```'
