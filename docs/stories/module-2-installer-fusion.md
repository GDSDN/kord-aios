# Module 2: Installer Fusion

**Story ID:** OPEN-AIOS-004  
**Status:** In Progress  
**Wave:** 2 (Capability)  
**Started:** 2026-02-08  
**Est. Effort:** 3-5 days  
**Priority:** High (blocks Waves 3-4)

---

## 1. Objective

Create unified installer that fuses OMOC's interactive setup with AIOS project bootstrap, enabling seamless initialization of Open-AIOS projects.

**Success Criteria:**

- [ ] `open-aios init [project-name]` creates complete project structure
- [ ] OpenCode detection in existing projects with safe merge
- [ ] OMOC auth flow (providers, API keys) integrated
- [ ] Project templates for fresh and merge scenarios
- [ ] Post-init validation with pass/fail reporting
- [ ] Backward compatibility: `oh-my-opencode install` still works

---

## 2. Context

### 2.1 Current State

**OMOC Installer (existing, stable):**

- `oh-my-opencode install` - Provider auth, model fallback prompts
- Interactive CLI with prompts for:
  - API provider selection (Anthropic, OpenAI, OpenRouter)
  - API key configuration
  - Model preference selection
  - Fallback chain setup

**AIOS Bootstrap (to integrate):**

- Project structure: `.opencode/`, `.aios-core/`, `docs/stories/`
- Skill installation: 176+ skills to `.opencode/skills/`
- Rules injection: `.opencode/rules/opencode-rules.md`
- Story templates: `docs/stories/story-template.md`

### 2.2 Target State

Unified `open-aios init` command that:

1. Detects existing OpenCode projects
2. Preserves existing configuration
3. Adds AIOS layer
4. Validates post-init state
5. Reports results clearly

### 2.3 Constraints

| Constraint                | Impact                                 |
| ------------------------- | -------------------------------------- |
| OMOC auth flow immutable  | Cannot modify provider selection logic |
| Config merge must be safe | Existing projects cannot be broken     |
| Bun runtime only          | No Node.js-specific dependencies       |
| Cross-platform            | Windows, macOS, Linux support required |

---

## 3. Acceptance Criteria

| ID    | Criterion                               | Verification                                                           |
| ----- | --------------------------------------- | ---------------------------------------------------------------------- | ------------- |
| AC-1  | Fresh init creates project structure    | `test -d .opencode/ && test -d .aios-core/ && test -d docs/stories/`   |
| AC-2  | Init detects existing OpenCode projects | Merge mode triggered automatically                                     |
| AC-3  | Existing config backed up before merge  | `test -d .opencode.backup.*/`                                          |
| AC-4  | MCP config preserved during merge       | `diff .opencode.backup.*/mcp.json .opencode/mcp.json` shows no changes |
| AC-5  | OMOC auth flow integrated               | Provider selection prompts appear                                      |
| AC-6  | Skills installed to `.opencode/skills/` | `ls .opencode/skills/                                                  | wc -l >= 176` |
| AC-7  | Post-init validation passes             | `open-aios doctor` returns exit code 0                                 |
| AC-8  | Init report generated                   | `cat .open-aios/init-report.json` exists                               |
| AC-9  | Legacy command still works              | `oh-my-opencode install` executes without error                        |
| AC-10 | TypeScript compilation passes           | `bun run typecheck` exit code 0                                        |

---

## 4. Implementation Checklist

### 4.1 Subtask 2.1: CLI Entry Point Structure

**Owner:** @dev  
**Effort:** 0.5 days

- [ ] **2.1.1** Create `bin/open-aios.js` entry point
  - **AC:** File exists and is executable (`chmod +x`)
  - **AC:** Supports `open-aios [command] [options]` syntax
  - **AC:** `--version` flag works and shows version
  - **AC:** `--help` flag shows usage information
  - **Verification:** `./bin/open-aios.js --version` outputs version

- [ ] **2.1.2** Add `init` subcommand
  - **AC:** `open-aios init --help` shows init-specific help
  - **AC:** Accepts optional `[project-name]` argument
  - **AC:** Accepts `--force` flag for non-interactive mode
  - **AC:** Accepts `--template <name>` flag for templates
  - **Verification:** `open-aios init --help` shows options

- [ ] **2.1.3** Preserve `oh-my-opencode` compatibility
  - **AC:** `bin/oh-my-opencode.js` still works as entry point
  - **AC:** `oh-my-opencode install` executes install flow
  - **AC:** No breaking changes to existing commands
  - **Verification:** `oh-my-opencode --version` works

**DoD:**

- CLI entry points created
- Init subcommand functional
- Backward compatibility verified
- `bun run typecheck` passes

---

### 4.2 Subtask 2.2: Project Detection

**Owner:** @dev  
**Effort:** 0.5 days

- [ ] **2.2.1** Implement OpenCode detection logic
  - **AC:** Detect `.opencode/` directory presence
  - **AC:** Detect `opencode.json` file presence
  - **AC:** Detect `.claude/` directory (Claude Code projects)
  - **AC:** Return detection result: `fresh` | `opencode` | `claude` | `merge`
  - **Verification:** Test in clean dir, existing OpenCode dir, Claude dir

- [ ] **2.2.2** Create detection report
  - **AC:** Report includes: project type, existing configs, merge recommendation
  - **AC:** Report format: JSON for programmatic use, text for CLI
  - **AC:** Non-destructive (read-only detection)
  - **Verification:** `open-aios detect` command shows report

- [ ] **2.2.3** Interactive mode for ambiguous cases
  - **AC:** Prompt user when detection is ambiguous
  - **AC:** Options: fresh install, merge, abort
  - **AC:** Default to safe option (abort) if stdin not TTY
  - **Verification:** Test with `echo "2" | open-aios init .`

**DoD:**

- Detection logic accurate
- Report generation works
- Interactive prompts functional
- All detection scenarios tested

---

### 4.3 Subtask 2.3: Fresh Project Template

**Owner:** @dev  
**Effort:** 1 day

- [ ] **2.3.1** Create directory structure
  - **AC:** Creates `.opencode/` directory
  - **AC:** Creates `.opencode/agents/` subdirectory
  - **AC:** Creates `.opencode/skills/` subdirectory
  - **AC:** Creates `.opencode/rules/` subdirectory
  - **AC:** Creates `.aios-core/` directory
  - **AC:** Creates `.aios-core/content/` subdirectory
  - **AC:** Creates `docs/` directory
  - **AC:** Creates `docs/stories/` subdirectory
  - **Verification:** `find . -type d` shows all expected directories

- [ ] **2.3.2** Generate `opencode.json` config
  - **AC:** File created at project root
  - **AC:** Includes AIOS plugin configuration
  - **AC:** Includes default agent settings
  - **AC:** Valid JSON format
  - **Template:** See templates/opencode.json
  - **Verification:** `cat opencode.json | jq .` validates

- [ ] **2.3.3** Copy AIOS rules
  - **AC:** Copies `layer/aios/payload/rules/opencode-rules.md` to `.opencode/rules/`
  - **AC:** Copies project-specific rules template
  - **AC:** File permissions preserved (readable)
  - **Verification:** `test -f .opencode/rules/opencode-rules.md`

- [ ] **2.3.4** Copy skill templates
  - **AC:** Creates `.opencode/skills/github-pr-triage/SKILL.md`
  - **AC:** Creates `.opencode/skills/github-issue-triage/SKILL.md`
  - **AC:** Skills are valid SKILL.md format
  - **Verification:** `head -5 .opencode/skills/*/SKILL.md` shows headers

- [ ] **2.3.5** Create story template
  - **AC:** Creates `docs/stories/story-template.md`
  - **AC:** Template includes: Status, Context, AC, File List sections
  - **AC:** Follows AIOS story format
  - **Verification:** `grep "## Status" docs/stories/story-template.md`

- [ ] **2.3.6** Create README
  - **AC:** Creates `README.md` at project root
  - **AC:** Includes Open-AIOS badge and description
  - **AC:** Links to documentation
  - **Verification:** `test -f README.md`

**DoD:**

- All directories created
- All template files copied
- Config valid JSON
- Structure matches specification

---

### 4.4 Subtask 2.4: OMOC Auth Integration

**Owner:** @dev  
**Effort:** 0.5 days

- [ ] **2.4.1** Integrate provider selection
  - **AC:** Reuses existing OMOC auth prompts
  - **AC:** Supports: anthropic, openai, openrouter
  - **AC:** API key input with masking
  - **AC:** Validation of API key format
  - **Verification:** Interactive test with each provider

- [ ] **2.4.2** Integrate model selection
  - **AC:** Shows available models for selected provider
  - **AC:** Allows model preference selection
  - **AC:** Sets fallback chain automatically
  - **Verification:** Selected model appears in opencode.json

- [ ] **2.4.3** Store auth config
  - **AC:** API keys stored securely (not in repo)
  - **AC:** Config saved to appropriate location
  - **AC:** Existing auth config respected if present
  - **Security:** Keys not logged or displayed
  - **Verification:** `cat ~/.config/open-aios/config.json` shows keys (masked test)

- [ ] **2.4.4** Support non-interactive auth
  - **AC:** `--provider <name>` flag
  - **AC:** `--api-key <key>` flag
  - **AC:** `--model <name>` flag
  - **AC:** Flags bypass interactive prompts
  - **Verification:** `open-aios init . --provider anthropic --api-key sk-xxx`

**DoD:**

- Auth flow works end-to-end
- All providers supported
- Non-interactive mode functional
- Security best practices followed

---

### 4.5 Subtask 2.5: Merge Mode (Existing Projects)

**Owner:** @dev  
**Effort:** 1 day

- [ ] **2.5.1** Implement backup strategy
  - **AC:** Creates `.opencode.backup.{timestamp}/` directory
  - **AC:** Copies entire `.opencode/` to backup
  - **AC:** Copies `opencode.json` to backup
  - **AC:** Backup path logged to user
  - **AC:** Backup excludes node_modules, .git
  - **Verification:** `ls -la .opencode.backup.*/`

- [ ] **2.5.2** Preserve MCP configuration
  - **AC:** Reads existing MCP servers from opencode.json
  - **AC:** Preserves server definitions exactly
  - **AC:** No MCP settings lost during merge
  - **Verification:** `diff <(jq '.mcp' .opencode.backup.*/opencode.json) <(jq '.mcp' opencode.json)`

- [ ] **2.5.3** Preserve agent overrides
  - **AC:** Reads existing agent configurations
  - **AC:** Merges with AIOS defaults (user settings win)
  - **AC:** No agent settings lost
  - **Verification:** Agent configs from backup present in merged config

- [ ] **2.5.4** Add AIOS layer
  - **AC:** Copies AIOS skills to `.opencode/skills/`
  - **AC:** Copies AIOS rules to `.opencode/rules/`
  - **AC:** Updates opencode.json with AIOS plugin config
  - **AC:** Does not overwrite user skills/rules
  - **Verification:** AIOS skills present alongside existing skills

- [ ] **2.5.5** Handle conflicts
  - **AC:** Detects name collisions (user skill vs AIOS skill)
  - **AC:** Prompts for resolution: keep, replace, merge
  - **AC:** Default: keep user version
  - **AC:** Logs all conflicts and resolutions
  - **Verification:** Create conflict scenario and test resolution

- [ ] **2.5.6** Generate merge report
  - **AC:** Report saved to `.open-aios/merge-report.json`
  - **AC:** Includes: backup location, files added, conflicts resolved
  - **AC:** Human-readable summary printed to console
  - **Verification:** `cat .open-aios/merge-report.json | jq .`

**DoD:**

- Backup created successfully
- All config preserved
- AIOS layer added
- Conflicts handled gracefully
- Merge report generated

---

### 4.6 Subtask 2.6: Skill Installation

**Owner:** @dev  
**Effort:** 0.5 days

- [ ] **2.6.1** Create `open-aios install-skills` command
  - **AC:** Subcommand registered
  - **AC:** Discovers skills from `layer/aios/payload/skills/`
  - **AC:** Copies to `.opencode/skills/`
  - **AC:** Progress indicator for 176+ skills
  - **Verification:** `open-aios install-skills --help`

- [ ] **2.6.2** Implement skill discovery
  - **AC:** Scans `layer/aios/payload/skills/*/` for SKILL.md
  - **AC:** Validates SKILL.md format
  - **AC:** Extracts skill metadata (name, agent, purpose)
  - **Verification:** `open-aios skill list` shows all 176+ skills

- [ ] **2.6.3** Handle skill updates
  - **AC:** Detects version changes (checksum comparison)
  - **AC:** Preserves user modifications (3-way merge)
  - **AC:** `--force` flag overwrites without prompt
  - **Verification:** Modify a skill, run install-skills, verify merge

- [ ] **2.6.4** Skill validation
  - **AC:** Validates SKILL.md has required sections
  - **AC:** Checks agent assignment is valid
  - **AC:** Reports invalid skills with reasons
  - **Verification:** Create invalid skill, run validation, see error

**DoD:**

- install-skills command works
- All 176+ skills installable
- Update mechanism functional
- Validation catches errors

---

### 4.7 Subtask 2.7: Post-Init Validation

**Owner:** @qa  
**Effort:** 0.5 days

- [ ] **2.7.1** Create `open-aios doctor` command
  - **AC:** Command available
  - **AC:** Checks: directory structure, config validity, skill loading
  - **AC:** Returns exit code 0 on pass, non-zero on fail
  - **Verification:** `open-aios doctor --help`

- [ ] **2.7.2** Implement structure validation
  - **AC:** Verifies `.opencode/` exists
  - **AC:** Verifies required subdirectories exist
  - **AC:** Verifies `opencode.json` is valid JSON
  - **AC:** Verifies `.aios-core/` exists
  - **Verification:** `open-aios doctor` on valid project

- [ ] **2.7.3** Implement skill validation
  - **AC:** Verifies skills load without errors
  - **AC:** Counts available skills (should be 176+)
  - **AC:** Reports any broken skill files
  - **Verification:** `open-aios doctor | grep "skills:"`

- [ ] **2.7.4** Implement agent validation
  - **AC:** Verifies agent manifests exist
  - **AC:** Verifies agent configurations valid
  - **AC:** Counts available agents (should be 15+)
  - **Verification:** `open-aios doctor | grep "agents:"`

- [ ] **2.7.5** Generate validation report
  - **AC:** Report saved to `.open-aios/doctor-report.json`
  - **AC:** Includes: checks performed, results, recommendations
  - **AC:** Human-readable summary printed
  - **Verification:** `cat .open-aios/doctor-report.json | jq .`

**DoD:**

- doctor command functional
- All validation checks pass
- Report generated
- Exit codes correct

---

### 4.8 Subtask 2.8: QA Validation Gate

**Owner:** @qa  
**Effort:** 0.5 days

- [ ] **2.8.1** Create init test suite
  - **AC:** Test: Fresh init creates correct structure
  - **AC:** Test: Merge mode preserves existing config
  - **AC:** Test: Backup created on merge
  - **AC:** Test: Doctor validation passes
  - **File:** `tests/e2e/init-flow.test.ts`
  - **Verification:** `bun test tests/e2e/init-flow.test.ts`

- [ ] **2.8.2** Test cross-platform
  - **AC:** Test on Windows (PowerShell, CMD)
  - **AC:** Test on macOS
  - **AC:** Test on Linux
  - **AC:** All paths use correct separators
  - **Verification:** CI/CD runs on all platforms

- [ ] **2.8.3** Test edge cases
  - **AC:** Init in directory with spaces in name
  - **AC:** Init with non-existent parent directory
  - **AC:** Init with read-only filesystem (graceful failure)
  - **AC:** Init with existing git repo
  - **Verification:** Edge case tests pass

- [ ] **2.8.4** Documentation review
  - **AC:** Init command documented
  - **AC:** Merge behavior documented
  - **AC:** Troubleshooting guide included
  - **Verification:** Docs reviewed and approved

**DoD:**

- All tests pass
- Cross-platform verified
- Edge cases handled
- Documentation complete
- QA sign-off obtained

---

## 5. File List

### New Files to Create

| File                          | Purpose                     | Subtask |
| ----------------------------- | --------------------------- | ------- |
| `bin/open-aios.js`            | New CLI entry               | 2.1.1   |
| `src/cli/init.ts`             | Init command implementation | 2.1.2   |
| `src/cli/detect.ts`           | Project detection logic     | 2.2.1   |
| `src/cli/backup.ts`           | Backup utilities            | 2.5.1   |
| `src/cli/merge.ts`            | Merge logic                 | 2.5.x   |
| `src/cli/doctor.ts`           | Validation command          | 2.7.1   |
| `src/cli/install-skills.ts`   | Skill installation          | 2.6.1   |
| `templates/opencode.json`     | Default config template     | 2.3.2   |
| `templates/story-template.md` | Story file template         | 2.3.5   |
| `templates/README.md`         | Project README template     | 2.3.6   |
| `tests/e2e/init-flow.test.ts` | E2E tests                   | 2.8.1   |

### Modified Files

| File               | Changes               | Subtask |
| ------------------ | --------------------- | ------- |
| `package.json`     | Add bin entries       | 2.1.1   |
| `src/cli/index.ts` | Export new commands   | 2.1.x   |
| `src/index.ts`     | Register CLI commands | 2.1.x   |

### Unchanged (Preserved)

| File                    | Reason                     |
| ----------------------- | -------------------------- |
| `bin/oh-my-opencode.js` | Backward compatibility     |
| `src/cli/install.ts`    | OMOC auth flow (preserved) |

---

## 6. Verification Commands

### Development

```bash
# Type check
bun run typecheck

# Run tests
bun test src/cli/
bun test tests/e2e/init-flow.test.ts

# Build
bun run build
```

### Fresh Init

```bash
# Create temp directory
mkdir -p /tmp/test-init && cd /tmp/test-init

# Run init
open-aios init test-project

# Verify structure
cd test-project
tree -a -L 2

# Verify config
jq . opencode.json

# Run doctor
open-aios doctor

# Check skills
ls .opencode/skills/ | wc -l  # Should be 176+
```

### Merge Init

```bash
# Go to existing project
cd /path/to/existing-opencode-project

# Run init (should detect existing)
open-aios init .

# Verify backup
ls -la .opencode.backup.*/

# Verify merge
ls -la .opencode/skills/ | head -20

# Check report
cat .open-aios/merge-report.json | jq .

# Run doctor
open-aios doctor
```

### Skill Installation

```bash
# Install skills
open-aios install-skills

# List skills
open-aios skill list

# Verify count
open-aios skill list | wc -l  # Should be 176+
```

---

## 7. Definition of Done (DoD)

### Required

- [ ] All subtasks 2.1-2.8 complete with ACs verified
- [ ] TypeScript compilation passes (`bun run typecheck`)
- [ ] All unit tests pass (`bun test src/cli/`)
- [ ] All E2E tests pass (`bun test tests/e2e/init-flow.test.ts`)
- [ ] Fresh init creates valid projects
- [ ] Merge mode preserves existing config
- [ ] Backups created on merge
- [ ] Doctor validation passes
- [ ] 176+ skills installable
- [ ] Legacy `oh-my-opencode install` still works
- [ ] Cross-platform tested
- [ ] Documentation complete
- [ ] QA sign-off obtained

### Verification

```bash
# Final verification script
bun run typecheck
bun test
bun run build

# Test fresh init
rm -rf /tmp/final-test
open-aios init /tmp/final-test/my-project
open-aios doctor /tmp/final-test/my-project

# Test merge
cp -r /tmp/final-test/my-project /tmp/final-test/merge-test
open-aios init /tmp/final-test/merge-test
ls /tmp/final-test/merge-test/.opencode.backup.*

echo "All verification passed!"
```

---

## 8. Rollback Procedure

If critical issues found:

### Immediate Rollback

```bash
# Restore from backup (merge mode)
cd project-with-issues
rm -rf .opencode/
cp -r .opencode.backup.{timestamp}/* .
rm -rf .opencode.backup.{timestamp}/

# Or full reset (fresh init)
cd problematic-project
rm -rf .opencode/ .aios-core/ docs/stories/ opencode.json
```

### Restore Code

```bash
git checkout -- src/cli/
git checkout -- bin/open-aios.js
git checkout -- package.json
```

### Preserve Changes

- Save this story file
- Document issues in story comments
- Re-plan with fixes

---

## 9. Dependencies

### Hard Dependencies

| Dependency          | Module | Status         |
| ------------------- | ------ | -------------- |
| Module 0 (Baseline) | Wave 0 | ✅ Complete    |
| Module 1 (Agents)   | Wave 1 | 🔄 In Progress |
| Module 2 (Hooks)    | Wave 1 | 🔄 In Progress |

### Soft Dependencies

| Dependency         | Impact if Missing          |
| ------------------ | -------------------------- |
| Module 3 (Skills)  | install-skills less useful |
| Module 5 (Overlay) | Aliases not yet enforced   |

---

## 10. Notes & References

### Architecture

- [ADR-0001: Agent Topology](../architecture/adr-0001-agent-topology.md)
- [Open-AIOS Architecture](../architecture/open-aios-architecture.md)
- [Runtime Separation](./runtime-separation.md)

### OMOC Reference

- `src/cli/install.ts` - Existing auth flow
- `src/config.ts` - Configuration schema

### AIOS Reference

- `layer/aios/payload/skills/` - Skill source
- `layer/aios/payload/rules/` - Rules source

### Related Stories

- [Module 1: Agent Fusion](./module-1-agent-fusion.md)
- Module 3: Skill Discovery (TBD)

---

_Last Updated: 2026-02-08_  
_Author: @architect (Oracle)_  
_Reviewers: @qa, @dev_
