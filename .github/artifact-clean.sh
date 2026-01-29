#!/bin/bash

################################################################################
# ARTIFACT CLEANUP SCRIPT
# This script deletes all artifacts across all of your GitHub repositories.
#
# LOCAL EXECUTION:
#   1. Make sure 'gh' is installed and authenticated ('gh auth login').
#   2. Run: bash .github/artifact-clean.sh [filter]
#
# GITHUB ACTIONS EXECUTION:
#   By default, GitHub Actions GITHUB_TOKEN has access ONLY to the current repo.
#   To clean ALL repositories in your account via GHA, you MUST perform a manual action:
#
#   1. CREATE PAT: Click your Profile Picture (top right) -> Settings ->
#      Developer settings -> Personal access tokens -> Fine-grained tokens
#      -> Generate new token.  (NOT CLASSIC TOKENS)
#   2. EXPIRATION: Set to "No expiration" for long-term automation.
#   3. REPOSITORY ACCESS: Select "All repositories".
#   4. PERMISSIONS: Under "Repository permissions", find "Actions" and 
#      set it to "Read and write".
#   4. COPY TOKEN: Copy the generated token string.
#   5. ADD SECRET: Go to THIS repo's Settings -> Secrets and variables -> Actions
#      -> New repository secret. NAME it 'CLEANUP_PAT' and PASTE the token.
################################################################################

# /bin/bash .github/artifact-clean.sh

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "Error: 'gh' (GitHub CLI) is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if [ -n "$GITHUB_ACTIONS" ] && [ -n "$GITHUB_TOKEN" ]; then
    echo "Running in GitHub Actions with GITHUB_TOKEN..."
elif ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub CLI."
    echo "Please run 'gh auth login' or provide GITHUB_TOKEN."
    exit 1
fi

echo "Fetching repositories and their artifacts..."

# Get list of repositories names
# You can add filters here, e.g. --source (no forks) or --visibility public
# Adding search pattern support if provided as argument
SEARCH_QUERY="$1"

if [ -n "$SEARCH_QUERY" ]; then
    echo "Filtering repositories by: $SEARCH_QUERY"
    repositories=$(gh repo list --limit 1000 --json nameWithOwner -q ".[].nameWithOwner | select(contains(\"$SEARCH_QUERY\"))")
else
    # Default to non-forks to reduce volume, or remove --source to see everything
    repositories=$(gh repo list --limit 1000 --source --json nameWithOwner -q '.[].nameWithOwner')
fi

for REPO in $repositories; do
    # List artifacts for the repository (getting only ID and Name for deletion)
    # Result is newline-separated ID:Name pairs
    artifacts=$(gh api "repos/$REPO/actions/artifacts" --jq '.artifacts[] | "\(.id):\(.name)"')
    
    if [ -n "$artifacts" ]; then
        echo "--- Cleaning Repository: $REPO ---"
        # Using while read to handle names with spaces correctly
        echo "$artifacts" | while IFS=':' read -r ID NAME; do
            if [ -n "$ID" ]; then
                echo "  Deleting: $NAME (ID: $ID)..."
                
                # Use DELETE method to remove the artifact
                gh api -X DELETE "repos/$REPO/actions/artifacts/$ID" --silent
                
                if [ $? -eq 0 ]; then
                    echo "    Done."
                else
                    echo "    FAILED to delete $ID."
                fi
            fi
        done
    fi
done
