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
  // Orchestrator needs to write both code and Kord-authored outputs.
  kord: ["src/**", "docs/kord/**"],
  dev: ["src/**", "docs/kord/stories/**", "docs/kord/notepads/**"],
  "dev-junior": ["src/**", "docs/kord/stories/**", "docs/kord/notepads/**"],
  build: ["docs/kord/notepads/**", "docs/kord/runs/**"],
  builder: ["docs/kord/notepads/**", "docs/kord/runs/**"],
  planner: ["docs/kord/plans/**", "docs/kord/drafts/**"],
  sm: ["docs/kord/stories/**"],
  pm: ["docs/kord/plans/**", "docs/epics/**"],
  po: ["docs/kord/stories/**"],
  qa: ["docs/kord/stories/**", "docs/kord/notepads/reviews/**"],
  architect: ["docs/kord/adrs/**", "docs/kord/architecture/**", "docs/architecture/**"],
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
    "**/*.css",
    "**/*.scss",
    "**/design-tokens/**",
    "**/components/**/*.tsx",
  ],
  "squad-creator": [".opencode/squads/**"],
}
