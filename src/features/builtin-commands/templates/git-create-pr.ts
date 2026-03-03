export const GIT_CREATE_PR_TEMPLATE = `# /git-create-pr

This command MUST be executed by @devops with git-master loaded.

Action:
- Immediately delegate to @devops using the task tool with \`load_skills=["git-master"]\`.
- Pass the user arguments through unchanged.

Delegation prompt for @devops:

1. TASK: Create or update a GitHub Pull Request.
2. EXPECTED OUTCOME: PR exists/updated; returns PR URL.
3. REQUIRED TOOLS: bash (git), gh.
4. MUST DO:
   - Determine target base branch using this priority order:
     1. If user specified a branch in USER ARGS (e.g. "/git-create-pr dev"), use it.
     2. Otherwise, run \`git rev-parse --abbrev-ref @{upstream}\` to get the tracked upstream (e.g. "origin/dev"). Strip the remote prefix to get the branch name (e.g. "dev").
        - If the upstream branch name DIFFERS from the current branch → use it as target (e.g. feature/foo tracking origin/dev → target is "dev").
        - If the upstream branch name is the SAME as the current branch (e.g. on "dev" tracking "origin/dev") → run \`gh repo view --json defaultBranchRef --jq .defaultBranchRef.name\` and use the repo default branch (usually "main") as target.
     3. If no upstream is set, stop and ask the user: "Which branch should this PR target? (e.g. dev, main)"
   - Do NOT push in this command; if current branch is not on origin, stop and instruct user to run \`git push -u origin <current-branch>\`.
   - If PR already exists for the current branch, update (gh pr edit) instead of creating a duplicate.
   - Generate title/body from commits + diff if user didn't specify.
5. MUST NOT DO:
   - Do not merge.
6. USER ARGS:
   $ARGUMENTS

Now delegate:
task(subagent_type="devops", load_skills=["git-master"], run_in_background=false, description="Create PR", prompt="<use the Delegation prompt above>")
`
