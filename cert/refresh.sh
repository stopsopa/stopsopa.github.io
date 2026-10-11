set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$(cd "${DIR}/.." && pwd)"

ENV_FILE="${ROOT}/.env"
CERT_DIR="${DIR}/cert"

# -------------------------------------------------------
# Load LOCAL_HOSTS from .env
# We only parse lines of the form KEY="value" or KEY=value
# -------------------------------------------------------
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "${0} error: .env file not found at =>${ENV_FILE}<="
  exit 1
fi

LOCAL_HOSTS="$(grep -E '^LOCAL_HOSTS=' "${ENV_FILE}" | head -1 | sed 's/^LOCAL_HOSTS=//;s/^"//;s/"$//')"

if [[ -z "${LOCAL_HOSTS}" ]]; then
  echo "${0} error: LOCAL_HOSTS is not set in =>${ENV_FILE}<="
  exit 1
fi

# -------------------------------------------------------
# Check mkcert is installed
# -------------------------------------------------------
if ! command -v mkcert &>/dev/null; then
  cat <<EEE

${0} error: mkcert is not installed.
  Install it with:

    brew install mkcert

EEE
  exit 1
fi

# -------------------------------------------------------
# Ensure the local CA is trusted by the OS
# (idempotent - safe to run every time)
# -------------------------------------------------------
echo ">> Installing / verifying mkcert local CA in system trust store..."
mkcert -install

# -------------------------------------------------------
# (Re)create cert output directory
# -------------------------------------------------------
rm -rf "${CERT_DIR}"
mkdir -p "${CERT_DIR}"

# -------------------------------------------------------
# Generate certificate and key for LOCAL_HOSTS
# We specify explicit output filenames so server.js
# can always reference fixed paths: cert/cert/server.{crt,key}
# -------------------------------------------------------
echo ">> Generating certificate for: ${LOCAL_HOSTS}"

cd "${CERT_DIR}"

mkcert \
  -cert-file server.crt \
  -key-file  server.key \
  "${LOCAL_HOSTS}"

echo ""
echo ">> Done. Files written to ${CERT_DIR}:"
ls -lh "${CERT_DIR}"

# -------------------------------------------------------
# Quick sanity checks
# -------------------------------------------------------
echo ""
echo ">> Certificate info:"
openssl x509 -in "${CERT_DIR}/server.crt" -noout -subject -issuer -ext subjectAltName

echo ""
echo ">> Validity dates:"
openssl x509 -in "${CERT_DIR}/server.crt" -noout -dates

echo ""
echo ">> Valid for at least 30 more days?"
if openssl x509 -in "${CERT_DIR}/server.crt" -checkend 2592000 -noout; then
  echo "   YES"
else
  cat <<EEE

${0} error: certificate expires within 30 days - re-run this script to renew

EEE
  exit 1
fi
