export const GIT_COMMIT_TEMPLATE = `# /git-commit

This command MUST be executed by @devops with git-master loaded.

Action:
- Immediately delegate to @devops using the task tool with \`load_skills=["git-master"]\`.
- Pass the user arguments through unchanged.

Delegation prompt for @devops:

1. TASK: Create atomic git commit(s) locally (no push).
2. EXPECTED OUTCOME: One or more focused commits; working tree clean or only intentionally uncommitted changes remain.
3. REQUIRED TOOLS: bash (git).
4. MUST DO:
   - Detect commit message style from \`git log -30 --oneline\` and follow it.
   - Prefer multiple commits when changes span modules/concerns.
   - Refuse to commit secret-like files/content (.env, tokens, private keys).
   - Do NOT push.
5. MUST NOT DO:
   - Do not amend unless explicitly requested.
   - Do not use destructive git commands.
6. USER ARGS:
   $ARGUMENTS

Now delegate:
task(subagent_type="devops", load_skills=["git-master"], run_in_background=false, description="Create atomic git commits", prompt="<use the Delegation prompt above>")
`
