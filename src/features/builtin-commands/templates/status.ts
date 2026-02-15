export const STATUS_TEMPLATE = `You are reporting the current plan execution status.

## WHAT TO DO

1. **Read boulder state**: Check docs/kord/boulder.json for active plan context
2. **If no boulder state exists**: Report "No plan in progress" and stop
3. **If boulder state exists**: Read the active plan file and compute progress

## STATUS COMPUTATION

From boulder.json:
- Plan name and path
- Current wave number
- Session count
- Squad (if set)
- Executor (current agent)

From the plan file:
- Count total checkboxes: \`- [ ]\` and \`- [x]\`
- Count completed: \`- [x]\`
- Compute percentage: (completed / total) * 100
- Identify current wave items (unchecked in current wave section)
- Identify blocked items (if marked with ⚠️ or BLOCKED)

## OUTPUT FORMAT

When a plan is active:
\`\`\`
=== Kord Status ===

Plan: {plan_name}
Started: {started_at}
Sessions: {session_count}
Squad: {squad_name or "none"}

Wave Progress: {current_wave}/{total_waves}
Overall: {completed}/{total} items ({percentage}%)

Current Wave ({wave_number}):
  ✓ {completed_item_1}
  ✓ {completed_item_2}
  ○ {pending_item_1}  ← active
  ○ {pending_item_2}

{if blocked items exist:}
Blocked:
  ⚠️ {blocked_item} — {reason}
\`\`\`

When no plan is active:
\`\`\`
=== Kord Status ===

No plan in progress.

To start work: /start-work
To create a plan: delegate to @plan agent
\`\`\`

## CRITICAL

- Always read boulder state first
- Show percentage rounded to nearest integer
- If plan file is missing but boulder state exists, report stale state
- Read the actual plan file to compute real progress — do not trust cached wave data alone`
