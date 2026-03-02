export const GIT_PR_CREATE_TEMPLATE = `# /git-pr-create

This command MUST be executed by @devops with git-master loaded.

Action:
- Immediately delegate to @devops using the task tool with \`load_skills=["git-master"]\`.
- Pass the user arguments through unchanged.

Delegation prompt for @devops:

1. TASK: Create or update a GitHub Pull Request targeting base branch \`dev\`.
2. EXPECTED OUTCOME: PR exists/updated; returns PR URL.
3. REQUIRED TOOLS: bash (git), gh.
4. MUST DO:
   - Base branch MUST be \`dev\` (never master).
   - Do NOT push in this command; if branch is not on origin, stop and instruct user to run \`git push -u origin <branch>\`.
   - If PR already exists for the current branch, update (gh pr edit) instead of creating a duplicate.
   - Generate title/body from commits + diff if user didn't specify.
5. MUST NOT DO:
   - Do not create PR to master.
   - Do not merge.
6. USER ARGS:
   $ARGUMENTS

Now delegate:
task(subagent_type="devops", load_skills=["git-master"], run_in_background=false, description="Create PR targeting dev", prompt="<use the Delegation prompt above>")
`
