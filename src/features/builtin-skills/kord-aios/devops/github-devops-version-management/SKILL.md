---
name: github-devops-version-management
description: "Analyze changes, recommend version bumps, and manage semantic versioning for ANY repository using Kord AIOS."
agent: devops
subtask: false
---

# version-management.md

Analyze changes, recommend version bumps, and manage semantic versioning for ANY repository using Kord AIOS.

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)

- Autonomous decision making with logging
- Minimal user interaction
- *Best for:** Simple, deterministic tasks

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**

- Explicit decision checkpoints
- Educational explanations
- *Best for:** Learning, complex decisions

### 3. Pre-Flight Planning - Comprehensive Upfront Planning

- Task analysis phase (identify all ambiguities)
- Zero ambiguity execution
- *Best for:** Ambiguous requirements, critical work

*Parameter:** `mode` (optional, default: `interactive`)

---

## Acceptance Criteria

*Purpose:** Definitive pass/fail criteria for task completion

*Checklist:**

```yaml
acceptance-criteria:
  - [ ] Task completed as expected; side effects documented
    type: acceptance-criterion
    blocker: true
    validation: |
      Assert task completed as expected; side effects documented
    error_message: "Acceptance criterion not met: Task completed as expected; side effects documented"
```

---

## Error Handling

*Strategy:** retry

*Common Errors:**

1. *Error:** Task Not Found
   - *Cause:** Specified task not registered in system
   - *Resolution:** Verify task name and registration
   - *Recovery:** List available tasks, suggest similar

2. *Error:** Invalid Parameters
   - *Cause:** Task parameters do not match expected schema
   - *Resolution:** Validate parameters against task definition
   - *Recovery:** Provide parameter template, reject execution

3. *Error:** Execution Timeout
   - *Cause:** Task exceeds maximum execution time
   - *Resolution:** Optimize task or increase timeout
   - *Recovery:** Kill task, cleanup resources, log state

---

## Prerequisites

- Git repository with commit history
- package.json with current version
- Understanding of semantic versioning (MAJOR.MINOR.PATCH)

## Semantic Versioning Rules

- *MAJOR** (v4.0.0 → v5.0.0): Breaking changes, API redesign
- *MINOR** (v4.31.0 → v4.32.0): New features, backward compatible
- *PATCH** (v4.31.0 → v4.31.1): Bug fixes only

## Keywords for Detection

*Breaking Changes** (MAJOR):
- `BREAKING CHANGE:`
- `BREAKING:`
- `!` in commit type (e.g., `feat!:`)
- API redesign
- Removed functionality
- Incompatible changes

*New Features** (MINOR):
- `feat:`
- `feature:`
- New capability
- Enhancement

*Bug Fixes** (PATCH):
- `fix:`
- `bugfix:`
- `hotfix:`
- Patch

### Step 1: Detect Repository Context

```javascript
const { detectRepositoryContext } = require('./../scripts/repository-detector');
const context = detectRepositoryContext();

if (!context) {
  throw new Error('Unable to detect repository context. Run "kord-aios init" first.');
}

console.log(`📦 Analyzing version for: ${context.packageName}`);
console.log(`Current version: ${context.packageVersion}`);
```

### Step 2: Get Last Git Tag

```bash
git describe --tags --abbrev=0
```

If no tags exist, use `v0.0.0` as baseline.

### Step 3: Analyze Commits Since Last Tag

```bash
git log <last-tag>..HEAD --oneline
```

Parse each commit message:
- Count breaking changes
- Count features
- Count fixes

### Step 4: Recommend Version Bump

*Logic**:
1. If `breakingChanges > 0` → MAJOR bump
2. Else if `features > 0` → MINOR bump
3. Else if `fixes > 0` → PATCH bump
4. Else → No version bump needed

### Step 5: User Confirmation

Present recommendation:

```
📊 Version Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current version:  v4.31.0
Recommended:      v4.32.0 (MINOR)

Changes since v4.31.0:
  Breaking changes: 0
  New features:     3
  Bug fixes:        2

Reason: New features detected (backward compatible)

Proceed with version v4.32.0? (Y/n)
```

### Step 6: Update package.json

```javascript
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(context.projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.version = newVersion;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`✓ Updated package.json to ${newVersion}`);
```

### Step 7: Create Git Tag

```bash
git tag -a v<newVersion> -m "Release v<newVersion>"
```

### Step 8: Generate Changelog

Extract commits since last tag and format:

```markdown

### Added

- New feature A
- New feature B
- New feature C

### Fixed

- Bug fix 1
- Bug fix 2
```

## Example Implementation

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const semver = require('semver');

async function manageVersion() {
  // Step 1: Detect context
  const { detectRepositoryContext } = require('./../scripts/repository-detector');
  const context = detectRepositoryContext();

  if (!context) {
    console.error('❌ Unable to detect repository context');
    process.exit(1);
  }

  console.log(`\n📦 Version Management for ${context.packageName}`);
  console.log(`Current version: ${context.packageVersion}\n`);

  // Step 2: Get last tag
  let lastTag;
  try {
    lastTag = execSync('git describe --tags --abbrev=0', {
      cwd: context.projectRoot
    }).toString().trim();
  } catch (error) {
    lastTag = 'v0.0.0';
    console.log('⚠️  No tags found, using v0.0.0 as baseline');
  }

  console.log(`Last tag: ${lastTag}\n`);

  // Step 3: Analyze commits
  const commits = execSync(`git log ${lastTag}..HEAD --oneline`, {
    cwd: context.projectRoot
  }).toString().trim().split('\n').filter(Boolean);

  let breakingChanges = 0;
  let features = 0;
  let fixes = 0;

  const breakingPattern = /BREAKING CHANGE:|BREAKING:|^\w+!:/;
  const featurePattern = /^feat:|^feature:/;
  const fixPattern = /^fix:|^bugfix:|^hotfix:/;

  commits.forEach(commit => {
    if (breakingPattern.test(commit)) breakingChanges++;
    else if (featurePattern.test(commit)) features++;
    else if (fixPattern.test(commit)) fixes++;
  });

  // Step 4: Recommend version
  const currentVersion = context.packageVersion.replace(/^v/, '');
  let newVersion;
  let bumpType;

  if (breakingChanges > 0) {
    newVersion = semver.inc(currentVersion, 'major');
    bumpType = 'MAJOR';
  } else if (features > 0) {
    newVersion = semver.inc(currentVersion, 'minor');
    bumpType = 'MINOR';
  } else if (fixes > 0) {
    newVersion = semver.inc(currentVersion, 'patch');
    bumpType = 'PATCH';
  } else {
    console.log('ℹ️  No version bump needed (no changes detected)');
    process.exit(0);
  }

  // Step 5: User confirmation
  console.log('📊 Version Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Current version:  v${currentVersion}`);
  console.log(`Recommended:      v${newVersion} (${bumpType})`);
  console.log('');
  console.log(`Changes since ${lastTag}:`);
  console.log(`  Breaking changes: ${breakingChanges}`);
  console.log(`  New features:     ${features}`);
  console.log(`  Bug fixes:        ${fixes}`);
  console.log('');

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Proceed with version v${newVersion}?`,
      default: true
    }
  ]);

  if (!confirm) {
    console.log('❌ Version update cancelled');
    process.exit(0);
  }

  // Step 6: Update package.json
  const packageJsonPath = path.join(context.projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`\n✓ Updated package.json to v${newVersion}`);

  // Step 7: Create git tag
  execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, {
    cwd: context.projectRoot
  });
  console.log(`✓ Created git tag v${newVersion}`);

  console.log('\n✅ Version management complete!');
  console.log(`\nNext steps:`);
  console.log(`  - Review changes: git show v${newVersion}`);
  console.log(`  - Push tag: git push origin v${newVersion}`);
  console.log(`  - Create release with @github-devops release`);
}

module.exports = { manageVersion };
```

## Usage

Called by `@github-devops` agent via `version-check` command.

## Validation

- Version bump follows semantic versioning rules
- User confirms version change
- Git tag created successfully
- package.json updated correctly

## Notes

- Works with ANY repository (framework or project)
- Respects conventional commits format
- User always has final approval
- Does NOT push to remote (that's done by push command)
