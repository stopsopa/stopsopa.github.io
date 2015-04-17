
#   replacing 


#   const allChoices = choices.map((choice2, index) => {
#     if (Separator.isSeparator(choice2)) {
#       return ` ${choice2.separator}`;
#     }
#     const line = choice2.name || choice2.value;
#     if (choice2.disabled) {
#       const disabledLabel = typeof choice2.disabled === "string" ? choice2.disabled : "(disabled)";
#       return import_chalk4.default.dim(`- ${line} ${disabledLabel}`);
#     }
#     if (index === cursorPosition) {
#       return import_chalk4.default.cyan(`${import_figures2.default.pointer} ${line}`);
#     }
#     return `  ${line}`;
#   }).join("\n");
#
#
#
#   to 
#
#
#
#   const allChoices = choices.map((choice2, index) => {
#     if (Separator.isSeparator(choice2)) {
#       return ` ${choice2.separator}`;
#     }
#     const line = choice2.name || choice2.value;
#     if (choice2.disabled) {
#       const disabledLabel = typeof choice2.disabled === "string" ? choice2.disabled : "(disabled)";
#       return import_chalk4.default.dim(`- ${line} ${disabledLabel}`);
#     }
#     if (index === cursorPosition) {
#       return import_chalk4.default.inverse(`${import_figures2.default.pointer} ${line}`);
#     }
#     return `  ${line}`;
#   }).join("\n");


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

_PWD="$(pwd)"

ROOT="${_DIR}/../../.."

cd "${ROOT}"

ROOT="$(pwd)"

cd "${_PWD}"

FILE="${_DIR}/xx.node.bundled.gitignored.js"
FILECOPY="${_DIR}/xx.node.bundled.gitignored.cjs"

if [ "${1}" = "" ]; then





  if [ ! -f "${FILE}" ]; then

    cat <<EEE

${0} error: file '${FILE}' doesn't exist 
pwd=$(pwd)
_PWD=${_PWD}

EEE

      exit 1
  fi

cat <<EEE

    ${0} processing "${FILE}"

EEE

  perl -pi -e "s/ import_chalk4\.default\.cyan/ import_chalk4.default.inverse/g" "${FILECOPY}"




else




  WATCHC="0"

  STATUS="0"

  while [ "${STATUS}" = "0" ]; do

      WATCHC="$((WATCHC + 1))"

      until [ -f "${FILE}" ]
      do
          echo "${0}: ${WATCHC} log: waiting for ${FILE} to be created"
          sleep 1
      done

      echo "${0}: ${FILECOPY} tweaked, iteration ${WATCHC}"

      perl -pi -e "s/ import_chalk4\.default\.cyan/ import_chalk4.default.inverse/g" "${FILECOPY}"

      node "${ROOT}/bash/fs/watch.js" "${FILE}"

      STATUS="${?}"
  done





fi

