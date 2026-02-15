---
name: setup-project-docs
description: "Setup Project Documentation methodology and workflow"
agent: dev
subtask: false
---

# Setup Project Documentation

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)

- Autonomous decision making with logging
- Minimal user interaction
- *Best for:** Greenfield projects, quick setup

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**

- Explicit decision checkpoints
- Educational explanations
- *Best for:** Brownfield projects, complex configurations

### 3. Pre-Flight Planning - Comprehensive Upfront Planning

- Task analysis phase (identify all ambiguities)
- Zero ambiguity execution
- *Best for:** Critical projects, enterprise setups

*Parameter:** `mode` (optional, default: `interactive`)

---

## Acceptance Criteria

*Purpose:** Definitive pass/fail criteria for task completion

*Checklist:**

```yaml
acceptance-criteria:
  - [ ] All documentation files generated from templates
    type: acceptance-criterion
    blocker: true
    validation: |
      Assert docs contain project-specific content, not placeholders
    error_message: "Acceptance criterion not met: Docs contain unresolved placeholders"

  - [ ] .gitignore properly configured for project
    type: acceptance-criterion
    blocker: true
    validation: |
      Assert .gitignore includes Kord AIOS ignores and tech stack ignores
    error_message: "Acceptance criterion not met: .gitignore incomplete"

  - [ ] Configuration-Driven Architecture pattern applied
    type: acceptance-criterion
    blocker: true
    validation: |
      Assert core-config.yaml contains project-specific values
    error_message: "Acceptance criterion not met: core-config.yaml not configuration-driven"
```

---

## Error Handling

*Strategy:** fallback-defaults

*Common Errors:**

1. *Error:** Mode Detection Failed
   - *Cause:** Unable to determine project type from markers
   - *Resolution:** Use default mode (greenfield) or prompt user
   - *Recovery:** Provide mode selection options

2. *Error:** Template Not Found
   - *Cause:** Template file missing from templates directory
   - *Resolution:** Check template paths in templates/project-docs/
   - *Recovery:** Use inline fallback templates

3. *Error:** Config Write Failed
   - *Cause:** Permission denied or disk full
   - *Resolution:** Check directory permissions
   - *Recovery:** Output config to console for manual creation

---

## Purpose

Generate project-specific documentation and configuration using the Documentation Integrity System. This task creates the foundational docs that enable AI agents to understand project structure, coding standards, and deployment configuration.

### 1. Detect Installation Mode

First, determine the installation mode based on project markers:

```javascript
const { detectInstallationMode, collectMarkers } = require('./documentation-integrity');

const targetDir = process.cwd(); // or specified directory
const detected = detectInstallationMode(targetDir);
const markers = collectMarkers(targetDir);

console.log(`Detected Mode: ${detected.mode}`);
console.log(`Confidence: ${detected.confidence}`);
console.log(`Reason: ${detected.reason}`);
```

*Mode Descriptions:**

| Mode | Description | Actions |
|------|-------------|---------|
| `framework-dev` | Contributing to kord-aios-core itself | Skip project setup, use existing config |
| `greenfield` | New empty project | Full scaffolding, deployment config wizard |
| `brownfield` | Existing project | Analyze and adapt, merge configurations |

### 2. Elicit Deployment Configuration (Greenfield/Brownfield)

For greenfield and brownfield projects, gather deployment preferences:

*Key Questions:**

1. *Deployment Workflow:**
   - `staging-first`: All changes go to staging before production
   - `direct-to-main`: Feature branches merge directly to main

2. *Deployment Platform:**
   - `Vercel`: Vercel deployment
   - `AWS`: AWS (S3/CloudFront, ECS, Lambda)
   - `Railway`: Railway.app
   - `Docker`: Docker-based deployment
   - `None`: No deployment platform configured

3. *Branch Configuration:**
   - Staging branch name (default: `staging`)
   - Production branch name (default: `main`)

4. *Quality Gates:**
   - Enable lint check? (default: yes)
   - Enable typecheck? (default: yes for TypeScript projects)
   - Enable tests? (default: yes)
   - Enable security scan? (default: no)

### 3. Generate Documentation

Using the gathered context, generate project documentation:

```javascript
const { buildDocContext, generateDocs } = require('./documentation-integrity');

const context = buildDocContext(projectName, mode, markers, {
  // Custom overrides if needed
});

const result = generateDocs(targetDir, context, {
  dryRun: false,  // Set true to preview
});

console.log(`Generated ${result.filesCreated.length} documentation files`);
```

*Files Generated:**

| File | Purpose |
|------|---------|
| `docs/architecture/source-tree.md` | Project structure documentation |
| `docs/architecture/coding-standards.md` | Coding conventions and patterns |
| `docs/architecture/tech-stack.md` | Technology stack reference |

### 4. Generate Core Configuration

Create the core-config.yaml with deployment settings:

```javascript
const { buildConfigContext, generateConfig, DeploymentWorkflow, DeploymentPlatform } = require('./documentation-integrity');

const configContext = buildConfigContext(projectName, mode, {
  workflow: DeploymentWorkflow.STAGING_FIRST,
  platform: DeploymentPlatform.VERCEL,
  stagingBranch: 'staging',
  productionBranch: 'main',
  qualityGates: {
    lint: true,
    typecheck: true,
    tests: true,
    security: false,
  },
});

const configResult = generateConfig(targetDir, mode, configContext);
```

### 5. Generate/Merge .gitignore

Handle .gitignore based on project state:

```javascript
const { generateGitignoreFile, hasAiosIntegration } = require('./documentation-integrity');

const gitignoreResult = generateGitignoreFile(targetDir, markers, {
  projectName,
  merge: mode === 'brownfield',  // Merge with existing for brownfield
});

console.log(`Gitignore ${gitignoreResult.mode}: ${gitignoreResult.path}`);
```

### 6. Verify Configuration-Driven Architecture

Confirm the deployment config can be loaded by other tasks:

```javascript
const { loadDeploymentConfig, validateDeploymentConfig } = require('./documentation-integrity');

const deployConfig = loadDeploymentConfig(targetDir);
const validation = validateDeploymentConfig(deployConfig);

if (validation.isValid) {
  console.log('Configuration-Driven Architecture ready');
  console.log(`Workflow: ${deployConfig.workflow}`);
  console.log(`Platform: ${deployConfig.platform}`);
} else {
  console.error('Configuration validation failed:', validation.errors);
}
```

## Success Criteria

- [ ] Installation mode correctly detected
- [ ] Project documentation generated in `docs/architecture/`
- [ ] `core-config.yaml` created with deployment section
- [ ] `.gitignore` properly configured (created or merged)
- [ ] Configuration passes validation
- [ ] No unresolved template placeholders in generated files

## Output

After successful execution:

```text
Project Documentation Setup Complete
=====================================
Mode: greenfield
Project: my-awesome-app

Generated Files:
  ✓ docs/architecture/source-tree.md
  ✓ docs/architecture/coding-standards.md
  ✓ docs/architecture/tech-stack.md
  ✓ core-config.yaml
  ✓ .gitignore (created)

Deployment Configuration:
  Workflow: staging-first
  Platform: vercel
  Quality Gates: lint, typecheck, tests
```

## Notes

- This task implements the Configuration-Driven Architecture pattern
- Tasks read project-specific values from `core-config.yaml`
- For brownfield projects, existing configurations are preserved
- Use `analyze-brownfield` task first for complex existing projects
