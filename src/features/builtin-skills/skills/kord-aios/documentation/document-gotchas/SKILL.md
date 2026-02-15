---
name: document-gotchas
description: "Document Gotchas Task methodology and workflow"
agent: dev
subtask: false
---

# Document Gotchas Task

## Purpose

Extract and consolidate gotchas from session insights into a searchable knowledge base. Triggered automatically after session-insights capture or manually via `list-gotchas`.

---

## Acceptance Criteria

*Purpose:** Definitive pass/fail criteria for task completion

*Checklist:**

```yaml
acceptance-criteria:
  - [ ] Gotchas extracted from session insights (AC1)
    type: acceptance-criterion
    blocker: true
    validation: |
      At least one insights file scanned

  - [ ] gotchas.md generated with proper format (AC2, AC3)
    type: acceptance-criterion
    blocker: true
    validation: |
      File contains Wrong/Right/Reason format

  - [ ] Gotchas categorized by area (AC4)
    type: acceptance-criterion
    blocker: true
    validation: |
      Categories present in output
```

---

### Command: `*list-gotchas` (AC7)

*Alias for**: `document-gotchas list`

*Quick reference for all gotchas with optional filtering.**

### Command: `*document-gotchas [command] [options]`

*Available Commands:**

1. *update** (default)
   - Scans all session insights files
   - Extracts gotchas from `gotchasFound`, `discoveries`, `patternsLearned`
   - Deduplicates based on content similarity
   - Categorizes by area
   - Merges with existing gotchas
   - Generates `.kord-aios/gotchas.md` and `.kord-aios/gotchas.json`

2. *list**
   - Lists all gotchas
   - Options: `--severity high|medium|low`, `--format md|json`

3. *search \<query\>**
   - Searches gotchas by keyword
   - Searches in title, wrong, right, reason fields

4. *category \<name\>**
   - Lists gotchas by category
   - Categories: State Management, API, Database, Frontend/React, Testing, Build/Deploy, TypeScript, Authentication, Performance, Security, Other

---

### 1. Initialize

```javascript
const { GotchasDocumenter } = require('gotchas-documenter');

const documenter = new GotchasDocumenter(rootPath, {
  outputPath: '.kord-aios/gotchas.md',
  quiet: false
});
```

### 2. Load Existing (if update)

```javascript
// Merge with existing gotchas to preserve manually added ones
documenter.mergeWithExisting('.kord-aios/gotchas.json');
```

### 3. Scan Insights Files

```javascript
// Scans:
// - docs/stories/**/insights/*.json
// - docs/stories/**/session-*.json
// - .kord-aios/insights/*.json
await documenter.scanInsightsFiles();
```

### 4. Process and Deduplicate

```javascript
// Remove duplicates based on content similarity
documenter.deduplicateGotchas();

// Categorize by area
documenter.categorizeGotchas();
```

### 5. Generate Output

```javascript
// Save markdown and JSON
const outputPath = documenter.saveGotchas();

// Display statistics
const stats = documenter.stats;
console.log(`Total: ${documenter.gotchas.size} gotchas`);
console.log(`Categories: ${stats.categoriesFound}`);
console.log(`Duplicates merged: ${stats.gotchasDeduplicated}`);
```

---

### 1. Session Insights Capture (Story 7.1)

*Trigger:** After `capture-insights` completes

```javascript
// In capture-session-insights workflow
afterCapture: async (insightsPath) => {
  const { updateGotchas } = require('gotchas-documenter');
  await updateGotchas(rootPath);
}
```

### 2. Self-Critique Integration (Epic 4 - AC5)

*Usage:** Self-Critique checklist references gotchas

```javascript
// In self-critique-checklist.md execution
const { getGotchasForSelfCritique } = require('gotchas-documenter');

// Get relevant gotchas for current context
const relevantGotchas = getGotchasForSelfCritique(rootPath, 'TypeScript');

// Include in self-critique prompt
const prompt = `
Before completing, verify against known gotchas:
${relevantGotchas.map(g => `- ${g.title}: ${g.reason}`).join('\n')}
`;
```

### 3. Spec Writer Integration (Epic 3)

*Usage:** Include relevant gotchas in implementation specs

```javascript
// When writing implementation spec
const gotchas = getGotchasForSelfCritique(rootPath, 'API');
// Add "Known Gotchas" section to spec
```

---

## Session Insights Schema

*Expected format for extraction:**

```json
{
  "storyId": "STORY-42",
  "capturedAt": "2026-01-28T14:00:00Z",

  "gotchasFound": [
    {
      "wrong": "Using persist() directly in create()",
      "right": "Wrap entire store in persist()",
      "reason": "TypeScript inference breaks otherwise",
      "severity": "medium",
      "relatedFiles": ["src/stores/authStore.ts"]
    }
  ],

  "discoveries": [
    {
      "category": "api",
      "description": "fetch() doesn't throw on HTTP errors",
      "relevance": "high"
    }
  ],

  "patternsLearned": [
    {
      "name": "Error Boundary Pattern",
      "antiPattern": "No error boundary in React tree",
      "pattern": "Wrap components in ErrorBoundary",
      "description": "Prevents white screen of death"
    }
  ]
}
```

---

### gotchas.md Structure (AC2, AC3)

```markdown
# Known Gotchas

> Auto-generated from session insights
> Last updated: 2026-01-28T14:00:00Z
> Total gotchas: 15

## Table of Contents

- [State Management](#state-management) (3)
- [API](#api) (2)
...

---

### Zustand Persist Type Inference

**[HIGH]**

*Wrong:**
```typescript
const useStore = create(
  persist((set) => ({ ... }), { name: 'store' })
);
```

*Right:**
```typescript
const useStore = create<StoreType>()(
  persist((set) => ({ ... }), { name: 'store' })
);
```

*Reason:** Without explicit type parameter and extra parentheses, TypeScript cannot infer the store type correctly.

*Severity:** High

*Discovered:** STORY-42 (2026-01-28)

---
```

### gotchas.json Schema (AC6)

```json
{
  "schema": "kord-aios-gotchas-v1",
  "version": "1.0.0",
  "generatedAt": "2026-01-28T14:00:00Z",
  "statistics": {
    "total": 15,
    "bySeverity": { "high": 5, "medium": 8, "low": 2 },
    "byCategory": { "State Management": 3, "API": 2 },
    "insightsScanned": 10
  },
  "gotchas": [...],
  "categories": {...}
}
```

---

## CLI Examples

```bash
# Update gotchas from all insights
node gotchas-documenter.js update

# List all gotchas
node gotchas-documenter.js list

# List high severity only
node gotchas-documenter.js list --severity high

# Search for specific gotchas
node gotchas-documenter.js search "zustand"

# List by category
node gotchas-documenter.js category TypeScript

# Output as JSON
node gotchas-documenter.js list --format json
```

---

## Error Handling

*Strategy:** graceful-degradation

*Common Errors:**

1. *Error:** No insights files found
   - *Cause:** No session insights captured yet
   - *Resolution:** Run `capture-insights` first
   - *Recovery:** Create empty gotchas.md with instructions

2. *Error:** Invalid insights JSON
   - *Cause:** Malformed JSON in insights file
   - *Resolution:** Skip file, log warning
   - *Recovery:** Continue processing other files

3. *Error:** Write permission denied
   - *Cause:** Cannot write to .kord-aios directory
   - *Resolution:** Check file permissions
   - *Recovery:** Output to stdout instead

---

## Dependencies

- `capture-session-insights.md` - Provides input insights
- `self-critique-checklist.md` - Consumes gotchas (AC5)
- `spec-write-spec.md` - May reference gotchas

---
