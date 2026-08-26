# GLOSSARY.sh
#
# Walks ./bash, builds a list of script-shaped files, and either prints that
# list to stdout OR hands it off to bash/GLOSSARY.ts for reconciliation with
# bash/GLOSSARY.md. Behaviour is selected by argv[1]:
#
#   /bin/bash bash/GLOSSARY.sh
#       No argument. Print the candidate file list (relative paths, one per
#       line) to stdout. No file is written, GLOSSARY.ts is not invoked.
#       Useful for inspecting what the script considers a "script file".
#
#   /bin/bash bash/GLOSSARY.sh process
#       Pipe the candidate list into bash/GLOSSARY.ts, which reconciles it
#       against bash/GLOSSARY.md (migrates legacy backtick entries to link
#       form, appends new files in link form with empty description for an AI
#       to fill later). This is the write side of the tool.
#
# Inclusion rules (apply to both modes):
#   - *.sh and *.ts are always included.
#   - *.js is included only when no sibling *.ts with the same basename exists
#     in the same directory (filters out transpilation artefacts like foo.js
#     next to foo.ts).
#
# After resolving ${ROOT} the script cd's into it, so every subsequent path
# (find, node, the produced list) is relative to the project root.

# 
# Prompt to create descriptions for rest of the scripts:
# -------------------------------------------------------
# bash/GLOSSARY.md in this md file we have long list where ach line          
# represent individual scripts from bash script,                                                                             
                                                                                                                           
# and each line should have path and description for it (short but still descriptive enough) for given script                
                                                                                                                           
# in our md file right now there are some descriptions missing for many scripts                                              
                                                                                                                           
# create descriptions for missing scripts                                                                                    
                                                                                                                           
# just go to individual scripts, inspect what each do and generate short summary ( but still self descriptive) descriptions 
# 
# inspect one script and then produce and write description, and then another one but again, write immediately.              
                                                                                                                           
# I want you to do it one by one. Don't buffer too many descriptions in memory.                                              
                                                                                                                           
# This way when something will break (AI will be interrupted) we will at least progress with something  
# 
# 

set -euo pipefail

# Current script directory (bash/) and project root (its parent).
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${DIR}/.." && pwd)"

# Anchor everything that follows at the project root so subsequent paths
# (find, node, the produced list) can be expressed relative to ROOT.
cd "${ROOT}"

SEARCH="bash"

# Build the candidate list:
#   - every *.sh and *.ts under ${SEARCH}/
#   - *.js only when no same-dir, same-basename *.ts sibling exists
build_list() {
    {
        find "${SEARCH}" -type f \( -name '*.sh' -o -name '*.ts' \) -print

        # *.js candidates, filtered: drop any with a sibling .ts next to it.
        find "${SEARCH}" -type f -name '*.js' -print \
            | while IFS= read -r js; do
                  ts="${js%.js}.ts"
                  [[ -e "${ts}" ]] || printf '%s\n' "${js}"
              done
    } \
        | sort -u
}

case "${1:-}" in
    "")
        # Read-only mode: just print the list.
        build_list
        ;;
    process)
        # Write mode: hand the list to GLOSSARY.ts for reconciliation.
        # cd into ROOT so node sees the script via a relative path.
        build_list | NODE_OPTIONS= node "bash/GLOSSARY.ts" "bash/GLOSSARY.md"
        ;;
    *)
        cat <<EEE >&2
${0} error: unknown argument >${1:-}<
Usage: ${0} [process]
EEE
        exit 2
        ;;
esac
