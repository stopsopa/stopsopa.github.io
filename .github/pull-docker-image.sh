
set -e
# set -x
set -o pipefail

VERSION_RAW="$(/bin/bash playwright.sh --version)"

TEST='^[0-9]+\.[0-9]+\.[0-9]+$'

VERSION="$(
    printf '%s\n' "${VERSION_RAW}" |
    grep -m1 -E "${TEST}" || true
)"

if [[ -z "${VERSION}" ]]; then
    cat >&2 <<EOF
${0} error: could not extract version from playwright.sh --version output.

Expected a line matching:
${TEST}

Raw output:
${VERSION_RAW}
EOF
    exit 1
fi

# IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VER}-focal"
# IMAGE="monstersmart/playwright:v${VERSION}-focal-just-chromium"
IMAGE="monstersmart/playwright:v${VERSION}-noble-just-chromium"

# /bin/bash bash/swap-files-v2.sh package.json package.dev.json -- docker pull "${IMAGE}" 
docker pull "${IMAGE}"   
