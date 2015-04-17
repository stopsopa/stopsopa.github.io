#
# cutter.sh
#
# Removes code blocks between markers from files while keeping a backup copy,
# and restores the original files when needed.
#
# Usage:
#
# see https://github.com/stopsopa/stopsopa.github.io/blob/master/bash/cutter.sh
# and https://stopsopa.github.io/pages/bash/index.html#cutter_sh
# thanks to this heredoc fed to bash we can run all of this more than one time in a row 
# and it will not override var/cutter_sh

# cat <<'EOF' | /bin/bash
#
# set -e
# set -o pipefail
#
# START="__start__"
# END="__end__"
#
# tmp="$(mktemp)"
#
# find . \
# -type f \
# \( -name '*.ts' -o -name '*.js' -o -name '*.tsx' \) \
# -not -path './.git/*' \
# -not -path './node_modules/*' \
# -exec awk '
#     /'"${START}"'/ { found_start=1 }
#     found_start && /'"${END}"'/ {
#     print FILENAME
#     exit
#     }
# ' {} \; > "${tmp}"
#
# if [[ -s "${tmp}" ]]; then
# mv "${tmp}" var/cutter_sh
# /bin/bash bash/cutter.sh cut "${START}" "${END}" < var/cutter_sh
# else
# rm "${tmp}"
# echo "bash/cutter.sh: Nothing to cut."
# fi
#
# EOF

# CUT:
#   - Creates a backup: file -> file.cp
#   - Removes all lines between START and END markers (including markers)
#
# Example:
#
#      // __start__
#      import { Sandbox } from "./sandbox/Sandbox";
#      // __end__
# or
#      {/* // __start__ */} 
#      <Route path="/" element={<MainPage />} />
#      {/* // __end__ */}
#
# becomes removed completely.
#
# RESTORE:
#
#   cat var/cutter_sh | /bin/bash bash/cutter.sh restore __start__ __end__
#
#   Restores files from their .cp backup.
#
# Notes:
#   - Multiple marker blocks per file are supported.
#   - Existing .cp backups are not overwritten.
#   - Markers can be any text, for example:
#
#       __start__ / __end__
#       FEATURE_START / FEATURE_END
#


set -e

ACTION="${1}"
START="${2}"
END="${3}"

if [[ -z "${ACTION}" || -z "${START}" || -z "${END}" ]]; then
  cat <<EOF
${0}:  
Usage:
  find . -type f | ${0} cut START END
  find . -type f | ${0} restore START END
EOF
  exit 1
fi

while IFS= read -r file; do
  [[ -z "${file}" ]] && continue

  case "${ACTION}" in
    cut)
      backup="${file}.cp"

      if [[ -e "${backup}" ]]; then
        echo "${0}: Skipping ${file} (backup already exists)"
        continue
      fi

      cp "${file}" "${backup}"

      awk -v start="${START}" -v end="${END}" '
        index($0, start) {
          skip=1
        }

        !skip {
          print
        }

        index($0, end) {
          skip=0
          next
        }
      ' "${file}" > "${file}.tmp"

      mv "${file}.tmp" "${file}"

      echo "${0} processing: ${file}"
      ;;

    restore)
      backup="${file}.cp"

      if [[ ! -e "${backup}" ]]; then
        echo "${0}: No backup for ${file}"
        continue
      fi

      mv "${backup}" "${file}"

      echo "${0} restored: ${file}"
      ;;

    *)
      cat <<EOF
${0}:      
Unknown action: ${ACTION}

Usage:
  find . -type f | ${0} cut START END
  find . -type f | ${0} restore START END
EOF
      exit 1
      ;;
  esac

done