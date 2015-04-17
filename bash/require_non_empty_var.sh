


# simple reusable functon to check if env var is defined and not empty
require_non_empty_var() {
  script_name="${1}"
  env_var_name="${2}"

  if [ -z "${script_name}" ] || [ -z "${env_var_name}" ]; then
    echo "Usage: ${FUNCNAME[0]} SCRIPT_NAME ENV_VAR_NAME"
    exit 1
  fi

  if [ ! -e "${script_name}" ]; then
    echo "${script_name} error: Script file does not exist"
    exit 1
  fi

  value="${!env_var_name}"
  value=$(echo "${value}" | tr -d '[:space:]')  # Trim leading and trailing whitespace

  if [ -z "${value}" ]; then
    echo "${script_name} error: ${env_var_name} is not defined or is an empty string"
    exit 1
  fi
}

# simple reusable functon to check if env var is defined and not empty and matches regex
require_non_empty_and_matching_var() {
  script_name="${1}"
  env_var_name="${2}"
  regex="${3}"

  require_non_empty_var "${@}"

  if ! [[ ${!env_var_name} =~ ${regex} ]]; then
    echo "${script_name} error: ${env_var_name} don't match regex ${regex}"
    exit 1
  fi
}

# # Example usage

# ROOT="${_DIR}"
# cd "${ROOT}"
# set -e
# source env.sh
# source bash/require_non_empty_var.sh

# require_non_empty_var "${0}" "PROJECT_NAME"
# require_non_empty_and_matching_var "${0}" "NODE_API_PORT" "^[0-9]+$"