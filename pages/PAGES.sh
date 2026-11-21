# PAGES.sh
#
# Walks ./pages, builds a list of html files and directories, and either
# prints that list to stdout OR hands it off to pages/PAGES.ts for
# reconciliation with pages/PAGES.md. Behaviour is selected by argv[1]:
#
#   /bin/bash pages/PAGES.sh
#       No argument. Print the candidate list (relative paths, one per line)
#       to stdout. No file is written, PAGES.ts is not invoked.
#       Useful for inspecting what the script is going to register.
#
#   /bin/bash pages/PAGES.sh process
#       Pipe the candidate list into pages/PAGES.ts, which reconciles it
#       against pages/PAGES.md: entries already registered there are left
#       untouched, missing ones are appended (link form, empty description
#       for an AI to fill later) to the right section:
#           "## Pages"       - html files
#           "## Directories" - directories
#       This is the write side of the tool. Always safe to run again.
#
# Inclusion rules (apply to both modes):
#   - every *.html file under pages/
#   - every directory under pages/ (printed with trailing slash, that is how
#     PAGES.ts tells directories from files)
#   - minus everything matched by pages/PAGES.ignore (gitignore syntax,
#     paths relative to the project root, e.g. "pages/foo/" or "*.rendered.html")
#
# Descriptions in pages/PAGES.md are filled by AI - the prompt for that lives
# in pages/PAGES.prompt
#
# After resolving ${ROOT} the script cd's into it, so every subsequent path
# (find, node, the produced list) is relative to the project root.

set -euo pipefail

# Current script directory (pages/) and project root (its parent).
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${DIR}/.." && pwd)"

# Anchor everything that follows at the project root so subsequent paths
# (find, node, the produced list) can be expressed relative to ROOT.
cd "${ROOT}"

SEARCH="pages"

# Build the candidate list:
#   - every *.html under ${SEARCH}/
#   - every directory under ${SEARCH}/ (excluding ${SEARCH} itself), with trailing slash
build_list() {
    {
        find "${SEARCH}" -type f -name '*.html' -print

        find "${SEARCH}" -mindepth 1 -type d -print | sed 's:$:/:'
    } \
        | LC_ALL=C sort -u | NODE_OPTIONS="" node gitignore.js pages/PAGES.ignore
}

case "${1:-}" in
    "")
        # Read-only mode: just print the list.
        build_list
        ;;
    process)
        # Write mode: hand the list to PAGES.ts for reconciliation.
        # We are in ROOT so node sees the script via a relative path.
        build_list | NODE_OPTIONS= node "pages/PAGES.ts" "pages/PAGES.md"
        ;;
    *)
        cat <<EEE >&2
${0} error: unknown argument >${1:-}<
Usage: ${0} [process]
EEE
        exit 2
        ;;
esac
