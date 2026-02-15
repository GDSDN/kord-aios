---
name: db-dry-run
description: "Execute migration inside BEGIN…ROLLBACK to catch syntax/ordering errors"
agent: architect
subtask: false
---

# Migration Dry-Run

Execute migration inside BEGIN…ROLLBACK to catch syntax/ordering errors

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
  - [ ] Data persisted correctly; constraints respected; no orphaned data
    type: acceptance-criterion
    blocker: true
    validation: |
      Assert data persisted correctly; constraints respected; no orphaned data
    error_message: "Acceptance criterion not met: Data persisted correctly; constraints respected; no orphaned data"
```

---

## Error Handling

*Strategy:** retry

*Common Errors:**

1. *Error:** Connection Failed
   - *Cause:** Unable to connect to Neo4j database
   - *Resolution:** Check connection string, credentials, network
   - *Recovery:** Retry with exponential backoff (max 3 attempts)

2. *Error:** Query Syntax Error
   - *Cause:** Invalid Cypher query syntax
   - *Resolution:** Validate query syntax before execution
   - *Recovery:** Return detailed syntax error, suggest fix

3. *Error:** Transaction Rollback
   - *Cause:** Query violates constraints or timeout
   - *Resolution:** Review query logic and constraints
   - *Recovery:** Automatic rollback, preserve data integrity

---

## Inputs

- `path` (string): Path to SQL migration file

---

### 1. Confirm Migration File

Ask user to confirm:
- Migration file path: `{path}`
- Purpose of this migration
- Expected changes (tables, functions, etc)

### 2. Execute Dry-Run

Run migration in transaction that will be rolled back:

```bash
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
\echo 'Starting dry-run...'
\i {path}
\echo 'Dry-run completed successfully - rolling back...'
ROLLBACK;
SQL
```

### 3. Report Results

*If successful:**
```
✓ Dry-run completed without errors
✓ Migration syntax is valid
✓ No dependency or ordering issues detected
```

*If failed:**
```
❌ Dry-run failed
Error: [error message]
Line: [line number if available]
Fix the migration and try again
```

---

## What This Validates

- ✅ SQL syntax correctness
- ✅ Object dependencies exist
- ✅ Execution order is valid
- ✅ No constraint violations
- ❌ Does NOT validate data correctness
- ❌ Does NOT check performance

---

## Next Steps After Success

1. Review migration one more time
2. Take snapshot: `snapshot pre_migration`
3. Apply migration: `apply-migration {path}`
4. Run smoke tests: `smoke-test`

---

## Error Handling

Common errors and fixes:

**"relation does not exist"**
- Missing table/view dependency
- Check if you need to create dependent objects first

**"function does not exist"**
- Function called before creation
- Reorder: tables → functions → triggers

**"syntax error"**
- Check SQL syntax
- Verify PostgreSQL version compatibility
