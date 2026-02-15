---
name: analyze-project-structure
description: "Project structure analysis — service inventory, pattern detection, language distribution, testing approach, and implementation recommendations for new features"
agent: architect
subtask: false
argument-hint: "Feature description and optional project path"
---

# Analyze Project Structure

Analyze an existing project to understand its structure, services, patterns, and provide recommendations for implementing new features. This is a read-only analysis phase that produces actionable documentation.

## Parameters

- `feature_description` (string, required): Description of the feature to be added
- `project_path` (string, optional): Project root path (default: current working directory)

## Pre-Conditions

- Project directory exists and is readable
- Project has identifiable structure (src/, lib/, or similar)

## Process

### Step 1: Gather Requirements

Collect information about the intended feature:
1. What feature/service needs to be added?
2. Does this feature require external API integration?
3. Will this feature need database changes?
4. What is the expected scope (new module, extension, refactor)?

### Step 2: Project Structure Scan

Scan the project to build a complete inventory:

**Core structure discovery:**
- Source directories and their organization
- Configuration files (tsconfig, package.json, etc.)
- Build system and scripts
- Test infrastructure

**Service/module inventory — for each discovered module:**
1. Module name (directory name)
2. Language (JS vs TS — check for .ts files)
3. Has tests (check for __tests__/ or *.test.* files)
4. Has README (check for README.md)
5. Entry point (index.ts or index.js)
6. Dependencies (imports from other modules)

### Step 3: Pattern Analysis

#### 3.1 Language Usage
- Count file extensions (.ts, .js, .jsx, .tsx)
- Determine primary language and TypeScript adoption level
- Identify any mixed-language areas

#### 3.2 Testing Approach
- Detect test framework (Jest, Vitest, Mocha, Bun test, etc.)
- Count test files and estimate coverage
- Identify testing patterns (unit, integration, e2e)

#### 3.3 Documentation Style
- Check for README files per module
- Detect JSDoc/TSDoc usage
- Identify documentation generators (TypeDoc, etc.)

#### 3.4 Configuration Patterns
- Environment variable usage (.env files, process.env references)
- Configuration file formats (YAML, JSON, JSONC, TOML)
- Secret management approach

### Step 4: Generate Recommendations

Based on gathered requirements and pattern analysis:

**Service type recommendation:**

| User Response | Detected Pattern | Recommendation |
|---------------|------------------|----------------|
| External API = Yes | Existing API services | **API Integration** |
| External API = No, DB = Yes | Data services exist | **Data Service** |
| Agent tooling mentioned | Plugin architecture | **Plugin/Extension** |
| General feature | No clear pattern | **Utility Module** (default) |

**File structure suggestion** based on existing patterns in the project.

**Agent assignment:**

| Service Type | Primary Agent | Support Agent |
|--------------|---------------|---------------|
| API Integration | @dev | @qa |
| Data Service | @data-engineer | @dev |
| Plugin/Extension | @dev | @architect |
| Utility Module | @dev | @qa |

### Step 5: Generate Output Documents

Produce two documents:

**1. Project Analysis Document** (`project-analysis.md`):
- Project structure overview table
- Existing services/modules inventory
- Language distribution statistics
- Testing framework and coverage notes
- Configuration approach summary

**2. Recommended Approach Document** (`recommended-approach.md`):
- Feature requirements summary
- Recommended service/module type with rationale
- Suggested file structure based on project patterns
- Implementation steps (scaffold, implement, test, document, integrate)
- Agent assignment for implementation
- Dependencies list
- Next steps

### Step 6: Present Results

Display summary:
- Project name and stats
- Services/modules found
- Primary language and test framework
- Recommended service type and primary agent
- Documents generated
- Suggested next steps

## Error Handling

1. **No Clear Project Structure**
   - Cause: Project doesn't follow standard conventions
   - Resolution: Fall back to file-extension-based analysis
   - Recovery: Generate analysis noting non-standard structure

2. **No Services Found**
   - Cause: New project or flat structure
   - Resolution: Proceed with minimal analysis
   - Recovery: Generate analysis noting "No existing modules"

3. **Permission Denied**
   - Cause: Cannot read certain directories
   - Resolution: Skip inaccessible areas
   - Recovery: Note in analysis, continue with accessible files

## Completion Criteria

- [ ] Feature requirements captured
- [ ] Project structure scanned completely
- [ ] All existing services/modules inventoried
- [ ] Language and testing patterns identified
- [ ] Service type recommendation provided
- [ ] File structure suggestion based on project patterns
- [ ] Agent assignment recommended
- [ ] Project analysis document generated
- [ ] Recommended approach document generated

## Notes

- This is a read-only analysis — no project files are modified
- Run this BEFORE creating new services or modules
- Recommendations are suggestions based on detected patterns, not requirements
- For large projects, analysis may take 1-2 minutes
- Always review generated documents before proceeding with implementation
