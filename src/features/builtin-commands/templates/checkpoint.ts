export const CHECKPOINT_TEMPLATE = `You are performing a manual checkpoint review.

## WHAT TO DO

1. **Read boulder state**: Check docs/kord/boulder.json for current execution context
2. **Gather execution summary**:
   - Completed items (checked boxes in plan)
   - Pending items (unchecked boxes)
   - Current wave number and progress
   - Issues encountered during execution
3. **Delegate to @po**: Use task delegation to the po agent with the gathered context

## CHECKPOINT CONTEXT FORMAT

Provide @po with this structured summary:
\`\`\`
Checkpoint Request

Plan: {plan_name}
Wave: {current_wave}/{total_waves}
Progress: {completed}/{total} items ({percentage}%)

Completed This Session:
- {list of completed items}

Pending:
- {list of pending items}

Issues:
- {any blockers, failures, or concerns}
\`\`\`

## @PO DECISION

The @po agent will respond with one of:
- **GO** — Continue execution, proceed to next wave/items
- **PAUSE** — Stop execution, user should review before continuing
- **REVIEW** — Flag specific items for manual review, then continue
- **ABORT** — Stop all execution, critical issue detected

## AFTER DECISION

- If GO: Resume execution from where it left off
- If PAUSE: Stop and report status to user
- If REVIEW: Show flagged items to user, wait for confirmation, then continue
- If ABORT: Stop immediately, report the critical issue

## CRITICAL

- Always read boulder state BEFORE gathering context
- If no boulder state exists, report "No active plan — nothing to checkpoint"
- The checkpoint works both inside and outside the build loop`
