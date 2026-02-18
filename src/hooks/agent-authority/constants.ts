export const HOOK_NAME = "agent-authority"

export const BLOCKED_GIT_COMMANDS = [
  "git push",
  "git merge",
  "git rebase",
  "git pr",
  "gh pr",
  "git pull --rebase",
]

export const DEFAULT_AGENT_ALLOWLIST: Record<string, string[]> = {
  // Kord is both AIOS master and iterative implementer. It must be able to
  // modify any file inside the current workspace root.
  kord: ["**"],
  // Dev agents execute changes in arbitrary project structures.
  dev: ["**"],
  "dev-junior": ["**"],
  build: ["docs/kord/notepads/**", "docs/kord/runs/**"],
  builder: ["docs/kord/notepads/**", "docs/kord/runs/**"],
  planner: ["docs/kord/plans/**", "docs/kord/drafts/**"],
  sm: ["docs/kord/stories/**"],
  pm: [
    "docs/kord/plans/**",
    "docs/kord/prds/**",
    "docs/kord/epics/**",
    "docs/epics/**",
  ],
  po: ["docs/kord/stories/**", "docs/kord/epics/**"],
  qa: ["docs/kord/stories/**", "docs/kord/notepads/reviews/**"],
  architect: [
    "docs/kord/adrs/**",
    "docs/kord/architecture/**",
    "docs/kord/epics/**",
    "docs/architecture/**",
  ],
  analyst: ["docs/kord/research/**"],
  devops: [
    ".github/**",
    "Dockerfile",
    "docker-compose.*",
    "docs/kord/notepads/**",
    "docs/kord/runs/**",
  ],
  "data-engineer": ["**/migrations/**", "**/schema.*", "supabase/**"],
  "ux-design-expert": [
    "docs/**",
    "**/*.css",
    "**/*.scss",
    "**/design-tokens/**",
    "**/components/**/*.tsx",
  ],
  "squad-creator": [".opencode/squads/**"],
}
