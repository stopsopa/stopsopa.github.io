set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

CERT_FILE="${DIR}/cert/server.crt"

# -------------------------------------------------------
# Helper: check cert file exists
# -------------------------------------------------------
_require_cert() {
  if [[ ! -f "${CERT_FILE}" ]]; then
    echo "${0} error: cert file not found =>${CERT_FILE}<="
    exit 1
  fi
}

# -------------------------------------------------------
# Calculate days remaining until cert expiry
# Returns integer (may be negative if already expired)
# -------------------------------------------------------
_days_left() {
  local not_after
  not_after="$(openssl x509 -in "${CERT_FILE}" -noout -enddate | sed 's/notAfter=//')"
  local expire_epoch
  expire_epoch="$(date -j -f "%b %d %T %Y %Z" "${not_after}" "+%s" 2>/dev/null \
    || date -d "${not_after}" "+%s")"
  local now_epoch
  now_epoch="$(date "+%s")"
  echo $(( (expire_epoch - now_epoch) / 86400 ))
}

# -------------------------------------------------------
# --human  : print full cert details + days left
# -------------------------------------------------------
_human() {
  _require_cert

  echo ">> Cert file: ${CERT_FILE}"
  echo ""

  echo ">> Subject / Issuer / SANs:"
  openssl x509 -in "${CERT_FILE}" -noout -subject -issuer -ext subjectAltName
  echo ""

  echo ">> Validity dates:"
  openssl x509 -in "${CERT_FILE}" -noout -dates
  echo ""

  echo ">> Serial number:"
  openssl x509 -in "${CERT_FILE}" -noout -serial
  echo ""

  echo ">> Fingerprints:"
  openssl x509 -in "${CERT_FILE}" -noout -fingerprint -sha256
  openssl x509 -in "${CERT_FILE}" -noout -fingerprint -sha1
  echo ""

  echo ">> Key usage / Extended key usage:"
  openssl x509 -in "${CERT_FILE}" -noout -ext keyUsage,extendedKeyUsage 2>/dev/null || true
  echo ""

  echo ">> Signature algorithm:"
  openssl x509 -in "${CERT_FILE}" -noout -sigopt rsa_padding_mode:pss 2>/dev/null \
    || openssl x509 -in "${CERT_FILE}" -noout -text \
         | grep -E "Signature Algorithm" | head -1 || true
  echo ""

  echo ">> 30-day validity check:"
  if openssl x509 -in "${CERT_FILE}" -checkend 2592000 -noout; then
    echo "   OK - valid for more than 30 days"
  else
    echo "   WARNING - expires within 30 days"
  fi
  echo ""

  local days
  days="$(_days_left)"
  echo ">> Days left: ${days}"
}

# -------------------------------------------------------
# --machine : print only the integer days left, no newline
#             exit 0 on success, exit 1 on failure
# -------------------------------------------------------
_machine() {
  _require_cert
  local days
  days="$(_days_left)"
  printf "%s" "${days}"
}

# -------------------------------------------------------
# Help page (shown when no argument passed)
# -------------------------------------------------------
_help() {
  cat <<EEE

Usage:

  /bin/bash ${0} <mode>

Modes:

  --human
      Print full certificate details extracted from the cert file:
        - subject, issuer, Subject Alternative Names
        - validity dates (notBefore / notAfter)
        - serial number
        - SHA-256 and SHA-1 fingerprints
        - key usage / extended key usage
        - signature algorithm
        - 30-day expiry check
      Ends with a human-readable "Days left: N" line.
      Exits 0 on success, 1 if cert file is missing.

  --machine
      Print only the integer number of days remaining until expiry.
      No trailing newline. No extra output.
      Exits 0 on success, 1 if cert file is missing or unreadable.
      Useful for scripting, monitoring, and dashboards.

Cert file used: ${DIR}/cert/server.crt
To generate or refresh it run:

  /bin/bash ${DIR}/refresh.sh

EEE
}

# -------------------------------------------------------
# Dispatch
# -------------------------------------------------------
MODE="${1:-}"

case "${MODE}" in
  --human)
    _human
    ;;
  --machine)
    _machine
    ;;
  *)
    _help
    exit 0
    ;;
esac
