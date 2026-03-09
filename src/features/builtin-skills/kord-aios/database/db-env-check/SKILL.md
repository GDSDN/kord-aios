---
name: db-env-check
description: "Validate environment for DB operations without leaking secrets"
agent: architect
subtask: false
---

# DB Env Check

Validate environment for DB operations without leaking secrets

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

### 1. Validate Required Environment Variables

```bash
test -n "$SUPABASE_DB_URL" || { echo "❌ Missing SUPABASE_DB_URL"; exit 1; }
echo "✓ SUPABASE_DB_URL present (redacted)"
```

### 2. Check SSL Mode and Pooler

```bash
case "$SUPABASE_DB_URL" in
  *"sslmode="*) echo "✓ sslmode present";;
  *) echo "⚠️ Consider adding sslmode=require";;
esac

echo "$SUPABASE_DB_URL" | grep -q "pooler" && echo "✓ Using pooler" || echo "⚠️ Consider pooler host"
```

### 3. Check Client Versions

```bash
psql --version || { echo "❌ psql missing"; exit 1; }
pg_dump --version || { echo "❌ pg_dump missing"; exit 1; }
echo "✓ PostgreSQL client tools available"
```

### 4. Check Server Connectivity

```bash
PSQL="psql \"$SUPABASE_DB_URL\" -v ON_ERROR_STOP=1 -t -c"
eval $PSQL "SELECT version();" > /dev/null && echo "✓ Database connection successful"
```

---

## Success Criteria

- All environment variables present
- PostgreSQL client tools installed
- Database connection successful
- SSL and pooler configuration validated

## Error Handling

If any check fails:
1. Show clear error message
2. Provide remediation steps
3. Exit with non-zero status
