---
name: db-smoke-test
description: "Run post-migration validation checks"
agent: architect
subtask: false
---

# DB Smoke Test

Run post-migration validation checks

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

### 1. Locate Smoke Test File

Check for smoke test in this order:

1. `supabase/tests/smoke/v_current.sql` (project-specific)
2. `supabase/tests/smoke_test.sql` (project-specific)
3. `tmpl-smoke-test.sql` (template)

### 2. Run Smoke Test

```bash
SMOKE_TEST=""

if [ -f "supabase/tests/smoke/v_current.sql" ]; then
  SMOKE_TEST="supabase/tests/smoke/v_current.sql"
elif [ -f "supabase/tests/smoke_test.sql" ]; then
  SMOKE_TEST="supabase/tests/smoke_test.sql"
elif [ -f "tmpl-smoke-test.sql" ]; then
  SMOKE_TEST="tmpl-smoke-test.sql"
else
  echo "❌ No smoke test file found"
  exit 1
fi

echo "Running smoke test: $SMOKE_TEST"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$SMOKE_TEST"
```

### 3. Report Results

*If successful:**
```
✅ Smoke Test Passed

Checks completed:
  ✓ Table count validation
  ✓ Policy count validation
  ✓ Function existence checks
  ✓ Basic query sanity
```

*If failed:**
```
❌ Smoke Test Failed

Review errors above and:
  1. Check migration completeness
  2. Verify RLS policies installed
  3. Confirm functions created
  4. Consider rollback if critical
```

---

## What Is Tested

Basic smoke tests typically check:

### Schema Objects

- Expected tables exist
- Expected views exist
- Expected functions exist
- Expected triggers exist

### RLS Coverage

- RLS enabled on sensitive tables
- Policies exist and are named correctly
- Basic RLS queries don't error

### Data Integrity

- Foreign keys valid
- Check constraints valid
- Sample queries return expected results

## Creating Custom Smoke Tests

Create `supabase/tests/smoke/v_X_Y_Z.sql`:

```sql
-- Smoke Test for v1.2.0
SET client_min_messages = warning;

-- Table count
SELECT COUNT(*) AS tables FROM information_schema.tables 
WHERE table_schema='public';
-- Expected: 15

-- RLS enabled
SELECT tablename FROM pg_tables 
WHERE schemaname='public' AND rowsecurity = false;
-- Expected: empty (all tables have RLS)

-- Critical functions exist
SELECT proname FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
AND proname IN ('function1', 'function2');
-- Expected: 2 rows

-- Sample data query
SELECT COUNT(*) FROM users WHERE deleted_at IS NULL;
-- Expected: > 0

-- RLS sanity (doesn't error)
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}';
SELECT 1 FROM protected_table LIMIT 1;
```

---

## Best Practices

1. *Version-specific tests** - Name by schema version
2. *Fast execution** - Under 5 seconds
3. *No side effects** - Read-only queries
4. *Clear expectations** - Document expected results
5. *Fail fast** - Use ON_ERROR_STOP

---

## Next Steps After Pass

✓ Migration validated  
→ Update migration log  
→ Run RLS audit: `rls-audit`  
→ Check performance: `analyze-hotpaths`

## Next Steps After Fail

❌ Migration issues detected  
→ Review errors  
→ Consider rollback: `rollback {snapshot}`  
→ Fix migration  
→ Retry
