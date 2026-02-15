export const INIT_DEEP_TEMPLATE = `# /init-deep

Generate hierarchical AGENTS.md files. Root + complexity-scored subdirectories.

## Usage

\`\`\`
/init-deep                      # Update mode: modify existing + create new where warranted
/init-deep --create-new         # Read existing → remove all → regenerate from scratch
/init-deep --max-depth=2        # Limit directory depth (default: 3)
\`\`\`

---

## Workflow (High-Level)

0. **Project Maturity Detection** - Classify brownfield/greenfield/hybrid
1. **Discovery + Analysis** (concurrent, calibrated by maturity)
   - Fire background explore agents immediately
   - Main session: bash structure + LSP codemap + read existing AGENTS.md
2. **Score & Decide** - Determine AGENTS.md locations from merged findings
3. **Generate** - Root first, then subdirs in parallel
4. **Review** - Deduplicate, trim, validate
5. **Kord AIOS Context** - Inject agents, skills, commands, squads, methodology into root AGENTS.md

<critical>
**TodoWrite ALL phases. Mark in_progress → completed in real-time.**
\`\`\`
TodoWrite([
  { id: "maturity", content: "Detect project maturity (brownfield/greenfield/hybrid)", status: "pending", priority: "high" },
  { id: "discovery", content: "Fire explore agents + LSP codemap + read existing", status: "pending", priority: "high" },
  { id: "scoring", content: "Score directories, determine locations", status: "pending", priority: "high" },
  { id: "generate", content: "Generate AGENTS.md files (root + subdirs)", status: "pending", priority: "high" },
  { id: "review", content: "Deduplicate, validate, trim", status: "pending", priority: "medium" },
  { id: "kord-context", content: "Inject Kord AIOS context (agents, skills, commands, squads, methodology)", status: "pending", priority: "high" }
])
\`\`\`
</critical>

---

## Phase 0: Project Maturity Detection

**Mark "maturity" as in_progress.**

Before deep analysis, classify the project to calibrate discovery depth and generation strategy.

\`\`\`bash
# Maturity signals
git_commits=$(git rev-list --count HEAD 2>/dev/null || echo 0)
has_ci=$(test -d .github/workflows && echo "yes" || echo "no")
has_tests=$(find . -type f \\( -name "*.test.*" -o -name "*.spec.*" \\) -not -path '*/node_modules/*' | head -1)
has_readme=$(test -f README.md && echo "yes" || echo "no")
existing_agents=$(find . -name "AGENTS.md" -not -path '*/node_modules/*' | wc -l)
total_files=$(find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | wc -l)
\`\`\`

| Signal | Brownfield | Greenfield |
|--------|-----------|------------|
| Git commits | >50 | <10 |
| CI/CD | Present | Absent |
| Test files | Present | Absent |
| Source files | >20 | <20 |
| Existing AGENTS.md | >0 | 0 |

**Classification**:
- **Brownfield** (≥3 brownfield signals): RESPECT existing patterns, extract conventions, heavier discovery
- **Greenfield** (≥3 greenfield signals): ESTABLISH conventions, focus on tech stack, lighter discovery
- **Hybrid** (mixed signals): Treat as brownfield (safer — respects what exists)

**Store result as PROJECT_MATURITY = brownfield | greenfield | hybrid**

**Mark "maturity" as completed.**

---

## Phase 1: Discovery + Analysis (Concurrent)

**Mark "discovery" as in_progress.**

**Calibrate by maturity**: Brownfield → more explore agents, deeper convention extraction. Greenfield → fewer agents, focus on tech stack detection.

### Fire Background Explore Agents IMMEDIATELY

Don't wait—these run async while main session works.

\`\`\`
// Fire all at once, collect results later
task(subagent_type="explore", load_skills=[], description="Explore project structure", run_in_background=true, prompt="Project structure: PREDICT standard patterns for detected language → REPORT deviations only")
task(subagent_type="explore", load_skills=[], description="Find entry points", run_in_background=true, prompt="Entry points: FIND main files → REPORT non-standard organization")
task(subagent_type="explore", load_skills=[], description="Find conventions", run_in_background=true, prompt="Conventions: FIND config files (.eslintrc, pyproject.toml, .editorconfig) → REPORT project-specific rules")
task(subagent_type="explore", load_skills=[], description="Find anti-patterns", run_in_background=true, prompt="Anti-patterns: FIND 'DO NOT', 'NEVER', 'ALWAYS', 'DEPRECATED' comments → LIST forbidden patterns")
task(subagent_type="explore", load_skills=[], description="Explore build/CI", run_in_background=true, prompt="Build/CI: FIND .github/workflows, Makefile → REPORT non-standard patterns")
task(subagent_type="explore", load_skills=[], description="Find test patterns", run_in_background=true, prompt="Test patterns: FIND test configs, test structure → REPORT unique conventions")
\`\`\`

<dynamic-agents>
**DYNAMIC AGENT SPAWNING**: After bash analysis, spawn ADDITIONAL explore agents based on project scale:

| Factor | Threshold | Additional Agents |
|--------|-----------|-------------------|
| **Total files** | >100 | +1 per 100 files |
| **Total lines** | >10k | +1 per 10k lines |
| **Directory depth** | ≥4 | +2 for deep exploration |
| **Large files (>500 lines)** | >10 files | +1 for complexity hotspots |
| **Monorepo** | detected | +1 per package/workspace |
| **Multiple languages** | >1 | +1 per language |

\`\`\`bash
# Measure project scale first
total_files=$(find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | wc -l)
total_lines=$(find . -type f \\( -name "*.ts" -o -name "*.py" -o -name "*.go" \\) -not -path '*/node_modules/*' -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
large_files=$(find . -type f \\( -name "*.ts" -o -name "*.py" \\) -not -path '*/node_modules/*' -exec wc -l {} + 2>/dev/null | awk '$1 > 500 {count++} END {print count+0}')
max_depth=$(find . -type d -not -path '*/node_modules/*' -not -path '*/.git/*' | awk -F/ '{print NF}' | sort -rn | head -1)
\`\`\`

Example spawning:
\`\`\`
// 500 files, 50k lines, depth 6, 15 large files → spawn 5+5+2+1 = 13 additional agents
task(subagent_type="explore", load_skills=[], description="Analyze large files", run_in_background=true, prompt="Large file analysis: FIND files >500 lines, REPORT complexity hotspots")
task(subagent_type="explore", load_skills=[], description="Explore deep modules", run_in_background=true, prompt="Deep modules at depth 4+: FIND hidden patterns, internal conventions")
task(subagent_type="explore", load_skills=[], description="Find shared utilities", run_in_background=true, prompt="Cross-cutting concerns: FIND shared utilities across directories")
// ... more based on calculation
\`\`\`
</dynamic-agents>

### Main Session: Concurrent Analysis

**While background agents run**, main session does:

#### 1. Bash Structural Analysis
\`\`\`bash
# Directory depth + file counts
find . -type d -not -path '*/\\.*' -not -path '*/node_modules/*' -not -path '*/venv/*' -not -path '*/dist/*' -not -path '*/build/*' | awk -F/ '{print NF-1}' | sort -n | uniq -c

# Files per directory (top 30)
find . -type f -not -path '*/\\.*' -not -path '*/node_modules/*' | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -30

# Code concentration by extension
find . -type f \\( -name "*.py" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.go" -o -name "*.rs" \\) -not -path '*/node_modules/*' | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -20

# Existing AGENTS.md / CLAUDE.md
find . -type f \\( -name "AGENTS.md" -o -name "CLAUDE.md" \\) -not -path '*/node_modules/*' 2>/dev/null
\`\`\`

#### 2. Read Existing AGENTS.md
\`\`\`
For each existing file found:
  Read(filePath=file)
  Extract: key insights, conventions, anti-patterns
  Store in EXISTING_AGENTS map
\`\`\`

If \`--create-new\`: Read all existing first (preserve context) → then delete all → regenerate.

#### 3. LSP Codemap (if available)
\`\`\`
LspServers()  # Check availability

# Entry points (parallel)
LspDocumentSymbols(filePath="src/index.ts")
LspDocumentSymbols(filePath="main.py")

# Key symbols (parallel)
LspWorkspaceSymbols(filePath=".", query="class")
LspWorkspaceSymbols(filePath=".", query="interface")
LspWorkspaceSymbols(filePath=".", query="function")

# Centrality for top exports
LspFindReferences(filePath="...", line=X, character=Y)
\`\`\`

**LSP Fallback**: If unavailable, rely on explore agents + AST-grep.

### Collect Background Results

\`\`\`
// After main session analysis done, collect all task results
for each task_id: background_output(task_id="...")
\`\`\`

**Merge: bash + LSP + existing + explore findings. Mark "discovery" as completed.**

---

## Phase 2: Scoring & Location Decision

**Mark "scoring" as in_progress.**

### Scoring Matrix

| Factor | Weight | High Threshold | Source |
|--------|--------|----------------|--------|
| File count | 3x | >20 | bash |
| Subdir count | 2x | >5 | bash |
| Code ratio | 2x | >70% | bash |
| Unique patterns | 1x | Has own config | explore |
| Module boundary | 2x | Has index.ts/__init__.py | bash |
| Symbol density | 2x | >30 symbols | LSP |
| Export count | 2x | >10 exports | LSP |
| Reference centrality | 3x | >20 refs | LSP |

### Decision Rules

| Score | Action |
|-------|--------|
| **Root (.)** | ALWAYS create |
| **>15** | Create AGENTS.md |
| **8-15** | Create if distinct domain |
| **<8** | Skip (parent covers) |

### Output
\`\`\`
AGENTS_LOCATIONS = [
  { path: ".", type: "root" },
  { path: "src/hooks", score: 18, reason: "high complexity" },
  { path: "src/api", score: 12, reason: "distinct domain" }
]
\`\`\`

**Mark "scoring" as completed.**

---

## Phase 3: Generate AGENTS.md

**Mark "generate" as in_progress.**

<critical>
**File Writing Rule**: If AGENTS.md already exists at the target path → use \`Edit\` tool. If it does NOT exist → use \`Write\` tool.
NEVER use Write to overwrite an existing file. ALWAYS check existence first via \`Read\` or discovery results.
</critical>

### Root AGENTS.md (Full Treatment)

\`\`\`markdown
# PROJECT KNOWLEDGE BASE

**Generated:** {TIMESTAMP}
**Commit:** {SHORT_SHA}
**Branch:** {BRANCH}

## OVERVIEW
{1-2 sentences: what + core stack}

## STRUCTURE
\\\`\\\`\\\`
{root}/
├── {dir}/    # {non-obvious purpose only}
└── {entry}
\\\`\\\`\\\`

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|

## CODE MAP
{From LSP - skip if unavailable or project <10 files}

| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|

## CONVENTIONS
{ONLY deviations from standard}

## ANTI-PATTERNS (THIS PROJECT)
{Explicitly forbidden here}

## UNIQUE STYLES
{Project-specific}

## COMMANDS
\\\`\\\`\\\`bash
{dev/test/build}
\\\`\\\`\\\`

## NOTES
{Gotchas}
\`\`\`

**Quality gates**: 50-150 lines, no generic advice, no obvious info.

### Subdirectory AGENTS.md (Parallel)

Launch writing tasks for each location:

\`\`\`
for loc in AGENTS_LOCATIONS (except root):
  task(category="writing", load_skills=[], run_in_background=false, description="Generate AGENTS.md", prompt=\\\`
    Generate AGENTS.md for: \${loc.path}
    - Reason: \${loc.reason}
    - 30-80 lines max
    - NEVER repeat parent content
    - Sections: OVERVIEW (1 line), STRUCTURE (if >5 subdirs), WHERE TO LOOK, CONVENTIONS (if different), ANTI-PATTERNS
  \\\`)
\`\`\`

**Wait for all. Mark "generate" as completed.**

---

## Phase 4: Review & Deduplicate

**Mark "review" as in_progress.**

For each generated file:
- Remove generic advice
- Remove parent duplicates
- Trim to size limits
- Verify telegraphic style

**Mark "review" as completed.**

---

## Final Report

\`\`\`
=== init-deep Complete ===

Mode: {update | create-new}

Files:
  [OK] ./AGENTS.md (root, {N} lines)
  [OK] ./src/hooks/AGENTS.md ({N} lines)

Dirs Analyzed: {N}
AGENTS.md Created: {N}
AGENTS.md Updated: {N}

Hierarchy:
  ./AGENTS.md
  └── src/hooks/AGENTS.md
\`\`\`

---

## Phase 5: KORD AIOS Context Injection

**After generating AGENTS.md files, enrich the ROOT AGENTS.md with Kord AIOS context.**

This phase adds project-aware orchestration metadata so agents understand the full environment.

### 5a. Active Agents

Discover agents dynamically — do NOT use a hardcoded list:

\\\`\\\`\\\`bash
# Check for agent definitions in the plugin or project
find . -path '*/agents/*.ts' -not -path '*/node_modules/*' -not -name '*.test.*' 2>/dev/null | head -30
# Also check opencode.json for plugin-registered agents
cat opencode.json 2>/dev/null | grep -A2 '"agents"'
\\\`\\\`\\\`

If agent source is not accessible (compiled plugin), use call_kord_agent to query available agents, or read existing AGENTS.md for previously documented agents.

Generate the agent table from discovered data:
\\\`\\\`\\\`markdown
## KORD AIOS AGENTS

| Agent | Role | Mode | Delegation |
|-------|------|------|------------|
| {agent} | {role from description} | {primary/all/subagent} | {who invokes it} |
\\\`\\\`\\\`

### 5b. Installed Skills

Scan for skills in these locations:
- Built-in skills (from plugin)
- \`.kord/skills/\` (project-level)
- \`.opencode/skills/\` (user-level)

\\\`\\\`\\\`bash
# Discover skill directories and read frontmatter for descriptions
for skill_file in $(find .kord/skills .opencode/skills -name "SKILL.md" 2>/dev/null); do
  dir=$(dirname "$skill_file")
  name=$(basename "$dir")
  desc=$(head -10 "$skill_file" | grep -i 'description' | head -1)
  echo "$name | project | $desc"
done
\\\`\\\`\\\`

For built-in skills, check the plugin's skill registry or existing AGENTS.md.

Add to AGENTS.md:
\\\`\\\`\\\`markdown
## INSTALLED SKILLS

| Skill | Source | Description |
|-------|--------|-------------|
| {skill-name} | builtin / .kord/skills/ | {from SKILL.md frontmatter or plugin registry} |
\\\`\\\`\\\`

### 5c. Available Commands

List all registered slash commands:

\\\`\\\`\\\`markdown
## AVAILABLE COMMANDS

| Command | Description |
|---------|-------------|
| /init-deep | Generate hierarchical AGENTS.md knowledge base |
| /start-work | Start Kord work session from plan |
| /checkpoint | Trigger @po checkpoint decision |
| /status | Show current plan progress, wave, pending items |
| /squad | Switch active squad context |
| /ralph-loop | Self-referential dev loop until completion |
| /refactor | Intelligent refactoring with LSP + AST-grep |
| /stop-continuation | Stop all continuation mechanisms |
\\\`\\\`\\\`

### 5d. Squad Definitions

Scan for squad manifests:
\\\`\\\`\\\`bash
find .kord/squads .opencode/squads docs/kord/squads -name "SQUAD.yaml" 2>/dev/null
\\\`\\\`\\\`

If squads exist, add:
\\\`\\\`\\\`markdown
## SQUADS

| Squad | Domain | Agents | Plan Format |
|-------|--------|--------|-------------|
| {name} | {description} | {agent_count} | {story-driven|task-driven|research} |
\\\`\\\`\\\`

If no squads found, omit this section.

### 5e. Methodology Summary

Add a concise methodology reference:
\\\`\\\`\\\`markdown
## METHODOLOGY

- **Execution model**: story-driven development with wave-based execution
- **Planning**: @plan agent generates structured plans with waves, stories, and tasks
- **Delegation**: @build delegates to Dev-Junior (atomic tasks via category) or @dev (complex work), plus specialists (@qa, @architect)
- **Quality gates**: Per-story verification before marking complete
- **Checkpoints**: @po reviews between waves (GO/PAUSE/REVIEW/ABORT)
- **Continuation**: Ralph Loop / boulder state for persistent multi-session work
\\\`\\\`\\\`

### 5f. Framework Consciousness

Add a section that explains HOW the system works — critical for new AI sessions:

\\\`\\\`\\\`markdown
## HOW KORD AIOS WORKS

### Delegation Model
- Kord (master) orchestrates all work via task()
- task(category="...") → Dev-Junior (atomic tasks with domain skills)
- task(subagent_type="dev") → Dev (complex multi-step implementation)
- task(subagent_type="agent") → Specialist agent
- Dev-Junior is the DEFAULT executor. Dev is for complex work only.

### Story-Driven Pipeline
PRD (@pm) → Epic → Stories (@sm) → Validation (@po) → Waves → Implementation (Dev agents) → Verification

### Skill System
Skills are SKILL.md files injected into agents during delegation via load_skills=[].
Built-in skills come from the plugin. Project skills live in .kord/skills/.

### Continuation
Boulder state (docs/kord/boulder.json) persists execution across sessions.
Ralph Loop enables self-referential continuation until task completion.

### Work Artifacts
| Artifact | Location |
|----------|----------|
| Plans | docs/kord/plans/*.md |
| Drafts | docs/kord/drafts/*.md |
| Notepads | docs/kord/notepads/{plan}/ |
| Boulder state | docs/kord/boulder.json |
| Skills (project) | .kord/skills/ |
| Squads | .kord/squads/, .opencode/squads/ |
| Rules | docs/kord/rules/, .claude/rules/ |
| Templates | .kord/templates/ |
\\\`\\\`\\\`

**Mark "kord-context" as completed.**

---

## Anti-Patterns

- **Static agent count**: MUST vary agents based on project size/depth
- **Sequential execution**: MUST parallel (explore + LSP concurrent)
- **Ignoring existing**: ALWAYS read existing first, even with --create-new
- **Over-documenting**: Not every dir needs AGENTS.md
- **Redundancy**: Child never repeats parent
- **Generic content**: Remove anything that applies to ALL projects
- **Verbose style**: Telegraphic or die
- **Missing Kord AIOS context**: Root AGENTS.md MUST include agent/skill/command/methodology sections`
