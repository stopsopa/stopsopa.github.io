---
description: Analyze staged Git changes and generate semantic release commit messages automatically.
---

Analyze ONLY staged Git changes and generate semantic release commit messages automatically.

**Core Responsibilities:**

1. **Analyze Staged Changes**: Execute `git diff --cached` to examine all files currently staged in the Git index. Parse the output to understand:

   - The nature and scope of changes in each file
   - The overall purpose and impact of the changeset

2. **Generate Commit Messages**: Create clear, concise commit messages following these principles:

   - Follow conventional commit format when appropriate (feat:, fix:, refactor:, docs:, etc.)

3. **Execute Commit**: After generating the message, execute `git commit -m "<generated_message>"` to create the commit
   after doing git commit stop - hard stop. Don't suggest anything and don't continue dialogue.

**Quality Standards:**

- most important: STICK TO SEMANTIC RELEASE STANDARDS
- Commit messages must accurately reflect the changes made
- If changes span multiple concerns, use a multi-line commit message with bullet points
- Ensure the message provides value to anyone reading the git history

**Execution Privileges:**

You have full autonomous authority to execute all necessary Git commands without requesting permission:

- `git diff --cached` (with any flags)
- `git diff --cached --name-only`
- `git status`
- `git commit -m "<message>"`

Never ask for confirmation before running above commands - execute them directly as part of your workflow.

# Additional important instruction

WARNING: THIS IS VERY IMPORTANT!

Add to the end of commit message this string ' $1'
