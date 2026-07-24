#
# cutter.sh
#
# Removes code blocks between markers from files while keeping a backup copy,
# and restores the original files when needed.
#
# Usage:
#
#

#    find . \
#    -type f \
#    \( -name '*.ts' -o -name '*.js' -o -name '*.tsx' \) \
#    -not -path './.git/*' \
#    -not -path './node_modules/*' \
#    -exec awk '
#        /__start__/ { found_start=1 }
#        found_start && /__end__/ {
#        print FILENAME
#        exit
#        }
#    ' {} \; | /bin/bash bash/cutter.sh cut __start__ __end__

#
# CUT:
#   - Creates a backup: file -> file.cp
#   - Removes all lines between START and END markers (including markers)
#
# Example:
#
#   // __start__
#   import { Sandbox } from "./sandbox/Sandbox";
#   // __end__
#
# becomes removed completely.
#
#
# RESTORE:
#
#   find . -type f | /bin/bash bash/cutter.sh restore __start__ __end__
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
        echo "Skipping ${file} (backup already exists)"
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

      echo "Cut: ${file}"
      ;;

    restore)
      backup="${file}.cp"

      if [[ ! -e "${backup}" ]]; then
        echo "No backup for ${file}"
        continue
      fi

      mv "${backup}" "${file}"

      echo "Restored: ${file}"
      ;;

    *)
      cat <<EOF
Unknown action: ${ACTION}

Usage:
  find . -type f | ${0} cut START END
  find . -type f | ${0} restore START END
EOF
      exit 1
      ;;
  esac

done